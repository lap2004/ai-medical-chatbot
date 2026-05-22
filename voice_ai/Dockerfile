FROM python:3.10-slim

WORKDIR /app

# Install ffmpeg for audio processing
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose port
EXPOSE 8001

# Run the application
CMD ["uvicorn", "run_ws_server:app", "--host", "0.0.0.0", "--port", "8001"]
