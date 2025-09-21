#!/usr/bin/env python3
"""
High-Accuracy PaddleOCR Processor for MedPal
Runs in Docker container with full PaddleOCR capabilities
"""

import os
import sys
import boto3
import uuid
import tempfile
import json
import io
from datetime import datetime
from decimal import Decimal
import logging
from flask import Flask, request, jsonify
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# AWS Configuration
S3_BUCKET_NAME = os.environ.get('S3_BUCKET_NAME', 'testing-pdf-files-medpal')
DYNAMODB_TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', 'OCR-Text-Extraction-Table')
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')

# Initialize Flask app for health checks
app = Flask(__name__)

# Global OCR instance (initialize once for performance)
ocr_instance = None

def initialize_ocr():
    """Initialize PaddleOCR instance"""
    global ocr_instance
    if ocr_instance is None:
        try:
            from paddleocr import PaddleOCR
            logger.info("Initializing PaddleOCR with high accuracy settings...")
            
            ocr_instance = PaddleOCR(
                use_angle_cls=True,
                lang='en',
                show_log=False,
                use_gpu=False,  # Set to True if GPU available
                # High accuracy settings
                det_db_thresh=0.3,
                det_db_box_thresh=0.5,
                det_db_unclip_ratio=1.6,
                rec_batch_num=6
            )
            logger.info("✅ PaddleOCR initialized successfully")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to initialize PaddleOCR: {str(e)}")
            return False
    return True

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        if initialize_ocr():
            return jsonify({
                'status': 'healthy',
                'paddleocr': 'available',
                'timestamp': datetime.utcnow().isoformat()
            }), 200
        else:
            return jsonify({
                'status': 'unhealthy',
                'error': 'PaddleOCR initialization failed'
            }), 500
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/ocr', methods=['POST'])
def process_ocr_request():
    """Process OCR request"""
    try:
        data = request.get_json()
        bucket = data.get('bucket', S3_BUCKET_NAME)
        key = data.get('key')
        user_id = data.get('userId', 'medpal-user')
        
        if not key:
            return jsonify({
                'success': False,
                'error': 'key parameter required'
            }), 400
        
        result = process_document_high_accuracy(bucket, key, user_id)
        
        return jsonify({
            'success': True,
            'result': result
        }), 200
        
    except Exception as e:
        logger.error(f"OCR request failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def process_document_high_accuracy(bucket: str, key: str, user_id: str = 'medpal-user'):
    """Process document with high-accuracy PaddleOCR"""
    document_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    try:
        logger.info(f"🔍 Starting high-accuracy OCR processing - Document ID: {document_id}")
        
        # Initialize OCR if needed
        if not initialize_ocr():
            raise Exception("PaddleOCR initialization failed")
        
        # Download file from S3
        s3_client = boto3.client('s3', region_name=AWS_REGION)
        
        # Get file metadata
        head_response = s3_client.head_object(Bucket=bucket, Key=key)
        file_size = head_response['ContentLength']
        content_type = head_response['ContentType']
        original_name = head_response.get('Metadata', {}).get('originalname', key.split('/')[-1])
        
        logger.info(f"📄 Processing: {original_name} ({file_size} bytes)")
        
        # Download to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=get_file_extension(original_name)) as tmp_file:
            s3_client.download_fileobj(bucket, key, tmp_file)
            temp_file_path = tmp_file.name
        
        try:
            # Process based on file type with high-accuracy OCR
            if content_type == 'application/pdf':
                extracted_text, confidence, pages_processed, lines_extracted = process_pdf_high_accuracy(temp_file_path)
            elif content_type.startswith('image/'):
                extracted_text, confidence, pages_processed, lines_extracted = process_image_high_accuracy(temp_file_path)
            else:
                raise ValueError(f"Unsupported file type: {content_type}")
            
            # Advanced medical document analysis
            document_type = classify_medical_document_advanced(extracted_text)
            medical_entities = extract_medical_entities_advanced(extracted_text)
            quality_score = calculate_quality_score_advanced(extracted_text, confidence, lines_extracted)
            
            # Prepare comprehensive DynamoDB record
            record = {
                'documentId': document_id,
                'userId': user_id,
                'filename': original_name,
                'extractedText': extracted_text,
                'documentType': document_type,
                'confidence': Decimal(str(round(confidence, 4))),
                'totalLines': lines_extracted,
                'totalPages': pages_processed,
                'fileSize': file_size,
                'contentType': content_type,
                's3Bucket': bucket,
                's3Key': key,
                'createdAt': timestamp,
                'processingEngine': 'paddleocr-high-accuracy',
                'qualityScore': quality_score,
                'medicalEntities': medical_entities[:15],  # Top 15 entities
                'ocrSettings': {
                    'use_angle_cls': True,
                    'language': 'en',
                    'accuracy_mode': 'high'
                }
            }
            
            # Save to DynamoDB
            save_to_dynamodb(record)
            
            logger.info(f"✅ High-accuracy OCR completed successfully: {document_id}")
            
            return {
                'documentId': document_id,
                'extractedText': extracted_text[:1000] + '...' if len(extracted_text) > 1000 else extracted_text,
                'documentType': document_type,
                'confidence': float(confidence),
                'totalLines': lines_extracted,
                'totalPages': pages_processed,
                'qualityScore': quality_score,
                'medicalEntities': medical_entities[:5],
                'processingTime': f"{(datetime.utcnow() - datetime.fromisoformat(timestamp.replace('Z', '+00:00').replace('+00:00', ''))).total_seconds():.1f}s",
                'status': 'completed'
            }
            
        finally:
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
        
    except Exception as e:
        logger.error(f"❌ Error processing document {document_id}: {str(e)}")
        logger.error(traceback.format_exc())
        
        # Save error record
        error_record = {
            'documentId': document_id,
            'userId': user_id,
            'filename': key.split('/')[-1],
            's3Bucket': bucket,
            's3Key': key,
            'createdAt': timestamp,
            'processingStatus': 'failed',
            'errorMessage': str(e),
            'processingEngine': 'paddleocr-high-accuracy'
        }
        
        try:
            save_to_dynamodb(error_record)
        except Exception as db_error:
            logger.error(f"Failed to save error record: {str(db_error)}")
        
        raise e

def process_pdf_high_accuracy(file_path: str) -> tuple:
    """Process PDF with high-accuracy PaddleOCR settings"""
    global ocr_instance
    
    try:
        import fitz  # PyMuPDF
        from PIL import Image
        import numpy as np
        
        logger.info("🔍 Processing PDF with high-accuracy PaddleOCR")
        
        # Open PDF
        pdf_document = fitz.open(file_path)
        total_pages = len(pdf_document)
        
        logger.info(f"📖 PDF contains {total_pages} pages")
        
        all_text_lines = []
        total_confidence = 0
        total_lines = 0
        
        for page_num in range(total_pages):
            logger.info(f"🔍 Processing page {page_num + 1}/{total_pages}")
            
            # Convert page to high-resolution image
            page = pdf_document.load_page(page_num)
            mat = fitz.Matrix(3.0, 3.0)  # Very high resolution for maximum accuracy
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            
            # Convert to numpy array for PaddleOCR
            img = Image.open(io.BytesIO(img_data))
            
            # Image preprocessing for better OCR
            img = enhance_image_for_ocr(img)
            img_array = np.array(img)
            
            logger.info(f"🖼️ Image prepared: {img.size[0]}x{img.size[1]} pixels")
            
            # Perform high-accuracy OCR
            result = ocr_instance.ocr(img_array, cls=True)
            
            # Extract text with detailed confidence analysis
            if result and result[0]:
                for line in result[0]:
                    if len(line) >= 2:
                        bbox = line[0]  # Bounding box coordinates
                        text_info = line[1]
                        
                        if isinstance(text_info, tuple):
                            text = text_info[0]
                            confidence = text_info[1]
                        else:
                            text = text_info
                            confidence = 1.0
                        
                        # More lenient threshold for medical documents
                        if confidence > 0.5 and len(text.strip()) > 1:
                            # Post-process text
                            cleaned_text = post_process_ocr_text(text)
                            if cleaned_text:
                                all_text_lines.append(cleaned_text)
                                total_confidence += confidence
                                total_lines += 1
                                
                                logger.debug(f"📝 Extracted: '{cleaned_text}' (conf: {confidence:.3f})")
        
        pdf_document.close()
        
        # Combine and clean all text
        extracted_text = combine_and_clean_text(all_text_lines)
        avg_confidence = total_confidence / total_lines if total_lines > 0 else 0
        
        logger.info(f"✅ PDF processing completed:")
        logger.info(f"   📖 Pages: {total_pages}")
        logger.info(f"   📝 Lines: {total_lines}")
        logger.info(f"   🎯 Confidence: {avg_confidence:.3f}")
        logger.info(f"   📊 Text length: {len(extracted_text)} characters")
        
        return extracted_text, avg_confidence, total_pages, total_lines
        
    except Exception as e:
        logger.error(f"PDF processing error: {str(e)}")
        raise e

def process_image_high_accuracy(file_path: str) -> tuple:
    """Process image with high-accuracy PaddleOCR"""
    global ocr_instance
    
    try:
        from PIL import Image
        import numpy as np
        
        logger.info("🔍 Processing image with high-accuracy PaddleOCR")
        
        # Load and enhance image
        img = Image.open(file_path)
        img = enhance_image_for_ocr(img)
        img_array = np.array(img)
        
        logger.info(f"🖼️ Image prepared: {img.size[0]}x{img.size[1]} pixels")
        
        # Perform OCR
        result = ocr_instance.ocr(img_array, cls=True)
        
        all_text_lines = []
        total_confidence = 0
        total_lines = 0
        
        if result and result[0]:
            for line in result[0]:
                if len(line) >= 2:
                    text_info = line[1]
                    
                    if isinstance(text_info, tuple):
                        text = text_info[0]
                        confidence = text_info[1]
                    else:
                        text = text_info
                        confidence = 1.0
                    
                    if confidence > 0.5 and len(text.strip()) > 1:
                        cleaned_text = post_process_ocr_text(text)
                        if cleaned_text:
                            all_text_lines.append(cleaned_text)
                            total_confidence += confidence
                            total_lines += 1
        
        extracted_text = combine_and_clean_text(all_text_lines)
        avg_confidence = total_confidence / total_lines if total_lines > 0 else 0
        
        logger.info(f"✅ Image processing completed:")
        logger.info(f"   📝 Lines: {total_lines}")
        logger.info(f"   🎯 Confidence: {avg_confidence:.3f}")
        
        return extracted_text, avg_confidence, 1, total_lines
        
    except Exception as e:
        logger.error(f"Image processing error: {str(e)}")
        raise e

def enhance_image_for_ocr(img):
    """Enhance image quality for better OCR results"""
    try:
        from PIL import ImageEnhance, ImageFilter
        
        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Enhance contrast
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.2)
        
        # Enhance sharpness
        enhancer = ImageEnhance.Sharpness(img)
        img = enhancer.enhance(1.1)
        
        # Apply slight denoising
        img = img.filter(ImageFilter.MedianFilter(size=3))
        
        return img
        
    except Exception as e:
        logger.warning(f"Image enhancement failed: {str(e)}")
        return img

def post_process_ocr_text(text: str) -> str:
    """Post-process OCR text to fix common errors"""
    if not text:
        return ""
    
    # Remove excessive whitespace
    import re
    text = re.sub(r'\s+', ' ', text.strip())
    
    # Fix common OCR errors
    text = text.replace('|', 'I')  # Pipe to I
    text = text.replace('0', 'O').replace('O', '0') if text.isdigit() else text  # Context-aware 0/O
    
    # Remove very short meaningless strings
    if len(text) < 2:
        return ""
    
    return text

def combine_and_clean_text(text_lines: list) -> str:
    """Combine text lines and perform final cleaning"""
    if not text_lines:
        return ""
    
    # Join lines with newlines
    full_text = '\n'.join(text_lines)
    
    # Remove duplicate lines while preserving order
    seen = set()
    unique_lines = []
    for line in text_lines:
        if line not in seen:
            seen.add(line)
            unique_lines.append(line)
    
    return '\n'.join(unique_lines)

def classify_medical_document_advanced(text: str) -> str:
    """Advanced medical document classification with scoring"""
    if not text:
        return 'unknown'
    
    text_lower = text.lower()
    
    # Enhanced classification with weighted scoring
    classifications = [
        (['laboratory', 'lab result', 'test result', 'glucose', 'cholesterol', 'hemoglobin', 'white blood cell'], 'lab_result', 3),
        (['prescription', 'medication', 'pharmacy', 'rx', 'dosage', 'tablets', 'take with food'], 'prescription', 3),
        (['x-ray', 'mri', 'ct scan', 'ultrasound', 'radiology', 'imaging', 'mammogram'], 'imaging_report', 3),
        (['discharge', 'hospital', 'admission', 'summary', 'patient care'], 'discharge_summary', 2),
        (['consultation', 'clinic note', 'follow up', 'examination', 'vital signs'], 'consultation_note', 2),
        (['surgery', 'operation', 'procedure', 'surgical', 'operative'], 'surgical_report', 2),
        (['medical', 'patient', 'doctor', 'clinic', 'health', 'diagnosis'], 'medical_document', 1)
    ]
    
    best_score = 0
    best_type = 'document'
    
    for keywords, doc_type, weight in classifications:
        score = sum(weight for keyword in keywords if keyword in text_lower)
        if score > best_score:
            best_score = score
            best_type = doc_type
    
    return best_type

def extract_medical_entities_advanced(text: str) -> list:
    """Advanced medical entity extraction"""
    if not text:
        return []
    
    text_lower = text.lower()
    entities = []
    
    # Comprehensive medical terms
    medical_categories = {
        'medications': ['aspirin', 'ibuprofen', 'acetaminophen', 'metformin', 'lisinopril', 'atorvastatin', 'omeprazole'],
        'conditions': ['diabetes', 'hypertension', 'asthma', 'copd', 'heart disease', 'obesity', 'arthritis'],
        'tests': ['blood pressure', 'cholesterol', 'glucose', 'hemoglobin', 'x-ray', 'mri', 'ecg'],
        'measurements': ['mg', 'ml', 'mmol', 'mg/dl', 'blood pressure', 'temperature', 'weight'],
        'symptoms': ['pain', 'fever', 'cough', 'shortness of breath', 'fatigue', 'nausea', 'dizziness'],
        'anatomy': ['heart', 'lung', 'liver', 'kidney', 'brain', 'stomach', 'chest']
    }
    
    for category, terms in medical_categories.items():
        for term in terms:
            if term in text_lower:
                # Extract context around the term
                context = extract_context(text, term)
                entities.append({
                    'category': category,
                    'term': term,
                    'context': context
                })
    
    return entities

def extract_context(text: str, term: str, context_size: int = 50) -> str:
    """Extract context around a medical term"""
    try:
        term_pos = text.lower().find(term.lower())
        if term_pos != -1:
            start = max(0, term_pos - context_size)
            end = min(len(text), term_pos + len(term) + context_size)
            return text[start:end].strip()
        return ""
    except:
        return ""

def calculate_quality_score_advanced(text: str, confidence: float, lines: int) -> str:
    """Advanced quality scoring"""
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

def get_file_extension(filename: str) -> str:
    """Get file extension"""
    if '.' in filename:
        return '.' + filename.split('.')[-1].lower()
    return '.tmp'

def save_to_dynamodb(record):
    """Save OCR results to DynamoDB"""
    try:
        dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
        table = dynamodb.Table(DYNAMODB_TABLE_NAME)
        
        table.put_item(Item=record)
        logger.info(f"💾 Saved to DynamoDB: {record['documentId']}")
        
    except Exception as e:
        logger.error(f"DynamoDB save error: {str(e)}")
        raise e

def main():
    """Main function for standalone processing"""
    if len(sys.argv) < 3:
        print("Usage: python ocr_processor.py <bucket> <key> [user_id]")
        sys.exit(1)
    
    bucket = sys.argv[1]
    key = sys.argv[2]
    user_id = sys.argv[3] if len(sys.argv) > 3 else 'medpal-user'
    
    try:
        result = process_document_high_accuracy(bucket, key, user_id)
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Command line mode
        main()
    else:
        # Web server mode
        logger.info("🚀 Starting PaddleOCR web server...")
        initialize_ocr()
        app.run(host='0.0.0.0', port=8080, debug=False)