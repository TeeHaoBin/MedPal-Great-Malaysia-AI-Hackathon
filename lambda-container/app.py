
import os
# Monkey-patch os.path.expanduser to always return /tmp. This is an aggressive but effective
# way to force libraries that try to write to the home directory (~/) to use the writable /tmp directory in a Lambda environment.
os.path.expanduser = lambda path: '/tmp' + path.replace('~', '')

import boto3
import uuid
import fitz  # PyMuPDF
from paddleocr import PaddleOCR

# Initialize clients outside the handler for reuse across invocations
s3_client = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")

# Configuration
DYNAMODB_TABLE_NAME = "OCR-Text-Extraction-Table"
table = dynamodb.Table(DYNAMODB_TABLE_NAME)

# Initialize PaddleOCR. This is a heavy operation, so we do it globally.
# It will be cached for warm Lambda invocations.
print("Initializing PaddleOCR...")
# You can specify languages, e.g., ["ch", "en"]
ocr = PaddleOCR(use_angle_cls=True, lang="en")
print("PaddleOCR initialized.")

def extract_text_from_pdf(pdf_path):
    """Extracts text from all pages of a PDF file."""
    print(f"Extracting text from PDF: {pdf_path}")
    doc = fitz.open(pdf_path)
    full_text = ""
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        pix = page.get_pixmap()
        img_bytes = pix.tobytes("png")
        
        # Use PaddleOCR on the image bytes of the page
        result = ocr.ocr(img_bytes, cls=True)
        
        # Process and concatenate results for the page
        if result and result[0] is not None:
            lines = [line[1][0] for line in result[0]]
            full_text += "\n".join(lines) + "\n"
            
    print("Text extraction from PDF complete.")
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
        
        # Extract text using our function
        print("Starting OCR text extraction...")
        extracted_text = extract_text_from_pdf(local_pdf_path)
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
                "status": "processed"
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
                "error_message": str(e)
            }
        )
        raise e
    finally:
        # Clean up the downloaded file
        if os.path.exists(local_pdf_path):
            os.remove(local_pdf_path)
            print(f"Cleaned up temporary file: {local_pdf_path}")
