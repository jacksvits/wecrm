FROM python:3.12-slim

# ffmpeg нужен библиотеке hikcloudstream для remux/HLS-режимов
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg fonts-dejavu-core \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY hikvision-stream/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Общий fMP4-муксер (MSE) — build-контекст теперь корень репозитория
COPY streamlib ./streamlib
COPY hikvision-stream/app.py .

EXPOSE 8557

CMD ["python", "app.py"]
