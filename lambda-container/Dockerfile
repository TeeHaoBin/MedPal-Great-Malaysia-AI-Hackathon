# Use the official AWS Lambda Python 3.9 base image
FROM public.ecr.aws/lambda/python:3.9

# Copy the requirements file into the image
COPY requirements.txt .

# Install build tools needed for PyMuPDF and other C extensions
RUN yum install -y gcc gcc-c++ make

# Install dependencies
# Using --no-cache-dir to reduce image size
RUN pip install --default-timeout=600 --no-cache-dir -r requirements.txt

# Overwrite the problematic cache.py from the paddlex library with our patched version.
COPY patched_cache.py /var/lang/lib/python3.9/site-packages/paddlex/utils/cache.py

# Copy the Lambda function code
COPY app.py .

# Set the CMD to your handler function
# This tells Lambda what to run when the container starts
CMD ["app.lambda_handler"]
