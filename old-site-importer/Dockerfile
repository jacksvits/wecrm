FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1
WORKDIR /importer

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY import_wordpress.py .
CMD ["python", "import_wordpress.py"]
