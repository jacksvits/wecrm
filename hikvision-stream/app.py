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
    chunks_iter=None,
    should_abort=None,
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
    last_placeholder_at = 0.0
    max_width = 1920 if stream_type == 1 else 1408
    quality = max(50, min(jpeg_quality, 95))

    try:
        chunk_iter = chunks_iter if chunks_iter is not None else iter_annex_b_chunks(stream)
        while True:
            if should_abort is not None and should_abort():
                # клиент ушёл, а werkzeug об этом молчит, пока не попробует
                # записать — закрываем сессию сами, иначе слот потока утекает
                return
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

            if time.monotonic() - started_at > 2.0 and time.monotonic() - last_placeholder_at > 10.0:
                # повторяем placeholder: без него клиент при зашифрованном
                # потоке видит один чёрный кадр и не понимает, что происходит
                write_mjpeg_frame(
                    output,
                    placeholder_jpeg("Waiting for video...\nЕсли картинка не появляется: введите код верификации в настройках плагина"),
                )
                last_placeholder_at = time.monotonic()
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


class _AnnexBDecryptor:
    """Инкрементальная расшифровка Hikvision Annex-B (порт логики
    hikcloudstream.stream.crypto на потоковый режим, т.к. библиотека
    расшифровывает только целые записи, а не live-поток).

    Схема: у каждого NAL зашифрованы первые 4096 байт тела (после чистого
    codec-заголовка: 2 байта для HEVC, 1 для H.264, 0 — H.264 полностью).
    Шифрование: независимые 16-байтные AES-CBC блоки с нулевым IV,
    выравнивание блоков — от начала зашифрованной области каждого NAL.
    """

    PREFIX = 4096
    HOLD = 8192  # хвост буфера, который не отдаём, пока NAL не завершится

    def __init__(self, key: str | bytes) -> None:
        from Crypto.Cipher import AES  # pycryptodome — зависимость библиотеки
        kb = key.encode() if isinstance(key, str) else key
        self._key = kb.ljust(16, b"\0")[:16]
        self._aes = AES
        self._buf = bytearray()
        self._header_size: int | None = None
        self._final = False
        # конец уже расшифрованной зоны (байты до неё финализированы)
        self._processed_until = 0

    def finalize(self) -> bytes:
        """Смыть хвост при закрытии потока (EOF считаем концом последнего NAL)."""
        self._final = True
        return self.feed(b"")

    def _decrypt_region(self, buf: bytearray, start: int, end: int) -> None:
        end16 = start + ((end - start) // 16) * 16
        for pos in range(start, end16, 16):
            cipher = self._aes.new(self._key, self._aes.MODE_CBC, bytes(16))
            buf[pos : pos + 16] = cipher.decrypt(bytes(buf[pos : pos + 16]))

    def _decrypt_guarded(self, buf: bytearray, rs: int, re_: int) -> None:
        """Расшифровать [rs, re_), пропустив уже обработанные 16-байтные блоки
        (зоны могут пересекаться между вызовами feed — повторная расшифровка
        испортила бы данные). Блоки выравниваются от rs."""
        tip = self._processed_until
        if re_ <= tip:
            return
        start = rs if rs > tip else rs + ((tip - rs + 15) // 16) * 16
        if start < re_:
            self._decrypt_region(buf, start, re_)
        if re_ > tip:
            self._processed_until = re_

    def feed(self, chunk: bytes) -> bytes:
        self._buf += chunk
        buf = self._buf
        if len(buf) < 4096 + 64 and not self._final:
            return b""
        if self._header_size is None:
            from pyezvizapi.stream import detect_hikvision_ps_video_nalu_header_size
            hs = detect_hikvision_ps_video_nalu_header_size(bytes(buf[:65536]), self._key, default=2)
            self._header_size = 2 if hs is None else hs
        hs = self._header_size
        n = len(buf)
        watermark = 0
        i = 0
        while True:
            p = buf.find(b"\x00\x00\x01", i)
            if p == -1:
                break
            body = p + 3
            if body >= n:
                break
            q = buf.find(b"\x00\x00\x01", body)
            # ноль перед start code 00 00 00 01 принадлежит ему, не NAL
            if q != -1:
                # NAL завершился — точная длина, точный конец префикса
                nal_end = q - 1 if buf[q - 1] == 0 else q
                rs = body + hs
                re_ = min(rs + self.PREFIX, nal_end)
                if re_ > rs + 16:
                    self._decrypt_guarded(buf, rs, re_)
                watermark = max(watermark, nal_end)
                i = q
            else:
                # NAL ещё течёт: префикс (4096 байт) расшифровываем, как только
                # он целиком в буфере; хвост NAL остаётся шифротекстом
                rs = body + hs
                if rs + self.PREFIX <= n:
                    self._decrypt_guarded(buf, rs, rs + self.PREFIX)
                    watermark = max(watermark, rs + self.PREFIX)
                    i = rs + self.PREFIX
                elif self._final:
                    re_ = min(rs + self.PREFIX, n)
                    if re_ > rs + 16:
                        self._decrypt_guarded(buf, rs, re_)
                    watermark = n
                    break
                else:
                    break
        # эмитим только финализированный префикс буфера
        if watermark <= 0:
            return b""
        out = bytes(buf[:watermark])
        self._buf = buf[watermark:]
        self._processed_until = max(0, self._processed_until - watermark)
        return out


def decrypting_chunks(stream, key: str):
    """Обертка над iter_annex_b_chunks: расшифровывает на лету."""
    dec = _AnnexBDecryptor(key)
    for _transport, chunk in iter_annex_b_chunks(stream):
        out = dec.feed(chunk)
        if out:
            yield out


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
    validate_code = request.args.get("validateCode", "")
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
            # БЕЗ «with»: если start() бросит, __exit__ не отработал бы и
            # сокет VTM-сессии утёк бы (каждая ошибка старта = минус FD).
            session = open_live_stream(client, cam, stream_type=stream_type or StreamType.AUTO)
            try:
                info = session.start()
                t2 = time.time()
                # Замер: сколько уходит на пробуждение камеры через облачный relay
                app.logger.warning(
                    "mjpeg camera=%s: lookup=%.1fs vtm_wakeup=%.1fs",
                    index, t1 - t0, t2 - t1,
                )
                if getattr(info, "result", 0) not in (0, None):
                    raise HikCloudStreamError(f"VTM negotiation failed (code {info.result})")
                # Зашифрованные потоки: ключ получаем кодом верификации устройства
                chunks_iter = None
                if validate_code:
                    enc_key = client.query_device_encrypt_key(cam.device_serial, validate_code)
                    chunks_iter = decrypting_chunks(session._client, enc_key)
                    app.logger.warning("mjpeg camera=%s: stream decryption enabled", index)
                stream_mjpeg_auto(
                    session._client,
                    _QueueWriter(q),
                    frame_fps=PREVIEW_FPS,
                    stream_type=session.stream_type,
                    jpeg_quality=JPEG_QUALITY,
                    chunks_iter=chunks_iter,
                    should_abort=_abandoned,
                )
            finally:
                try:
                    session.close()
                except Exception:
                    pass
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

    last_read = [time.time()]

    def generate():
        threading.Thread(target=produce, daemon=True).start()
        while True:
            chunk = q.get()
            if chunk is None:
                break
            last_read[0] = time.time()
            yield chunk

    def _abandoned() -> bool:
        # клиент не читает поток 15 с — считаем его ушедшим и рвём сессию
        return time.time() - last_read[0] > 15.0

    return Response(
        generate(),
        mimetype=f"multipart/x-mixed-replace; boundary={MJPEG_BOUNDARY.decode()}",
        headers={"Cache-Control": "no-store"},
    )


if __name__ == "__main__":
    # threaded=True: каждый зритель — свой поток и своя VTM-сессия
    app.run(host="0.0.0.0", port=8557, threaded=True)
