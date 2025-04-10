FROM python:3.11-slim

# 1. system deps
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

# 2. python deps
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3. code
COPY backend .

# 4. expose & run
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]