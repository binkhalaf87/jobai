FROM python:3.12-slim

WORKDIR /app

# Install Python dependencies first to keep image rebuilds efficient.
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copy the application source after dependencies are installed.
COPY . .

EXPOSE 8000

# Railway provides PORT at runtime; the fallback keeps local container runs predictable.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]

