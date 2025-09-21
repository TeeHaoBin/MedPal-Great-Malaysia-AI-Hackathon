FROM python:3.9-slim

# Install system dependencies for PaddleOCR
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directories
RUN mkdir -p /tmp/ocr_temp

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PADDLE_LOG_LEVEL=50

# Expose port for health checks
EXPOSE 8080

# Command to run the application
CMD ["python", "ocr_processor.py"]