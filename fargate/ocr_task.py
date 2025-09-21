import boto3
import os
import uuid
import fitz  # PyMuPDF
from paddleocr import PaddleOCR

# This script is designed to be run as a Fargate task.
# It retrieves the S3 bucket/key from environment variables.

def main():
    """Main execution function for the Fargate task."""
    print("Fargate OCR task started.")

    # 1. Get configuration from environment variables
    try:
        s3_bucket = os.environ['S3_BUCKET']
        s3_key = os.environ['S3_KEY']
        dynamodb_table_name = os.environ['DYNAMODB_TABLE']
    except KeyError as e:
        print(f"Error: Missing environment variable {e}. Exiting.")
        return

    print(f"Processing S3 object: s3://{s3_bucket}/{s3_key}")

    # 2. Initialize clients
    s3_client = boto3.client("s3")
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(dynamodb_table_name)
    local_pdf_path = f"/tmp/{uuid.uuid4()}_{os.path.basename(s3_key)}"

    # 3. Initialize PaddleOCR
    # This is a heavy operation and will be the main part of the task execution.
    print("Initializing PaddleOCR...")
    ocr = PaddleOCR(use_angle_cls=True, lang="en")
    print("PaddleOCR initialized.")

    try:
        # 4. Download the file from S3
        print(f"Downloading PDF to {local_pdf_path}...")
        s3_client.download_file(s3_bucket, s3_key, local_pdf_path)

        # 5. Extract text from the PDF
        print(f"Extracting text from PDF: {local_pdf_path}")
        doc = fitz.open(local_pdf_path)
        full_text = ""
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            pix = page.get_pixmap()
            img_bytes = pix.tobytes("png")
            result = ocr.ocr(img_bytes, cls=True)
            if result and result[0] is not None:
                lines = [line[1][0] for line in result[0]]
                full_text += "\n".join(lines) + "\n"
        print("Text extraction complete.")

        if not full_text:
            print("Warning: No text extracted from the PDF.")
            # Optionally, write a status to DynamoDB
            return

        # 6. Save the result to DynamoDB
        item_id = str(uuid.uuid4())
        s3_uri = f"s3://{s3_bucket}/{s3_key}"
        print(f"Saving extracted text to DynamoDB table: {dynamodb_table_name}")
        table.put_item(
            Item={
                "id": item_id,
                "s3_uri": s3_uri,
                "ocr_text": full_text,
                "status": "processed"
            }
        )
        print("Successfully saved to DynamoDB.")

    except Exception as e:
        print(f"FATAL: An error occurred during processing: {e}")
        # Optionally, update DynamoDB with an error status
        raise e
    finally:
        # 7. Clean up the downloaded file
        if os.path.exists(local_pdf_path):
            os.remove(local_pdf_path)
            print(f"Cleaned up temporary file: {local_pdf_path}")
        print("Fargate OCR task finished.")

if __name__ == "__main__":
    main()
