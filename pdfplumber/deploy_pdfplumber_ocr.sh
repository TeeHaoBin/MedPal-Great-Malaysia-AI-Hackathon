#!/bin/bash
# Deploy the pdfplumber OCR Lambda function
# This script automates the packaging, dependency installation, and deployment
# of a Python Lambda function to AWS. The function is designed to extract
# text and table data from PDF files using the `pdfplumber` library.

# The `set -e` command ensures that the script will exit immediately if any
# command fails, preventing partial or broken deployments.
set -e

echo "🚀 Deploying PDFPlumber OCR Lambda"
echo "==================================="

# --- Configuration ---
# These variables define the names and settings for the AWS resources.
# FUNCTION_NAME: The name for the new or updated Lambda function.
# REGION: The AWS region where the resources will be deployed.
# S3_BUCKET: The S3 bucket that will trigger the Lambda function.
# DYNAMODB_TABLE: The DynamoDB table where the extracted text will be stored.
# ROLE_NAME: The IAM role the Lambda will use. It must have permissions for
#            S3 GetObject, DynamoDB PutItem, and CloudWatch Logs.
FUNCTION_NAME="medpal-pdfplumber-ocr"
REGION="us-east-1"
S3_BUCKET="testing-pdf-files-medpal"
DYNAMODB_TABLE="OCR-Text-Extraction-Table"
ROLE_NAME="medpal-tesseract-lambda-role"

echo "📋 Configuration:"
echo "   Function Name: $FUNCTION_NAME"
echo "   Region: $REGION"
echo "   IAM Role: $ROLE_NAME"

# --- Get IAM Role ARN ---
# The script fetches the ARN (Amazon Resource Name) of the specified IAM role.
# The ARN is required to associate the role with the Lambda function during creation.
# If the role is not found, the script exits.
echo "📦 Getting IAM Role ARN..."
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text --region $REGION)
if [ -z "$ROLE_ARN" ]; then
    echo "❌ Could not find IAM Role ARN for $ROLE_NAME. Please create it first."
    exit 1
fi
echo "✅ Using IAM Role: $ROLE_ARN"

# --- Create Deployment Package ---
# This section prepares the files for deployment.
# It creates a clean `deploy_package` directory to hold the function code and its dependencies.
echo "📦 Creating deployment package structure..."
rm -rf deploy_package
mkdir -p deploy_package

# The Python code for the Lambda function is written into `lambda_function.py`
# inside the `deploy_package` directory using a HEREDOC. This makes the script
# self-contained and avoids managing separate files.
echo "📝 Writing Lambda function code..."
cat > deploy_package/lambda_function.py << 'EOF'
# lambda_function.py
# This Python script contains the core logic for the AWS Lambda function.
# It is triggered by an S3 event, downloads a PDF, extracts text and tables
# using pdfplumber, and stores the result in DynamoDB.

import json
import boto3
import uuid
import tempfile
import os
import logging
from datetime import datetime
from decimal import Decimal

# --- Initialization ---
# Standard logging setup for CloudWatch.
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# --- Environment Variables ---
# These are configured in the Lambda settings and passed to the function at runtime.
# Default values are provided for local testing or if variables are not set.
S3_BUCKET_NAME = os.environ.get('S3_BUCKET_NAME', 'testing-pdf-files-medpal')
DYNAMODB_TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', 'OCR-Text-Extraction-Table')
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')

# --- Lazy Loading for Performance ---
# `pdfplumber` is a relatively large library. By lazy-loading it inside the handler,
# we improve the "cold start" performance of the Lambda function. The library is
# only imported when the function is actually invoked.
pdfplumber = None

def import_pdfplumber():
    """Dynamically imports the pdfplumber library on first use."""
    global pdfplumber
    if pdfplumber is None:
        try:
            import pdfplumber as p
            pdfplumber = p
            logger.info("Successfully imported pdfplumber.")
        except ImportError:
            logger.error("pdfplumber library not found. Ensure it is in the deployment package.")
            raise

# --- Main Handler ---
def lambda_handler(event, context):
    """
    The main entry point for the Lambda function. It determines the event
    source (S3 or direct invocation) and routes it accordingly.
    """
    try:
        import_pdfplumber()  # Ensure the library is loaded.
        logger.info("Received event. Processing with pdfplumber engine.")

        if 'Records' in event:
            # An S3 event contains a 'Records' list.
            return handle_s3_event(event)
        else:
            # If no 'Records', it's likely a test invocation.
            logger.warning("Direct invocation detected. This is for testing only.")
            return {"statusCode": 400, "body": json.dumps("Direct invocation is for testing; please use S3 trigger.")}

    except Exception as e:
        logger.error(f"FATAL_ERROR: {str(e)}", exc_info=True)
        return {'statusCode': 500, 'body': json.dumps({'success': False, 'error': f'Processing failed: {str(e)}'})}

def handle_s3_event(event):
    """
    Processes S3 object creation events. Iterates through all records in the
    event payload and triggers the PDF processing for each.
    """
    results = []
    for record in event['s3']['records']:
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        
        logger.info(f"Processing s3://{bucket}/{key}")

        # Filter to ensure we only process PDFs from the correct folder.
        if not key.startswith('medpal-uploads/') or not key.lower().endswith('.pdf'):
            logger.warning(f"Skipping non-matching file: {key}")
            continue
        
        result = process_pdf_with_pdfplumber(bucket, key)
        results.append(result)
    
    return {
        'statusCode': 200,
        'body': json.dumps({'success': True, 'processed_files': len(results), 'results': results})
    }

def process_pdf_with_pdfplumber(bucket: str, key: str):
    """
    The core logic:
    1. Downloads the PDF from S3 to a temporary file.
    2. Uses pdfplumber to open the PDF and extract text and tables page by page.
    3. Formats the extracted data into a single string.
    4. Creates a record with metadata and the extracted text.
    5. Saves the record to DynamoDB.
    6. Cleans up the temporary file.
    """
    document_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    s3_client = boto3.client('s3', region_name=AWS_REGION)
    
    try:
        # Get file metadata like size and original name.
        head_response = s3_client.head_object(Bucket=bucket, Key=key)
        file_size = head_response['ContentLength']
        original_name = head_response.get('Metadata', {}).get('originalname', os.path.basename(key))
        
        logger.info(f"Starting processing for {original_name} ({file_size} bytes)")

        # Use a temporary file to store the S3 object locally.
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            s3_client.download_fileobj(bucket, key, tmp_file)
            temp_file_path = tmp_file.name
        
        try:
            # --- Core pdfplumber Logic ---
            text_parts = []
            page_count = 0
            table_count = 0

            with pdfplumber.open(temp_file_path) as pdf:
                page_count = len(pdf.pages)
                logger.info(f"PDF has {page_count} pages.")
                
                for i, page in enumerate(pdf.pages):
                    # Extract plain text from the page.
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(f"--- Page {i+1} ---\n{page_text}")
                    
                    # Extract any tables on the page.
                    tables = page.extract_tables()
                    if tables:
                        table_count += len(tables)
                        for table in tables:
                            # Convert the table (list of lists) to a formatted string.
                            table_str = '\n'.join([' | '.join([str(cell or '') for cell in row]) for row in table])
                            text_parts.append(f"--- Table on Page {i+1} ---\n{table_str}")

            extracted_text = '\n\n'.join(text_parts)
            lines_extracted = len(extracted_text.split('\n'))
            confidence = calculate_confidence(extracted_text, lines_extracted)
            
            logger.info(f"Extraction complete. Extracted {lines_extracted} lines and {table_count} tables.")

            # --- Save to DynamoDB ---
            # The extracted data and metadata are compiled into a Python dictionary.
            # This dictionary structure must match the desired format in DynamoDB.
            record = {
                'documentId': document_id,
                'userId': 'medpal-user',
                'filename': original_name,
                'extractedText': extracted_text,
                'documentType': classify_document(extracted_text),
                'confidence': Decimal(str(round(confidence, 4))), # Use Decimal for DynamoDB
                'totalLines': lines_extracted,
                'totalPages': page_count,
                'fileSize': file_size,
                'contentType': 'application/pdf',
                's3Bucket': bucket,
                's3Key': key,
                'createdAt': timestamp,
                'processingEngine': 'pdfplumber'
            }
            
            save_to_dynamodb(record)
            
            return {'documentId': document_id, 'status': 'completed', 'filename': original_name}

        finally:
            # This block ensures the temporary file is deleted even if an error occurs.
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        logger.error(f"Failed to process {key}. Error: {str(e)}", exc_info=True)
        # If processing fails, save an error record to DynamoDB for diagnostics.
        error_record = {
            'documentId': document_id,
            'filename': os.path.basename(key),
            's3Key': key,
            'createdAt': timestamp,
            'processingStatus': 'failed',
            'errorMessage': str(e),
            'processingEngine': 'pdfplumber'
        }
        save_to_dynamodb(error_record)
        return {'documentId': document_id, 'status': 'failed', 'error': str(e)}

def calculate_confidence(text: str, line_count: int) -> float:
    """
    Calculates a heuristic confidence score. Since pdfplumber is deterministic,
    this score reflects the quality and relevance of the extracted text.
    """
    if not text or line_count < 3:
        return 0.3
    
    score = 0.85  # Base confidence for pdfplumber
    
    # Boost score if common medical terms are found.
    medical_terms = ['patient', 'doctor', 'medical', 'diagnosis', 'treatment', 'medication']
    if any(term in text.lower() for term in medical_terms):
        score += 0.1
        
    return min(score, 0.99) # Cap the score at 0.99

def classify_document(text: str) -> str:
    """Performs simple keyword-based classification of the document."""
    if not text:
        return 'unknown'
    
    text_lower = text.lower()
    if 'lab' in text_lower and 'result' in text_lower:
        return 'lab_result'
    if 'prescription' in text_lower or 'rx' in text_lower:
        return 'prescription'
    if 'radiology' in text_lower or 'imaging' in text_lower:
        return 'imaging_report'
    
    return 'medical_document'

def save_to_dynamodb(record):
    """
    Saves the final record to the specified DynamoDB table.
    """
    try:
        dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
        table = dynamodb.Table(DYNAMODB_TABLE_NAME)
        table.put_item(Item=record)
        logger.info(f"Successfully saved record {record['documentId']} to DynamoDB.")
    except Exception as e:
        logger.error(f"Failed to save to DynamoDB. RecordID: {record.get('documentId')}. Error: {str(e)}", exc_info=True)

EOF

# --- Install Dependencies using Docker ---
# To ensure the dependencies are compatible with the Amazon Linux runtime, we
# install them using a Docker container running Python 3.9.
# This compiles the packages for the correct architecture, fixing "invalid ELF header" errors.
echo "📦 Installing dependencies inside a Docker container (for Lambda compatibility)..."
docker run --rm -v "$(pwd)":/var/task public.ecr.aws/sam/build-python3.9 pip install pdfplumber -t /var/task/deploy_package/ --no-cache-dir


# --- Create Zip File ---
# The contents of the `deploy_package` directory (the `lambda_function.py` script
# and all the installed libraries) are zipped into a single `lambda-deployment.zip` file.
# This zip file is the deployment artifact that will be uploaded to AWS.
echo "🗜️ Creating deployment zip..."
cd deploy_package
zip -r ../lambda-deployment.zip . -q
cd ..

PACKAGE_SIZE=$(du -h lambda-deployment.zip | cut -f1)
echo "✅ Deployment package created: lambda-deployment.zip ($PACKAGE_SIZE)"

# --- Deploy to AWS Lambda ---
# This section uses the AWS CLI to deploy the function.
# It checks if the function already exists. If it does, it updates the code
# and configuration. If not, it creates a new function.
echo "🚀 Deploying to AWS..."
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION >/dev/null 2>&1; then
    # Update existing function
    echo "📝 Updating existing function..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://lambda-deployment.zip \
        --region $REGION > /dev/null

    echo "⏳ Waiting 10 seconds for the code update to finalize..."
    sleep 10
    
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --timeout 60 \
        --memory-size 512 \
        --environment "Variables={S3_BUCKET_NAME=${S3_BUCKET},DYNAMODB_TABLE_NAME=${DYNAMODB_TABLE}}" \
        --region $REGION > /dev/null
else
    # Create new function
    echo "🆕 Creating new function..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime python3.9 \
        --role $ROLE_ARN \
        --handler lambda_function.lambda_handler \
        --zip-file fileb://lambda-deployment.zip \
        --timeout 60 \
        --memory-size 512 \
        --environment "Variables={S3_BUCKET_NAME=${S3_BUCKET},DYNAMODB_TABLE_NAME=${DYNAMODB_TABLE}}" \
        --region $REGION > /dev/null
fi

echo "✅ Lambda function '$FUNCTION_NAME' deployed successfully!"

# --- Clean up ---
# The temporary directory and zip file are removed to keep the project directory clean.
rm -rf deploy_package lambda-deployment.zip

echo ""
echo "🎉 PDFPlumber OCR Lambda Deployed!"
echo "================================="
echo "✅ Function: $FUNCTION_NAME"
echo "✅ Engine: pdfplumber"
echo "✅ Package Size: $PACKAGE_SIZE"
echo "✅ Memory: 512 MB"
echo "✅ Timeout: 60 seconds"
echo ""
echo "📋 Next Step: Set up the S3 trigger for this new function."
