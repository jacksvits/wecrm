FROM python:3.12-slim

# ffmpeg — перепаковка RTSP -> fMP4 (MSE); fonts-dejavu — для кадров-заглушек
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg fonts-dejavu-core \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY tapo-stream/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY streamlib ./streamlib
COPY tapo-stream/app.py .

EXPOSE 8558

CMD ["python", "app.py"]
