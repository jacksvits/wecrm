#!/usr/bin/env python3
"""Сервис плагина «Камеры Hik-Connect».

Обёртка над библиотекой hikcloudstream: вход в облако Hik-Connect по
логину/паролю аккаунта, список камер (со снапшотами) и live-потоки
через облачный VTM relay в формате MJPEG. Слушает только внутреннюю
docker-сеть — наружу его не проксируют; учётные данные принимает от
Node-бэкенда wecrm.

Эндпоинты:
  GET  /health            — проверка жизни
  POST /cameras           — {login, password, apiBaseUrl} -> список камер
                            (быстро: без снапшотов; превью — /snapshot/<index>)
  GET  /mjpeg/<index>     — ?login&password&api&streamType -> MJPEG-поток
                            камеры с 1-based index из /cameras
"""

from __future__ import annotations

import base64
import os
import queue
import threading
import time

from flask import Flask, Response, jsonify, request
from hikcloudstream import Credentials, HikConnectClient
from hikcloudstream._config import MJPEG_BOUNDARY
from hikcloudstream.exceptions import HikCloudStreamError
from hikcloudstream.models import ClientConfig, StreamType
from hikcloudstream.stream.session import open_live_stream
from hikcloudstream.stream.sinks.annex_b import iter_annex_b_chunks
from hikcloudstream.stream.sinks.mjpeg import (
    av_frame_to_jpeg,
    placeholder_jpeg,
    write_mjpeg_frame,
)

app = Flask(__name__)

DEFAULT_API_BASE = os.environ.get("HIK_API_BASE", "https://api.hik-connect.com")
# MJPEG-превью: fps и качество JPEG (как в библиотеке по умолчанию)
PREVIEW_FPS = 8.0
JPEG_QUALITY = 75


def make_client(login: str, password: str, api_base: str) -> HikConnectClient:
    client = HikConnectClient(ClientConfig(api_base_url=(api_base or DEFAULT_API_BASE).rstrip("/")))
    client.login(Credentials(login, password))
    return client


# --- Кэш сессий Hik-Connect ---
# Каждый запрос камеры раньше делал полный цикл login + list_cameras
# (2–4 с облачных round-trip на каждый старт потока). Клиент с валидной
# сессией и список камер кэшируются; при любой ошибке клиент пересоздаётся.
import hashlib

CLIENT_TTL = 25 * 60.0          # сессия живёт ~30 мин — обновляем чуть раньше
CAMERAS_CACHE_TTL = 5 * 60.0    # состав камер меняется редко

_client_cache: dict[str, tuple[float, HikConnectClient]] = {}
_cameras_cache: dict[str, tuple[float, list]] = {}


def _creds_key(login: str, password: str, api_base: str) -> str:
    raw = f"{login}|{password}|{api_base or DEFAULT_API_BASE}"
    return hashlib.sha256(raw.encode()).hexdigest()


def get_client(login: str, password: str, api_base: str) -> HikConnectClient:
    """Клиент из кэша (свежий) или новый логин. Вызывающий НЕ закрывает его."""
    key = _creds_key(login, password, api_base)
    now = time.time()
    hit = _client_cache.get(key)
    if hit and now - hit[0] < CLIENT_TTL:
        return hit[1]
    client = make_client(login, password, api_base)
    _client_cache[key] = (now, client)
    return client


def drop_client(login: str, password: str, api_base: str) -> None:
    key = _creds_key(login, password, api_base)
    client = _client_cache.pop(key, None)
    if client:
        try:
            client[1].close()
        except Exception:
            pass


def get_cameras(client: HikConnectClient, login: str, password: str, api_base: str) -> list:
    key = _creds_key(login, password, api_base)
    now = time.time()
    hit = _cameras_cache.get(key)
    if hit and now - hit[0] < CAMERAS_CACHE_TTL:
        return hit[1]
    cams = client.list_cameras()
    _cameras_cache[key] = (now, cams)
    return cams


def camera_to_dict(cam) -> dict:
    return {
        "index": cam.index,
        "name": cam.name,
        "deviceSerial": cam.device_serial,
        "channelNo": cam.channel_no,
        "deviceName": cam.device_name,
    }


@app.get("/health")
def health():
    return jsonify(ok=True)


# Кэш облачных снапшотов: cloud capture идёт 20–30+ с на камеру,
# поэтому список камер отдаём без снапшотов, а превью грузятся
# по одному через /snapshot/<index> (TTL 30 с, защита от спама облаком).
# Ключ — (учётные данные, index): разные tenant'ы могут иметь одинаковые
# индексы камер при разных аккаунтах Hik-Connect.
_SNAPSHOT_CACHE: dict[tuple[str, int], tuple[float, bytes]] = {}
SNAPSHOT_TTL = 30.0


@app.get("/snapshot/<int:index>")
def snapshot(index: int):
    login = request.args.get("login", "")
    password = request.args.get("password", "")
    api_base = request.args.get("api") or DEFAULT_API_BASE
    if not login or not password:
        return jsonify(error="login/password required"), 400

    cache_key = (_creds_key(login, password, api_base), index)
    now = time.time()
    hit = _SNAPSHOT_CACHE.get(cache_key)
    if hit and now - hit[0] < SNAPSHOT_TTL:
        return Response(hit[1], mimetype="image/jpeg", headers={"Cache-Control": "no-store"})

    try:
        client = get_client(login, password, api_base)
        cams = get_cameras(client, login, password, api_base)
        cam = next((c for c in cams if c.index == index), None)
        if cam is None:
            return jsonify(error=f"camera {index} not found"), 404
        jpeg = client.capture_snapshot(cam)
        _SNAPSHOT_CACHE[cache_key] = (time.time(), jpeg)
        return Response(jpeg, mimetype="image/jpeg", headers={"Cache-Control": "no-store"})
    except Exception as exc:
        drop_client(login, password, api_base)
        return jsonify(error=str(exc)), 502


@app.post("/cameras")
def cameras():
    body = request.get_json(force=True, silent=True) or {}
    login = str(body.get("login") or "")
    password = str(body.get("password") or "")
    api_base = str(body.get("apiBaseUrl") or DEFAULT_API_BASE)
    with_snapshot = request.args.get("snapshot") == "1"
    if not login or not password:
        return jsonify(error="login/password required"), 400
    try:
        client = get_client(login, password, api_base)
        result = []
        for cam in get_cameras(client, login, password, api_base):
            item = camera_to_dict(cam)
            if with_snapshot:
                try:
                    jpeg = client.capture_snapshot(cam)
                    item["snapshot"] = base64.b64encode(jpeg).decode("ascii")
                except Exception:
                    # Снапшот недоступен (камера офлайн/зашифрована) — не роняем список
                    item["snapshot"] = None
            result.append(item)
        return jsonify(result)
    except Exception as exc:
        drop_client(login, password, api_base)
        return jsonify(error=str(exc)), 502


def stream_mjpeg_auto(
    stream,
    output,
    *,
    frame_fps: float = 8.0,
    stream_type: int = 2,
    jpeg_quality: int = 75,
):
    """MJPEG-поток с авто-детекцией кодека (H.264 / H.265-HEVC).

    Библиотечный stream_mjpeg жёстко декодирует H.264: для H.265-камер
    codec.parse() молча возвращает пустоту и клиент вечно видит placeholder
    «Waiting for video...». Здесь чанки кормим в ОБА декодера, а как только
    первый реальный кадр получен от одного — второй отключаем.
    """
    import av

    codecs = {
        "h264": av.CodecContext.create("h264", "r"),
        "hevc": av.CodecContext.create("hevc", "r"),
    }
    active = set(codecs)
    produced: dict[str, bool] = {k: False for k in codecs}
    got_keyframe = {k: False for k in codecs}
    frame_period = 1.0 / frame_fps
    next_emit = 0.0
    started_at = time.monotonic()
    sent_placeholder = False
    max_width = 1920 if stream_type == 1 else 1408
    quality = max(50, min(jpeg_quality, 95))

    try:
        chunk_iter = iter_annex_b_chunks(stream)
        while True:
            try:
                _transport, chunk = next(chunk_iter)
            except StopIteration:
                return
            except OSError:
                return

            for name in list(active):
                codec = codecs[name]
                try:
                    packets = codec.parse(chunk)
                except av.error.InvalidDataError:
                    continue
                for packet in packets:
                    try:
                        frames = codec.decode(packet)
                    except av.error.InvalidDataError:
                        continue
                    for frame in frames:
                        if not got_keyframe[name]:
                            if getattr(frame, "key_frame", False):
                                got_keyframe[name] = True
                            elif time.monotonic() - started_at < 3.0:
                                continue
                            else:
                                got_keyframe[name] = True
                        now = time.monotonic()
                        if now < next_emit:
                            continue
                        next_emit = now + frame_period
                        try:
                            jpeg = av_frame_to_jpeg(frame, max_width=max_width, quality=quality)
                        except Exception:
                            continue
                        write_mjpeg_frame(output, jpeg)
                        produced[name] = True
                        sent_placeholder = True

            if any(produced.values()):
                # реальные кадры пошли — отключаем проигрышный декодер
                winner = next(k for k, v in produced.items() if v)
                for loser in list(active):
                    if loser != winner:
                        active.discard(loser)

            if not sent_placeholder and time.monotonic() - started_at > 2.0:
                write_mjpeg_frame(output, placeholder_jpeg("Waiting for video..."))
                sent_placeholder = True
    except (BrokenPipeError, ConnectionResetError):
        return


class _QueueWriter:
    """Файл-подобный writer: stream_mjpeg пишет кадры, генератор Flask читает.

    ВАЖНО: put_nowait. Блокирующий put оставлял produce-нити навсегда
    зависшими при ушедшем клиенте — каждая держала VTM-сессию, исчерпывая
    лимит потоков аккаунта Hik-Connect (облако начинало КВЕВИТЬ новые
    сессии — session.start() вис минутами). Просроченные кадры просто
    выбрасываем: для live-превью это правильнее, чем накапливать лаг.
    """

    def __init__(self, q: "queue.Queue[bytes | None]") -> None:
        self._q = q

    def write(self, data: bytes) -> int:
        if data:
            try:
                self._q.put_nowait(data)
            except queue.Full:
                pass  # клиент не успевает — дропаем кадр
        return len(data)

    def flush(self) -> None:
        pass


# Лимит одновременных VTM-сессий на аккаунт: облако Hik-Connect держит
# ~2 потока; лишние запросы получают 429 и клиент переподключается позже,
# а не встают в облачную очередь зависших сессий.
_ACCOUNT_STREAMS: dict[str, int] = {}
MAX_STREAMS_PER_ACCOUNT = 2


def _account_key(login: str, password: str, api_base: str) -> str:
    return _creds_key(login, password, api_base)


@app.get("/mjpeg/<int:index>")
def mjpeg(index: int):
    login = request.args.get("login", "")
    password = request.args.get("password", "")
    api_base = request.args.get("api") or DEFAULT_API_BASE
    stream_type = int(request.args.get("streamType", "0") or 0)
    if not login or not password:
        return jsonify(error="login/password required"), 400

    q: "queue.Queue[bytes | None]" = queue.Queue(maxsize=200)

    acc_key = _account_key(login, password, api_base)
    if _ACCOUNT_STREAMS.get(acc_key, 0) >= MAX_STREAMS_PER_ACCOUNT:
        return (
            jsonify(error=f"stream limit ({MAX_STREAMS_PER_ACCOUNT}) for account, retry later"),
            429,
        )
    _ACCOUNT_STREAMS[acc_key] = _ACCOUNT_STREAMS.get(acc_key, 0) + 1

    def produce() -> None:
        t0 = time.time()
        try:
            client = get_client(login, password, api_base)
            cams = get_cameras(client, login, password, api_base)
            cam = next((c for c in cams if c.index == index), None)
            if cam is None:
                app.logger.warning("mjpeg: camera %s not found", index)
                return
            t1 = time.time()
            with open_live_stream(client, cam, stream_type=stream_type or StreamType.AUTO) as session:
                info = session.start()
                t2 = time.time()
                # Замер: сколько уходит на пробуждение камеры через облачный relay
                app.logger.warning(
                    "mjpeg camera=%s: lookup=%.1fs vtm_wakeup=%.1fs",
                    index, t1 - t0, t2 - t1,
                )
                if getattr(info, "result", 0) not in (0, None):
                    raise HikCloudStreamError(f"VTM negotiation failed (code {info.result})")
                stream_mjpeg_auto(
                    session._client,
                    _QueueWriter(q),
                    frame_fps=PREVIEW_FPS,
                    stream_type=session.stream_type,
                    jpeg_quality=JPEG_QUALITY,
                )
        except Exception as exc:
            app.logger.warning("mjpeg camera=%s ended: %s", index, exc)
            drop_client(login, password, api_base)
        finally:
            # освобождаем слот потока аккаунта ВСЕГДА — иначе счётчик
            # «протекал» и аккаунт вечно оставался на лимите
            _ACCOUNT_STREAMS[acc_key] = max(0, _ACCOUNT_STREAMS.get(acc_key, 1) - 1)
            try:
                q.put_nowait(None)  # сигнал конца генератору
            except queue.Full:
                pass

    def generate():
        threading.Thread(target=produce, daemon=True).start()
        while True:
            chunk = q.get()
            if chunk is None:
                break
            yield chunk

    return Response(
        generate(),
        mimetype=f"multipart/x-mixed-replace; boundary={MJPEG_BOUNDARY.decode()}",
        headers={"Cache-Control": "no-store"},
    )


if __name__ == "__main__":
    # threaded=True: каждый зритель — свой поток и своя VTM-сессия
    app.run(host="0.0.0.0", port=8557, threaded=True)
