FROM python:3.10-slim

# Install system deps needed by faiss-cpu and onnxruntime
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy only the backend source code and data
COPY backend/ .

# Use the PORT environment variable (required for Render/Railway)
# Default to 10000 if not set
ENV PORT=10000

# Run the FastAPI server
# We use backticks to evaluate the PORT env var in the shell
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port $PORT"
