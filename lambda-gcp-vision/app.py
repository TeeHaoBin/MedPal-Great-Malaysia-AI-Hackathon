import os
import boto3
import uuid
import fitz  # PyMuPDF
import json
from google.cloud import vision
from google.oauth2 import service_account
import base64

# Initialize AWS clients outside the handler for reuse across invocations
s3_client = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")

# Configuration
DYNAMODB_TABLE_NAME = "OCR-Text-Extraction-Table"
table = dynamodb.Table(DYNAMODB_TABLE_NAME)

# Initialize Google Cloud Vision client
print("Initializing Google Cloud Vision client...")

# Get GCP credentials from environment variable (base64 encoded JSON)
gcp_credentials_b64 = os.environ.get('GCP_CREDENTIALS_BASE64')
if not gcp_credentials_b64:
    raise ValueError("GCP_CREDENTIALS_BASE64 environment variable is required")

# Decode the base64 credentials
gcp_credentials_json = base64.b64decode(gcp_credentials_b64).decode('utf-8')
gcp_credentials = json.loads(gcp_credentials_json)

# Create credentials object
credentials = service_account.Credentials.from_service_account_info(gcp_credentials)

# Initialize the Vision API client
vision_client = vision.ImageAnnotatorClient(credentials=credentials)
print("Google Cloud Vision client initialized.")

def extract_text_from_pdf_with_vision(pdf_path):
    """Extracts text from all pages of a PDF file using Google Cloud Vision."""
    print(f"Extracting text from PDF using Google Cloud Vision: {pdf_path}")
    doc = fitz.open(pdf_path)
    full_text = ""
    
    for page_num in range(len(doc)):
        print(f"Processing page {page_num + 1}/{len(doc)}")
        page = doc.load_page(page_num)
        
        # Convert page to image
        pix = page.get_pixmap(matrix=fitz.Matrix(2.0, 2.0))  # Higher resolution for better OCR
        img_bytes = pix.tobytes("png")
        
        # Create Vision API image object
        image = vision.Image(content=img_bytes)
        
        # Perform text detection
        response = vision_client.text_detection(image=image)
        texts = response.text_annotations
        
        if texts:
            # The first annotation contains the full text
            page_text = texts[0].description
            full_text += page_text + "\n\n"
        
        # Check for errors
        if response.error.message:
            print(f"Error on page {page_num + 1}: {response.error.message}")
    
    doc.close()
    print(f"Text extraction complete. Extracted {len(full_text)} characters.")
    return full_text

def lambda_handler(event, context):
    """
    Main Lambda handler function.
    Triggered by S3, it processes the uploaded PDF and saves text to DynamoDB.
    """
    print("Lambda handler started.")
    
    # Get the S3 bucket and object key from the event
    s3_bucket = event["Records"][0]["s3"]["bucket"]["name"]
    s3_key = event["Records"][0]["s3"]["object"]["key"]
    
    # Prevent trigger loops from the same bucket if logs/outputs are saved there
    if not s3_key.lower().endswith(".pdf"):
        print(f"Object {s3_key} is not a PDF. Skipping.")
        return {"statusCode": 200, "body": "Not a PDF, skipping."}

    local_pdf_path = f"/tmp/{uuid.uuid4()}_{os.path.basename(s3_key)}"
    
    print(f"Processing S3 object: s3://{s3_bucket}/{s3_key}")

    try:
        # Download the PDF from S3 to the /tmp directory
        print(f"Downloading PDF to {local_pdf_path}...")
        s3_client.download_file(s3_bucket, s3_key, local_pdf_path)
        
        # Extract text using Google Cloud Vision
        print("Starting Google Cloud Vision OCR text extraction...")
        extracted_text = extract_text_from_pdf_with_vision(local_pdf_path)
        print(f"Finished OCR text extraction. Found {len(extracted_text)} characters.")
        
        if not extracted_text:
            print("No text extracted from the PDF.")
            return {"statusCode": 400, "body": "No text could be extracted."}

        # Prepare item for DynamoDB
        item_id = str(uuid.uuid4())
        s3_uri = f"s3://{s3_bucket}/{s3_key}"
        
        print(f"Attempting to save item to DynamoDB. URI: {s3_uri}")
        table.put_item(
            Item={
                "id": item_id,
                "s3_uri": s3_uri,
                "ocr_text": extracted_text,
                "status": "processed",
                "ocr_engine": "google_cloud_vision"
            }
        )
        print("Successfully saved to DynamoDB.")

        return {
            "statusCode": 200,
            "body": f"Successfully processed {s3_key} and saved to DynamoDB with ID {item_id}."
        }

    except Exception as e:
        print(f"Error processing file: {e}")
        # Optionally, update DynamoDB with an error status
        table.put_item(
            Item={
                "id": str(uuid.uuid4()),
                "s3_uri": f"s3://{s3_bucket}/{s3_key}",
                "status": "error",
                "error_message": str(e),
                "ocr_engine": "google_cloud_vision"
            }
        )
        raise e
    finally:
        # Clean up the downloaded file
        if os.path.exists(local_pdf_path):
            os.remove(local_pdf_path)
            print(f"Cleaned up temporary file: {local_pdf_path}")