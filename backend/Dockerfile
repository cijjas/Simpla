# ---------------- Stage 1: build wheel layer (cached) ----------------
FROM python:3.13-slim AS builder
WORKDIR /wheels

COPY requirements.txt .
RUN pip wheel --no-cache-dir --wheel-dir /wheels -r requirements.txt

# ---------------- Stage 2: runtime image -----------------------------
FROM python:3.13-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    PORT=8000

# system deps for psycopg2, numpy, etc.
RUN apt-get update && \
    apt-get install -y build-essential libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir /wheels/*.whl

COPY . .

# Gunicorn in prod, Uvicorn w/ reload in dev (passed via CMD)
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "main:app", "--bind", "0.0.0.0:8000"]