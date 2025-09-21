# Use a standard Python 3.9 slim base image
FROM python:3.9-slim

# Set the working directory
WORKDIR /app

# Copy the requirements file
COPY requirements.txt .

# Install system dependencies required for building PyMuPDF
RUN apt-get update && apt-get install -y gcc g++ make

# Install Python dependencies
RUN pip install --default-timeout=600 --no-cache-dir -r requirements.txt

# Copy the task script
COPY ocr_task.py .

# Set the command to run when the container starts
CMD ["python", "-u", "ocr_task.py"]
