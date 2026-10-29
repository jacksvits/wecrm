"""Утилиты live-упаковки H.264/HEVC в fMP4 (MSE).

Упаковку выполняет ffmpeg (libavformat): mov/mp4 с флагами
frag_keyframe+empty_moov+default_base_moof и frag_duration — это те же
сегменты (avcC/hvcC, mvex/trex, moof/trun), что пишет штатный ffmpeg,
поэтому совместимость с демuxer'ами и MSE в браузерах гарантирована.
Фрагменты закрываются по ключевым кадрам и по времени (~0.8 с), в поток
попадают сразу после записи.

Таймстампы:
- Tapo (RTSP): реальные PTS камеры, ffmpeg берёт их сам;
- Hik-Connect (Annex-B без меток): -use_wallclock_as_timestamps 1 — метки
  по моменту прибытия чанков, плеер идёт в реальном времени без дрейфа.

Модуль также содержит Annex-B helpers для детекта кодека/ключевых кадров
(парсер PyAV) и конструкторы команд ffmpeg.
"""

from __future__ import annotations

import struct

TIMEBASE = 90000  # 90 кГц — стандарт MPEG для видео-треков

DEFAULT_FRAG_MS = 800


# ---------------------------------------------------------- ffmpeg-команды

def _remux_tail(frag_ms: int) -> list[str]:
    return [
        "-c:v", "copy",
        "-movflags", "frag_keyframe+empty_moov+default_base_moof",
        "-frag_duration", str(max(200, int(frag_ms)) * 1000),
        "-f", "mp4", "pipe:1",
    ]


def raw_remux_args(fmt: str, frag_ms: int = DEFAULT_FRAG_MS) -> list[str]:
    """Сырой Annex-B поток (h264/hevc) из stdin -> fMP4 в stdout.

    use_wallclock_as_timestamps: метки по прибытию (для relay без PTS).
    """
    return [
        "ffmpeg", "-hide_banner", "-loglevel", "error",
        "-f", fmt, "-use_wallclock_as_timestamps", "1",
        "-i", "pipe:0",
    ] + _remux_tail(frag_ms)


def rtsp_remux_args(url: str, frag_ms: int = DEFAULT_FRAG_MS) -> list[str]:
    """RTSP-поток -> fMP4 в stdout (PTS камеры сохраняются)."""
    return [
        "ffmpeg", "-hide_banner", "-loglevel", "error",
        "-rtsp_transport", "tcp",
        "-i", url,
    ] + _remux_tail(frag_ms)


# --------------------------------------------------------- Annex-B helpers

def looks_like_annexb(data: bytes) -> bool:
    return (
        len(data) >= 4
        and data[0] == 0
        and data[1] == 0
        and (data[2] == 1 or (data[2] == 0 and data[3] == 1))
    )


def split_annexb(data: bytes) -> list[bytes]:
    """Нарезать Annex-B на NAL-единицы без старт-кодов."""
    nals: list[bytes] = []
    start = -1
    i = 0
    n = len(data)
    while i + 3 <= n:
        if data[i] == 0 and data[i + 1] == 0 and data[i + 2] == 1:
            sc = i - 1 if i > 0 and data[i - 1] == 0 else i  # 3- или 4-байтный код
            if start >= 0:
                nals.append(data[start:sc])
            start = i + 3
            i += 3
        else:
            i += 1
    if start >= 0:
        nals.append(data[start:])
    return nals


def annexb_to_avcc(data: bytes) -> bytes:
    out = bytearray()
    for nal in split_annexb(data):
        out += struct.pack(">I", len(nal)) + nal
    return bytes(out)


def nal_is_keyframe_avc(nal: bytes) -> bool:
    return len(nal) > 0 and (nal[0] & 0x1F) == 5  # IDR


def nal_is_keyframe_hevc(nal: bytes) -> bool:
    return len(nal) > 0 and ((nal[0] >> 1) & 0x3F) in (19, 20)  # IDR_W_RADL / IDR_N_LP


def first_vcl_keyframe(avcc_sample: bytes, codec: str) -> bool:
    """Ключевой ли сэмпл: тип первого VCL-NAL (NAL'ы параметров пропускаем —
    некоторые потоки префиксуют сэмплы SPS/PPS/AUD)."""
    off = 0
    n = len(avcc_sample)
    while off + 4 <= n:
        size = struct.unpack_from(">I", avcc_sample, off)[0]
        if size <= 0 or off + 4 + size > n:
            return False
        nal = avcc_sample[off + 4 : off + 4 + size]
        if codec == "hvc1":
            t = (nal[0] >> 1) & 0x3F
            if t < 32:
                return t in (19, 20)
        else:
            t = nal[0] & 0x1F
            if t in (1, 2, 5):
                return t == 5
        off += 4 + size
    return False


def find_sps_pps(nals: list[bytes]) -> tuple[bytes | None, bytes | None]:
    sps = pps = None
    for nal in nals:
        if not nal:
            continue
        t = nal[0] & 0x1F
        if t == 7 and sps is None:
            sps = nal
        elif t == 8 and pps is None:
            pps = nal
        if sps and pps:
            break
    return sps, pps
