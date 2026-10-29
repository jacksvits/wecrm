#!/usr/bin/env python3
"""Сервис плагина «Камеры Tapo» (TP-Link).

Вход в облако TP-Link по логину/паролю TP-Link ID (wap.tplinkcloud.com),
список камер аккаунта (сопоставление с LAN сервера по MAC через ARP),
RTSP-потоки камер -> fMP4 (H.264 MSE) + JPEG-снапшоты.

Контейнер работает в host-сети (docker-мост не увидел бы ARP-таблицу и не
достучался бы до RTSP в LAN) — наружу сервис не проксируется, только
Node-бэкенд wecrm (/api/tapo-plugin/*) с проверкой роли admin.

Эндпоинты:
  GET  /health            — проверка жизни
  POST /cameras           — {login, password} -> список камер
  GET  /snapshot/<index>  — ?login&password -> JPEG (TTL 15 с)
  GET  /h264/<index>      — ?login&password&streamType=1|2 -> fMP4 live-поток
"""

from __future__ import annotations

import hashlib
import io
import os
import queue
import struct
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import quote

import av
import requests
from flask import Flask, Response, jsonify, request

from streamlib import fmp4

app = Flask(__name__)

CLOUD_API = "https://wap.tplinkcloud.com"
PORT = int(os.environ.get("PORT", "8558"))

# RTSP у Tapo: stream1 — основной поток, stream2 — дополнительный (экономия)
RTSP_PATHS = {1: "stream1", 2: "stream2"}
RTSP_OPTIONS = {"rtsp_transport": "tcp"}

# Варианты авторизации RTSP при заданных только логине/пароле ОБЛАКА
# (плагин ничего больше не хранит). Рабочий вариант зависит от прошивки:
# у части камер локальный пользователь «admin» с паролем облака, у части —
# логин = email аккаунта. Пробуем оба, рабочую пару кэшируем.
RTSP_USER_VARIANTS = ("__LOGIN__", "admin")

CLIENT_TTL = 50 * 60.0         # токен облака живёт ~1 ч
CAMERAS_CACHE_TTL = 60.0
RTSP_CREDS_TTL = 10 * 60.0

# Лимиты RTSP-сессий: у Tapo камер ограниченное число одновременных потоков
_MAX_PER_CAMERA = 3
_MAX_PER_ACCOUNT = 12


class TapoCloudError(Exception):
    pass


def _creds_key(login: str, password: str) -> str:
    return hashlib.sha256(f"{login}|{password}".encode()).hexdigest()


_token_cache: dict[str, tuple[float, str]] = {}
_cameras_cache: dict[str, tuple[float, list]] = {}
_rtsp_creds_cache: dict[tuple[str, int], tuple[float, str, str]] = {}


# ----------------------------------------------------------- облако TP-Link

def cloud_error_text(data: dict) -> str:
    code = data.get("error_code")
    msg = (data.get("msg") or "").strip()
    known = {
        -20601: "неверный логин или пароль TP-Link ID",
        -20603: "превышено число попыток входа, попробуйте позже",
    }
    text = known.get(code) or msg or f"код ошибки облака {code}"
    return f"Облако TP-Link отклонило вход: {text}"


def cloud_token(login: str, password: str) -> str:
    key = _creds_key(login, password)
    now = time.time()
    hit = _token_cache.get(key)
    if hit and now - hit[0] < CLIENT_TTL:
        return hit[1]
    payload = {
        "method": "login",
        "params": {
            "appType": "Tapo_Android",
            "cloudUserName": login,
            "cloudPassword": password,
            "terminalUUID": str(uuid.uuid4()),
        },
    }
    resp = requests.post(CLOUD_API, json=payload, timeout=20)
    data = resp.json()
    result = data.get("result") or {}
    if data.get("error_code") != 0 or not result.get("token"):
        raise TapoCloudError(cloud_error_text(data))
    token = result["token"]
    _token_cache[key] = (now, token)
    return token


def cloud_devices(login: str, password: str) -> list[dict]:
    token = cloud_token(login, password)
    payload = {"method": "getDeviceList"}
    resp = requests.post(f"{CLOUD_API}?token={quote(token)}", json=payload, timeout=20)
    data = resp.json()
    if data.get("error_code") != 0:
        raise TapoCloudError(cloud_error_text(data))
    return (data.get("result") or {}).get("deviceList") or []


# ----------------------------------------------------- LAN: ARP + RTSP-sweep

def read_arp() -> dict[str, str]:
    """MAC (без двоеточий, upper) -> IP по таблице ARP хоста (host-сеть)."""
    out: dict[str, str] = {}
    try:
        with open("/proc/net/arp") as fh:
            next(fh, None)
            for line in fh:
                parts = line.split()
                if len(parts) >= 4 and parts[3] != "00:00:00:00:00:00":
                    out[parts[3].replace(":", "").upper()] = parts[0]
    except OSError:
        pass
    return out


def local_networks() -> list[tuple[int, int]]:
    # Подсети интерфейсов default gateway (камеры достижимы через них).
    # У самого default-маршрута маска /0, поэтому берём подключённые
    # маршруты (connected) его интерфейсов. Иначе sweep либо пуст, либо
    # идёт по docker-мостам (172.17/172.18... — каждый /16 это ~4000 проб).
    nets: set[tuple[int, int]] = set()
    default_ifaces: set[str] = set()

    def le_hex(value: str) -> int:
        return int.from_bytes(bytes.fromhex(value), "little")

    try:
        with open("/proc/net/route") as fh:
            next(fh, None)
            rows = [line.split() for line in fh if len(line.split()) >= 8]
    except OSError:
        return []

    for fields in rows:
        flags = int(fields[3], 16)
        if not (flags & 0x1):  # RTF_UP
            continue
        if fields[1] == "00000000":
            default_ifaces.add(fields[0])

    for fields in rows:
        if fields[0] not in default_ifaces:
            continue
        flags = int(fields[3], 16)
        if not (flags & 0x1):
            continue
        dest, mask = fields[1], fields[7]
        if dest == "00000000":
            continue
        mask_i = le_hex(mask)
        bits = bin(mask_i).count("1")
        if not (16 <= bits <= 30):
            continue
        network = le_hex(dest) & mask_i
        if network and network != 0x7F000000:  # не loopback
            nets.add((network, mask_i))
    return list(nets)


def sweep_rtsp_hosts() -> None:
    """Краткий TCP-probe порта 554 по LAN: заполняет ARP и находит камеры."""
    import socket

    def probe(ip_text: str) -> None:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.25)
            s.connect_ex((ip_text, 554))
            s.close()
        except OSError:
            pass

    for network, mask in local_networks():
        hosts = [network + i for i in range(1, min((~mask) & 0xFFFFFFFF, 4094))]
        with ThreadPoolExecutor(max_workers=64) as ex:
            list(ex.map(lambda ip: probe(socket.inet_ntoa(struct.pack("!I", ip))), hosts))


# --------------------------------------------------------------- список камер

def _probe_rtsp(ip: str, port: int, timeout: float = 4.0) -> bool:
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(timeout)
        ok = s.connect_ex((ip, port)) == 0
        s.close()
        return ok
    except OSError:
        return False


def get_cameras(login: str, password: str, sweep: bool = False,
                extra: list[dict] | None = None) -> tuple[list[dict], int]:
    # Список камер + число устройств в облаке (устройства без LAN-IP не попадают)
    key = _creds_key(login, password)
    now = time.time()
    hit = _cameras_cache.get(key)
    if hit and now - hit[0] < CAMERAS_CACHE_TTL and not sweep:
        cams, total = hit[1]
        if extra is None:
            return cams, total
    else:
        devices = cloud_devices(login, password)
        if sweep:
            # часть MAC не видна в ARP (idle/просроченные записи) — будим сеть
            sweep_rtsp_hosts()
        arp = read_arp()
        cams = []
        for d in devices:
            mac = (d.get("deviceMac") or "").replace(":", "").replace("-", "").upper()
            if not mac:
                continue
            ip = arp.get(mac)
            if not ip:
                continue  # устройство не в LAN сервера — RTSP до него не достучаться
            cams.append({
                "index": len(cams) + 1,
                "name": d.get("alias") or d.get("deviceName") or "Tapo",
                "deviceId": d.get("deviceId") or "",
                "model": d.get("deviceModel") or d.get("deviceName") or "",
                "ip": ip,
                "port": 554,
                "mac": mac,
                "manual": False,
            })
        total = len(devices)
        _cameras_cache[key] = (time.time(), (cams, total))
    # Камеры вне LAN (белый IP/проброс портов/VPN): добавляем поверх облачных
    if extra:
        from concurrent.futures import ThreadPoolExecutor
        ips = []
        for e in extra:
            ip = str(e.get("ip") or "").strip()
            if not ip:
                continue
            port = int(e.get("port") or 554)
            name = str(e.get("name") or "").strip() or ip
            ips.append((ip, port, name))
        with ThreadPoolExecutor(max_workers=8) as ex:
            online = list(ex.map(lambda t: _probe_rtsp(t[0], t[1]), ips))
        for (ip, port, name), ok in zip(ips, online):
            cams.append({
                "index": len(cams) + 1,
                "name": name,
                "deviceId": "",
                "model": "Tapo (вне LAN)",
                "ip": ip,
                "port": port,
                "mac": "",
                "manual": True,
                "online": ok,
            })
    return cams, total


# ---------------------------------------------------------------------- RTSP

def rtsp_url(cam: dict, user: str, password: str, stream_type: int) -> str:
    path = RTSP_PATHS.get(stream_type, "stream1")
    port = int(cam.get("port") or 554)
    return f"rtsp://{quote(user, safe='')}:{quote(password, safe='')}@{cam['ip']}:{port}/{path}"


def rtsp_credentials(login: str, password: str, cam: dict) -> tuple[str, str]:
    """Рабочая пара (user, password) для RTSP камеры, пробуем варианты облака."""
    key = (_creds_key(login, password), cam["index"])
    now = time.time()
    hit = _rtsp_creds_cache.get(key)
    if hit and now - hit[0] < RTSP_CREDS_TTL:
        return hit[1], hit[2]
    last_exc: Exception | None = None
    for variant in RTSP_USER_VARIANTS:
        user = login if variant == "__LOGIN__" else variant
        try:
            container = av.open(rtsp_url(cam, user, password, 2),
                                options=RTSP_OPTIONS, timeout=8)
            try:
                if not any(s.type == "video" for s in container.streams):
                    raise RuntimeError("no video stream")
            finally:
                container.close()
            _rtsp_creds_cache[key] = (now, user, password)
            return user, password
        except Exception as exc:  # пробуем следующий вариант
            last_exc = exc
    raise RuntimeError(f"камера не принимает учётные данные аккаунта ({last_exc})")


def capture_snapshot(login: str, password: str, cam: dict) -> bytes:
    user, pwd = rtsp_credentials(login, password, cam)
    container = av.open(rtsp_url(cam, user, pwd, 1), options=RTSP_OPTIONS, timeout=10)
    try:
        vstream = next(s for s in container.streams if s.type == "video")
        for packet in container.demux(vstream):
            if packet.dts is None:
                continue
            for frame in packet.decode():
                img = frame.to_image()
                img.thumbnail((1280, 720))
                buf = io.BytesIO()
                img.save(buf, format="JPEG", quality=80)
                return buf.getvalue()
        raise RuntimeError("нет кадров от камеры")
    finally:
        try:
            container.close()
        except Exception:
            pass


# -------------------------------------------------------- RTSP -> fMP4 (MSE)

_STREAMS: dict[str, int] = {}


def stream_camera_fmp4(login: str, password: str, cam: dict, stream_type: int,
                       output: "queue.Queue[bytes | None]",
                       should_abort) -> dict:
    """RTSP-поток камеры -> fMP4 через ffmpeg (PTS камеры, фрагменты ~0.8 с)."""
    import subprocess
    from streamlib import fmp4

    user, pwd = rtsp_credentials(login, password, cam)
    url = rtsp_url(cam, user, pwd, stream_type)
    args = fmp4.rtsp_remux_args(url)
    app.logger.warning("tapo ffmpeg cmd: %s", " ".join(args).replace(pwd, "***"))
    proc = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    n_frames = 0
    stats = {"frames": 0, "reason": "eof"}

    def emit(data: bytes) -> None:
        try:
            output.put(data, timeout=5)
        except queue.Full:
            pass

    def _drain_err():
        for line in iter(proc.stderr.readline, b""):
            app.logger.warning("tapo ffmpeg: %s", line.decode("utf-8", "replace").rstrip())

    threading.Thread(target=_drain_err, daemon=True).start()
    try:
        while True:
            if should_abort is not None and should_abort():
                stats["reason"] = "client_gone"
                break
            chunk = proc.stdout.read(65536)
            if not chunk:
                break
            emit(chunk)
            n_frames += 1
        proc.wait(timeout=10)
        stats["rc"] = proc.returncode
    finally:
        if proc.poll() is None:
            try:
                proc.kill()
            except Exception:
                pass
    stats["frames"] = n_frames
    return stats



# ------------------------------------------------------------------ эндпоинты

@app.get("/health")
def health():
    return jsonify(ok=True)


@app.post("/cameras")
def cameras():
    body = request.get_json(force=True, silent=True) or {}
    login = str(body.get("login") or "")
    password = str(body.get("password") or "")
    extra = body.get("extra") if isinstance(body.get("extra"), list) else None
    if not login or not password:
        return jsonify(error="login/password required"), 400
    try:
        cams, total = get_cameras(login, password, extra=extra)
        if not any(not c.get("manual") for c in cams) and total:
            # ARP может ещё не видеть камеры (idle) — будим сеть и повторяем
            cams, total = get_cameras(login, password, sweep=True, extra=extra)
        resp = jsonify(cams)
        resp.headers["X-Devices-Total"] = str(total)
        return resp
    except TapoCloudError as exc:
        return jsonify(error=str(exc)), 502
    except Exception as exc:
        app.logger.warning("tapo /cameras failed: %s", exc)
        return jsonify(error=str(exc)), 502


_SNAPSHOT_CACHE: dict[tuple[str, int], tuple[float, bytes]] = {}
SNAPSHOT_TTL = 15.0


@app.get("/snapshot/<int:index>")
def snapshot(index: int):
    login = request.args.get("login", "")
    password = request.args.get("password", "")
    if not login or not password:
        return jsonify(error="login/password required"), 400
    cache_key = (_creds_key(login, password), index)
    hit = _SNAPSHOT_CACHE.get(cache_key)
    if hit and time.time() - hit[0] < SNAPSHOT_TTL:
        return Response(hit[1], mimetype="image/jpeg", headers={"Cache-Control": "no-store"})
    try:
        cams, _total = get_cameras(login, password)
        cam = next((c for c in cams if c["index"] == index), None)
        if cam is None:
            return jsonify(error=f"camera {index} not found"), 404
        jpeg = capture_snapshot(login, password, cam)
        _SNAPSHOT_CACHE[cache_key] = (time.time(), jpeg)
        return Response(jpeg, mimetype="image/jpeg", headers={"Cache-Control": "no-store"})
    except Exception as exc:
        app.logger.warning("tapo /snapshot/%s failed: %s", index, exc)
        return jsonify(error=str(exc)), 502


@app.get("/h264/<int:index>")
def h264(index: int):
    login = request.args.get("login", "")
    password = request.args.get("password", "")
    stream_type = int(request.args.get("streamType", "1") or 1)
    if not login or not password:
        return jsonify(error="login/password required"), 400

    q: "queue.Queue[bytes | None]" = queue.Queue(maxsize=120)

    acc_key = _creds_key(login, password)
    cam_key = f"{acc_key}:{index}"
    if _STREAMS.get(cam_key, 0) >= _MAX_PER_CAMERA or _STREAMS.get(acc_key, 0) >= _MAX_PER_ACCOUNT:
        return (jsonify(error="stream limit: camera or account busy, retry later"), 429)
    slot_keys = [acc_key, cam_key]

    def release_slots() -> None:
        for k in slot_keys:
            _STREAMS[k] = max(0, _STREAMS.get(k, 1) - 1)

    last_read = [time.time()]

    def _abandoned() -> bool:
        # клиент не читает поток 30 с — считаем его ушедшим и рвём RTSP
        # (подъём RTSP + ожидание первого ключевого кадра занимают время)
        return time.time() - last_read[0] > 30.0

    def produce() -> None:
        for k in slot_keys:
            _STREAMS[k] = _STREAMS.get(k, 0) + 1
        try:
            cams, _total = get_cameras(login, password)
            cam = next((c for c in cams if c["index"] == index), None)
            if cam is None:
                app.logger.warning("tapo h264: camera %s not found", index)
                return
            stats = stream_camera_fmp4(login, password, cam, stream_type, q, _abandoned)
            app.logger.warning("tapo h264 camera=%s closed: %s", index, stats)
        except Exception as exc:
            app.logger.warning("tapo h264 camera=%s ended: %s", index, exc)
        finally:
            release_slots()
            try:
                q.put_nowait(None)
            except queue.Full:
                pass

    def generate():
        threading.Thread(target=produce, daemon=True).start()
        while True:
            chunk = q.get()
            if chunk is None:
                break
            last_read[0] = time.time()
            yield chunk

    return Response(
        generate(),
        mimetype="video/mp4",
        headers={"Cache-Control": "no-store", "X-Accel-Buffering": "no"},
    )


if __name__ == "__main__":
    # threaded=True: каждый зритель — свой поток и своя RTSP-сессия
    app.run(host="0.0.0.0", port=PORT, threaded=True)
