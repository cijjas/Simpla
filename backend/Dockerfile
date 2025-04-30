# --- builder ---
FROM python:3.13-slim AS builder
WORKDIR /wheels

COPY requirements.txt .

RUN apt-get update && apt-get install -y \
    libxml2-dev libxslt1-dev zlib1g-dev gcc \
    && rm -rf /var/lib/apt/lists/*

RUN pip wheel --no-cache-dir --wheel-dir /wheels -r requirements.txt

# --- runtime ---
FROM python:3.13-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1 PORT=8000

RUN apt-get update && apt-get install -y \
    libxml2 libxslt1.1 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir /wheels/*.whl

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]