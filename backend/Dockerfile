# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# System dependencies needed by opencv-python and other CV/ML packages
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (separate layer — only re-runs if
# requirements.txt actually changes, so rebuilds are fast in practice)
COPY requirements.txt .
RUN pip install --no-cache-dir --default-timeout=120 --retries 10 -r requirements.txt

# Now copy the actual application code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
