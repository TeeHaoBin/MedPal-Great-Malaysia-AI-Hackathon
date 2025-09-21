#!/usr/bin/env python3
"""
Enhanced OCR Task for MedPal - High Accuracy PaddleOCR
Compatible with existing MedPal infrastructure:
- S3 bucket: testing-pdf-files-medpal  
- DynamoDB table: OCR-Text-Extraction-Table
- Processes files from medpal-uploads/ folder
"""

import boto3
import os
import uuid
import fitz  # PyMuPDF
from paddleocr import PaddleOCR
from datetime import datetime
from decimal import Decimal
import logging
import json
import traceback

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """Main execution function for the Fargate task."""
    logger.info("🚀 High-Accuracy PaddleOCR Fargate Task Started")
    
    try:
        # 1. Get configuration from environment variables
        s3_bucket = os.environ.get('S3_BUCKET', 'testing-pdf-files-medpal')
        s3_key = os.environ.get('S3_KEY', '')
        dynamodb_table_name = os.environ.get('DYNAMODB_TABLE', 'OCR-Text-Extraction-Table')
        user_id = os.environ.get('USER_ID', 'medpal-user')
        
        if not s3_key:
            logger.error("❌ S3_KEY environment variable is required")
            return
        
        logger.info(f"📋 Configuration:")
        logger.info(f"   S3 Bucket: {s3_bucket}")
        logger.info(f"   S3 Key: {s3_key}")
        logger.info(f"   DynamoDB Table: {dynamodb_table_name}")
        logger.info(f"   User ID: {user_id}")
        
        # 2. Process the document
        result = process_document_high_accuracy(
            s3_bucket, s3_key, dynamodb_table_name, user_id
        )
        
        logger.info("✅ High-Accuracy OCR Task Completed Successfully")
        logger.info(f"📊 Results: {json.dumps(result, indent=2)}")
        
    except Exception as e:
        logger.error(f"💥 FATAL: Task failed with error: {str(e)}")
        logger.error(traceback.format_exc())
        raise e

def process_document_high_accuracy(s3_bucket: str, s3_key: str, table_name: str, user_id: str):
    """Process document with high-accuracy PaddleOCR"""
    document_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    logger.info(f"🔍 Starting high-accuracy OCR processing")
    logger.info(f"   Document ID: {document_id}")
    
    # Initialize AWS clients
    s3_client = boto3.client("s3")
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(table_name)
    
    # Generate local file path
    local_pdf_path = f"/tmp/{uuid.uuid4()}_{os.path.basename(s3_key)}"
    
    try:
        # Get file metadata
        logger.info("📄 Getting file metadata...")
        head_response = s3_client.head_object(Bucket=s3_bucket, Key=s3_key)
        file_size = head_response['ContentLength']
        content_type = head_response.get('ContentType', 'application/pdf')
        original_name = head_response.get('Metadata', {}).get('originalname', s3_key.split('/')[-1])
        
        logger.info(f"   Filename: {original_name}")
        logger.info(f"   Size: {file_size} bytes")
        logger.info(f"   Content Type: {content_type}")
        
        # Initialize PaddleOCR with high accuracy settings
        logger.info("🔍 Initializing High-Accuracy PaddleOCR...")
        ocr = PaddleOCR(
            use_angle_cls=True,
            lang="en",
            show_log=False,
            use_gpu=False,  # CPU-only for Fargate
            # High accuracy settings
            det_db_thresh=0.3,
            det_db_box_thresh=0.5,
            det_db_unclip_ratio=1.6,
            rec_batch_num=6
        )
        logger.info("✅ PaddleOCR initialized with high accuracy settings")
        
        # Download the file from S3
        logger.info(f"📥 Downloading PDF to {local_pdf_path}...")
        s3_client.download_file(s3_bucket, s3_key, local_pdf_path)
        logger.info("✅ File downloaded successfully")
        
        # Extract text from the PDF with high accuracy
        logger.info("🔍 Extracting text with high-accuracy OCR...")
        extracted_text, confidence, pages_processed, lines_extracted = extract_text_high_accuracy(
            local_pdf_path, ocr
        )
        
        logger.info(f"✅ Text extraction completed:")
        logger.info(f"   Pages processed: {pages_processed}")
        logger.info(f"   Lines extracted: {lines_extracted}")
        logger.info(f"   Average confidence: {confidence:.3f}")
        logger.info(f"   Text length: {len(extracted_text)} characters")
        
        if not extracted_text or len(extracted_text.strip()) < 10:
            logger.warning("⚠️ Very little text extracted from the PDF")
        
        # Classify document type
        document_type = classify_medical_document_advanced(extracted_text)
        logger.info(f"📋 Document classified as: {document_type}")
        
        # Extract medical entities
        medical_entities = extract_medical_entities(extracted_text)
        logger.info(f"🏥 Found {len(medical_entities)} medical entities")
        
        # Calculate quality score
        quality_score = calculate_quality_score(extracted_text, confidence, lines_extracted)
        logger.info(f"📊 Quality score: {quality_score}")
        
        # Prepare comprehensive DynamoDB record (compatible with existing structure)
        record = {
            "documentId": document_id,
            "userId": user_id,
            "filename": original_name,
            "extractedText": extracted_text,
            "documentType": document_type,
            "confidence": Decimal(str(round(confidence, 4))),
            "totalLines": lines_extracted,
            "totalPages": pages_processed,
            "fileSize": file_size,
            "contentType": content_type,
            "s3Bucket": s3_bucket,
            "s3Key": s3_key,
            "createdAt": timestamp,
            "processingEngine": "paddleocr-fargate-high-accuracy",
            "qualityScore": quality_score,
            "medicalEntities": medical_entities[:15],  # Top 15 entities
            "ocrSettings": {
                "det_db_thresh": 0.3,
                "det_db_box_thresh": 0.5,
                "use_angle_cls": True,
                "language": "en"
            }
        }
        
        # Save to DynamoDB
        logger.info(f"💾 Saving results to DynamoDB table: {table_name}")
        table.put_item(Item=record)
        logger.info("✅ Successfully saved to DynamoDB")
        
        return {
            "documentId": document_id,
            "extractedText": extracted_text[:1000] + "..." if len(extracted_text) > 1000 else extracted_text,
            "documentType": document_type,
            "confidence": float(confidence),
            "totalLines": lines_extracted,
            "totalPages": pages_processed,
            "qualityScore": quality_score,
            "medicalEntities": medical_entities[:5],
            "status": "completed"
        }
        
    except Exception as e:
        logger.error(f"❌ Error during processing: {str(e)}")
        
        # Save error record to DynamoDB
        error_record = {
            "documentId": document_id,
            "userId": user_id,
            "filename": s3_key.split('/')[-1],
            "s3Bucket": s3_bucket,
            "s3Key": s3_key,
            "createdAt": timestamp,
            "processingStatus": "failed",
            "errorMessage": str(e),
            "processingEngine": "paddleocr-fargate-high-accuracy"
        }
        
        try:
            table.put_item(Item=error_record)
            logger.info("💾 Error record saved to DynamoDB")
        except Exception as db_error:
            logger.error(f"Failed to save error record: {str(db_error)}")
        
        raise e
        
    finally:
        # Clean up the downloaded file
        if os.path.exists(local_pdf_path):
            os.remove(local_pdf_path)
            logger.info(f"🧹 Cleaned up temporary file: {local_pdf_path}")

def extract_text_high_accuracy(pdf_path: str, ocr) -> tuple:
    """Extract text from PDF with high accuracy settings"""
    logger.info("🔍 Opening PDF for high-accuracy processing...")
    
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    logger.info(f"📖 PDF contains {total_pages} pages")
    
    all_text_lines = []
    total_confidence = 0
    total_lines = 0
    
    for page_num in range(total_pages):
        logger.info(f"🔍 Processing page {page_num + 1}/{total_pages}")
        
        # Convert page to high-resolution image for better OCR
        page = doc.load_page(page_num)
        mat = fitz.Matrix(3.0, 3.0)  # Very high resolution (3x)
        pix = page.get_pixmap(matrix=mat)
        img_bytes = pix.tobytes("png")
        
        # Perform high-accuracy OCR
        try:
            result = ocr.ocr(img_bytes, cls=True)
            
            if result and result[0] is not None:
                page_lines = 0
                page_confidence = 0
                
                for line in result[0]:
                    if len(line) >= 2:
                        bbox = line[0]  # Bounding box
                        text_info = line[1]
                        
                        if isinstance(text_info, tuple):
                            text = text_info[0]
                            confidence = text_info[1]
                        else:
                            text = str(text_info)
                            confidence = 1.0
                        
                        # More lenient threshold for medical documents
                        if confidence > 0.5 and len(text.strip()) > 1:
                            # Post-process the text
                            cleaned_text = post_process_ocr_text(text)
                            if cleaned_text:
                                all_text_lines.append(cleaned_text)
                                total_confidence += confidence
                                total_lines += 1
                                page_lines += 1
                                page_confidence += confidence
                
                if page_lines > 0:
                    avg_page_confidence = page_confidence / page_lines
                    logger.info(f"   Page {page_num + 1}: {page_lines} lines, confidence: {avg_page_confidence:.3f}")
                else:
                    logger.warning(f"   Page {page_num + 1}: No text extracted")
                    
        except Exception as e:
            logger.error(f"   Error processing page {page_num + 1}: {str(e)}")
            continue
    
    doc.close()
    
    # Combine all text and calculate overall metrics
    full_text = combine_and_clean_text(all_text_lines)
    avg_confidence = total_confidence / total_lines if total_lines > 0 else 0
    
    logger.info(f"📊 OCR Summary:")
    logger.info(f"   Total pages: {total_pages}")
    logger.info(f"   Total lines: {total_lines}")
    logger.info(f"   Average confidence: {avg_confidence:.3f}")
    logger.info(f"   Final text length: {len(full_text)} characters")
    
    return full_text, avg_confidence, total_pages, total_lines

def post_process_ocr_text(text: str) -> str:
    """Post-process OCR text to fix common errors"""
    if not text or len(text.strip()) < 2:
        return ""
    
    import re
    
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text.strip())
    
    # Fix common OCR errors
    text = text.replace('|', 'I')  # Pipe to I
    text = text.replace('0', 'O') if text.isalpha() else text  # Context-aware O/0
    text = text.replace('5', 'S') if text.isalpha() else text  # Context-aware S/5
    
    # Remove very short meaningless strings
    if len(text) < 2:
        return ""
    
    return text

def combine_and_clean_text(text_lines: list) -> str:
    """Combine text lines and perform final cleaning"""
    if not text_lines:
        return ""
    
    # Remove duplicates while preserving order
    seen = set()
    unique_lines = []
    for line in text_lines:
        if line not in seen and len(line.strip()) > 2:
            seen.add(line)
            unique_lines.append(line)
    
    return '\n'.join(unique_lines)

def classify_medical_document_advanced(text: str) -> str:
    """Advanced medical document classification"""
    if not text:
        return 'unknown'
    
    text_lower = text.lower()
    
    # Enhanced classification with scoring
    classifications = [
        (['laboratory', 'lab result', 'test result', 'glucose', 'cholesterol', 'hemoglobin'], 'lab_result', 3),
        (['prescription', 'medication', 'pharmacy', 'rx', 'dosage', 'tablets'], 'prescription', 3),
        (['x-ray', 'mri', 'ct scan', 'ultrasound', 'radiology', 'imaging'], 'imaging_report', 3),
        (['discharge', 'hospital', 'admission', 'summary', 'patient care'], 'discharge_summary', 2),
        (['consultation', 'clinic note', 'follow up', 'examination'], 'consultation_note', 2),
        (['surgery', 'operation', 'procedure', 'surgical'], 'surgical_report', 2),
        (['medical', 'patient', 'doctor', 'clinic', 'health'], 'medical_document', 1)
    ]
    
    best_score = 0
    best_type = 'document'
    
    for keywords, doc_type, weight in classifications:
        score = sum(weight for keyword in keywords if keyword in text_lower)
        if score > best_score:
            best_score = score
            best_type = doc_type
    
    return best_type

def extract_medical_entities(text: str) -> list:
    """Extract medical entities from text"""
    if not text:
        return []
    
    text_lower = text.lower()
    entities = []
    
    medical_categories = {
        'medications': ['aspirin', 'ibuprofen', 'acetaminophen', 'metformin', 'lisinopril'],
        'conditions': ['diabetes', 'hypertension', 'asthma', 'copd', 'heart disease'],
        'tests': ['blood pressure', 'cholesterol', 'glucose', 'hemoglobin', 'x-ray'],
        'measurements': ['mg', 'ml', 'mmol', 'mg/dl', 'blood pressure'],
        'symptoms': ['pain', 'fever', 'cough', 'shortness of breath', 'fatigue']
    }
    
    for category, terms in medical_categories.items():
        for term in terms:
            if term in text_lower:
                entities.append({
                    'category': category,
                    'term': term
                })
    
    return entities

def calculate_quality_score(text: str, confidence: float, lines: int) -> str:
    """Calculate quality score based on multiple factors"""
    if confidence > 0.9 and lines > 20:
        return 'excellent'
    elif confidence > 0.8 and lines > 15:
        return 'very_good'
    elif confidence > 0.7 and lines > 10:
        return 'good'
    elif confidence > 0.6 and lines > 5:
        return 'fair'
    else:
        return 'poor'

if __name__ == "__main__":
    main()