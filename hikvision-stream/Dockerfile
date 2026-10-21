FROM python:3.12-slim

# ffmpeg нужен библиотеке hikcloudstream для remux/HLS-режимов
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg fonts-dejavu-core \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

EXPOSE 8557

CMD ["python", "app.py"]
