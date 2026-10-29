"""Облачный live-просмотр камер Tapo через CIPC-ретранслятор TP-Link.

Протокол и код ретранслятора — проект filirnd/topo (MIT), каталог topo/ —
вендорная копия. Плагин использует её как клиент облака: вход по TP-Link ID
(с поддержкой MFA), список камер и live-видео (облачный MPEG-TS relay ->
ffmpeg -> fMP4 для MSE-плеера). Локальные камеры (RTSP) предпочтительнее:
облако — фолбэк для камер вне сети сервера.
"""

from __future__ import annotations

import hashlib
import os
import queue as pyqueue
import sys
import threading
import time

_TOPO_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "topo")
if _TOPO_DIR not in sys.path:
    sys.path.insert(0, _TOPO_DIR)

from tapo_cloud_probe import TapoCloud  # noqa: E402
from tapo_cloud_app import CloudMediaWorker  # noqa: E402

SESSION_TTL = 55 * 60.0

_lock = threading.Lock()
_sessions: dict[str, dict] = {}                      # key -> client/base_url или mfa-стейт
_workers: dict[tuple[str, str], "CloudMediaWorker"] = {}  # (key, deviceId) -> worker
_cloud_streams: dict[str, int] = {}                  # key -> число активных облачных потоков

MAX_CLOUD_STREAMS_PER_ACCOUNT = 4


def _key(login: str, password: str) -> str:
    return hashlib.sha256(f"{login}|{password}".encode()).hexdigest()


class MFARequired(Exception):
    def __init__(self, mfa_types):
        super().__init__("MFA required")
        self.mfa_types = mfa_types


class CloudError(Exception):
    pass


def _client_from(key: str):
    with _lock:
        hit = _sessions.get(key)
        if hit and time.time() - hit["at"] < SESSION_TTL and "client" in hit:
            return hit["client"], hit["base_url"]
    return None, None


def login_or_raise(login: str, password: str):
    key = _key(login, password)
    found = _client_from(key)
    if found[0] is not None:
        return found
    client = TapoCloud()
    base_url, result = client.login(login, password)
    if not isinstance(result, dict):
        raise CloudError("неожиданный ответ облака при входе")
    if "token" not in result:
        mfa_types = result.get("supportedMFATypes") or [2]
        with _lock:
            _sessions[key] = {"at": time.time(), "mfa": {"base_url": base_url, "result": result, "login": login, "password": password}}
        raise MFARequired(mfa_types)
    client.token = str(result.get("token") or "")  # login() сам не сохраняет токен
    with _lock:
        _sessions[key] = {"at": time.time(), "client": client, "base_url": base_url}
    return client, base_url


def request_mfa(login: str, password: str, mfa_type: int) -> None:
    key = _key(login, password)
    with _lock:
        st = _sessions.get(key) or {}
        mfa = st.get("mfa")
    if not mfa:
        raise CloudError("нет активного MFA-процесса — выполните вход заново")
    client = TapoCloud()
    client.request_mfa(mfa["base_url"], login, password, int(mfa_type))


def verify_mfa(login: str, password: str, code: str, mfa_type: int):
    key = _key(login, password)
    with _lock:
        st = _sessions.get(key) or {}
        mfa = st.get("mfa")
    if not mfa:
        raise MFARequired([mfa_type])
    client = TapoCloud()
    result = client.verify_mfa(mfa["base_url"], login, code.strip(),
                               mfa["result"].get("MFAProcessId"), int(mfa_type))
    if not isinstance(result, dict) or "token" not in result:
        raise CloudError("неверный код подтверждения")
    client.token = str(result.get("token") or "")
    with _lock:
        _sessions[key] = {"at": time.time(), "client": client, "base_url": mfa["base_url"]}
    return client, mfa["base_url"]


def cloud_cameras(login: str, password: str) -> list[dict]:
    client, base_url = login_or_raise(login, password)
    devices = client.list_cameras(base_url) or []
    cams = []
    for d in devices:
        cams.append({
            "deviceId": str(d.get("deviceId") or ""),
            "name": d.get("alias") or d.get("deviceName") or "Tapo",
            "model": d.get("deviceType") or d.get("deviceModel") or "Tapo",
            "status": d.get("status"),
            "source": "cloud",
        })
    return cams


def _get_worker(login: str, password: str, device_id: str) -> "CloudMediaWorker":
    key = _key(login, password)
    client, base_url = login_or_raise(login, password)
    devices = client.list_cameras(base_url) or []
    device = next((d for d in devices if str(d.get("deviceId")) == device_id), None)
    if device is None:
        raise CloudError(f"камера {device_id} не найдена в облаке")
    wkey = (key, device_id)
    with _lock:
        worker = _workers.get(wkey)
        if worker is None or worker.stop.is_set():
            worker = CloudMediaWorker(client, base_url, device)
            _workers[wkey] = worker
    return worker


def _release_worker(login: str, password: str, device_id: str) -> None:
    # закрываем воркер только когда нет НИ ОДНОГО подписчика: MJPEG-зритель
    # должен продолжать получать кадры с того же relay, на который камера
    # уже шлёт (камера кормит только один ретранслятор одновременно)
    wkey = (_key(login, password), device_id)
    with _lock:
        worker = _workers.get(wkey)
    if worker is None:
        return
    other_subs = len(getattr(worker, "subscribers", []) or []) if hasattr(worker, "subscribers") else 0
    if not worker.native_video_subscribers and other_subs == 0:
        with _lock:
            _workers.pop(wkey, None)
        try:
            worker.close()
        except Exception:
            pass


def acquire_stream_slot(login: str, password: str) -> bool:
    key = _key(login, password)
    with _lock:
        if _cloud_streams.get(key, 0) >= MAX_CLOUD_STREAMS_PER_ACCOUNT:
            return False
        _cloud_streams[key] = _cloud_streams.get(key, 0) + 1
    return True


def release_stream_slot(login: str, password: str) -> None:
    key = _key(login, password)
    with _lock:
        _cloud_streams[key] = max(0, _cloud_streams.get(key, 1) - 1)


def stream_cloud_fmp4(login: str, password: str, device_id: str,
                      output: "pyqueue.Queue", should_abort) -> dict:
    """fMP4-поток камеры из облака (CIPC relay -> ffmpeg -> fMP4/MSE)."""
    worker = _get_worker(login, password, device_id)
    sub = worker.subscribe_native_video()
    stats = {"reason": "eof"}
    last_data = time.time()
    try:
        while True:
            if should_abort is not None and should_abort():
                stats["reason"] = "client_gone"
                break
            if worker.stop.is_set():
                stats["reason"] = "worker_stopped"
                break
            err = worker.last_error
            if err:
                # ретранслятор сообщил об ошибке — завершаем ответ,
                # плеер переподключится (новый relay = новый init-сегмент)
                stats["reason"] = f"relay: {err}"
                break
            try:
                chunk = sub.get(timeout=1)
            except pyqueue.Empty:
                # облако иногда «голодает»: relay открыт, но данных нет
                # (лимиты при частых переподключениях) — рвём, чтобы
                # освободить слот и дать плееру честный ретрай
                if time.time() - last_data > 25:
                    stats["reason"] = "starved_no_data_25s"
                    break
                continue
            else:
                last_data = time.time()
            if chunk is None:
                # сигнал _broadcast_native_reset: relay пересоздаётся,
                # этот HTTP-ответ нужно закрыть (новый получит новый init)
                stats["reason"] = "relay_reset"
                break
            if not isinstance(chunk, (bytes, bytearray)):
                continue
            try:
                output.put(bytes(chunk), timeout=5)
            except pyqueue.Full:
                stats["reason"] = "client_slow"
                break
    finally:
        try:
            worker.unsubscribe_native_video(sub)
        except Exception:
            pass
        _release_worker(login, password, device_id)
    return stats


def stream_cloud_mjpeg(login: str, password: str, device_id: str,
                       output: "pyqueue.Queue", should_abort) -> dict:
    # MJPEG-поток камеры из облака (для браузеров без H.264 в MSE).
    # Нативный fMP4-поток воркера (проверенный путь) транскодируется своим
    # ffmpeg в JPEG ~1.5 к/с. Вендорный MJPEG-ремуксер не используется:
    # в смешанном режиме (H.264 + MJPEG подписчики) он голодал.
    import subprocess
    worker = _get_worker(login, password, device_id)
    sub = worker.subscribe_native_video()
    stats = {"reason": "eof"}
    proc = None
    try:
        proc = subprocess.Popen(
            ["ffmpeg", "-hide_banner", "-loglevel", "error",
             "-f", "mp4", "-i", "pipe:0",
             "-vf", "fps=1.5,scale=1280:-2", "-q:v", "6",
             "-f", "image2pipe", "-vcodec", "mjpeg", "pipe:1"],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)

        def _pump_in() -> None:
            try:
                while True:
                    if (should_abort is not None and should_abort()) or worker.stop.is_set():
                        break
                    try:
                        chunk = sub.get(timeout=1)
                    except pyqueue.Empty:
                        continue
                    if chunk is None:
                        break
                    if isinstance(chunk, (bytes, bytearray)) and proc.stdin:
                        try:
                            proc.stdin.write(bytes(chunk))
                            proc.stdin.flush()
                        except (BrokenPipeError, OSError):
                            break
            except Exception:
                pass
            try:
                if proc.stdin:
                    proc.stdin.close()
            except Exception:
                pass

        threading.Thread(target=_pump_in, daemon=True).start()

        pending = bytearray()
        while True:
            if should_abort is not None and should_abort():
                stats["reason"] = "client_gone"
                break
            if proc.poll() is not None:
                stats["reason"] = "ffmpeg rc=%s" % proc.returncode
                break
            data = proc.stdout.read1(65536) if hasattr(proc.stdout, "read1") else proc.stdout.read(65536)
            if not data:
                stats["reason"] = "ffmpeg eof"
                break
            pending.extend(data)
            # нарезаем поток на JPEG по маркерам FFD8..FFD9
            while True:
                s = pending.find(b"\xff\xd8")
                if s < 0:
                    pending = pending[-1:] if pending else pending
                    break
                e = pending.find(b"\xff\xd9", s + 2)
                if e < 0:
                    if s > 0:
                        del pending[:s]
                    break
                frame = bytes(pending[s:e + 2])
                del pending[:e + 2]
                try:
                    output.put(frame, timeout=5)
                except pyqueue.Full:
                    stats["reason"] = "client_slow"
                    break
            if stats["reason"] != "eof":
                break
    finally:
        try:
            worker.unsubscribe_native_video(sub)
        except Exception:
            pass
        if proc is not None and proc.poll() is None:
            try:
                proc.kill()
            except Exception:
                pass
        _release_worker(login, password, device_id)
    return stats
