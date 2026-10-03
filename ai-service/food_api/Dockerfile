FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    AI_SERVICE_PORT=8001 \
    AI_SERVICE_HOST=0.0.0.0

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -r appuser && useradd -r -g appuser -d /app appuser

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

# Ensure directory for mounted model exists
RUN mkdir -p /app/models && chown -R appuser:appuser /app

USER appuser

EXPOSE 8001

CMD ["sh", "-c", "exec uvicorn app:app --host ${AI_SERVICE_HOST} --port ${AI_SERVICE_PORT}"]
