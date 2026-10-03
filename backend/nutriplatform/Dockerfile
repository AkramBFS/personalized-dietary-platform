FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# Install runtime dependencies for psycopg2 and Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser -d /app appuser

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Create media and static directories and ensure permissions
RUN mkdir -p /app/media /app/staticfiles && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

CMD ["sh", "-c", "exec gunicorn nutriplatform.wsgi:application --bind 0.0.0.0:${PORT} --workers ${GUNICORN_WORKERS:-2} --threads ${GUNICORN_THREADS:-2} --timeout ${GUNICORN_TIMEOUT:-60} --access-logfile - --error-logfile -"]
