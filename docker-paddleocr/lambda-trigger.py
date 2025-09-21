#!/usr/bin/env python3
"""
Lambda Trigger for High-Accuracy PaddleOCR Docker Service
Receives S3 events and triggers containerized OCR processing
"""

import json
import boto3
import requests
import logging
import os
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Configuration
OCR_SERVICE_URL = os.environ.get('OCR_SERVICE_URL', 'http://your-alb-url.com')
S3_BUCKET_NAME = 'testing-pdf-files-medpal'
AWS_REGION = 'us-east-1'

def lambda_handler(event, context):
    """
    Lambda handler that triggers high-accuracy OCR processing
    """
    try:
        logger.info(f"Received event for high-accuracy OCR processing")
        
        if 'Records' in event:
            return handle_s3_event(event)
        else:
            return handle_direct_invocation(event)
            
    except Exception as e:
        logger.error(f"Lambda trigger error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': f'OCR trigger failed: {str(e)}'
            })
        }

def handle_s3_event(event):
    """Handle S3 bucket event trigger"""
    results = []
    
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        
        logger.info(f"Triggering high-accuracy OCR for: s3://{bucket}/{key}")
        
        # Only process files in medpal-uploads folder
        if not key.startswith('medpal-uploads/'):
            logger.info(f"Skipping file outside medpal-uploads: {key}")
            continue
            
        if not any(key.lower().endswith(ext) for ext in ['.pdf', '.png', '.jpg', '.jpeg']):
            logger.info(f"Skipping unsupported file type: {key}")
            continue
        
        # Trigger high-accuracy OCR
        result = trigger_ocr_processing(bucket, key)
        results.append(result)
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'success': True,
            'triggered_files': len(results),
            'results': results
        })
    }

def handle_direct_invocation(event):
    """Handle direct Lambda invocation"""
    bucket = event.get('bucket', S3_BUCKET_NAME)
    key = event.get('key')
    
    if not key:
        return {
            'statusCode': 400,
            'body': json.dumps({
                'success': False,
                'error': 'key parameter required'
            })
        }
    
    result = trigger_ocr_processing(bucket, key)
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'success': True,
            'result': result
        })
    }

def trigger_ocr_processing(bucket: str, key: str, user_id: str = 'medpal-user'):
    """Trigger high-accuracy OCR processing via containerized service"""
    try:
        logger.info(f"🚀 Triggering high-accuracy OCR processing")
        logger.info(f"   📄 File: s3://{bucket}/{key}")
        logger.info(f"   👤 User: {user_id}")
        
        # Prepare request payload
        payload = {
            'bucket': bucket,
            'key': key,
            'userId': user_id,
            'requestId': context.aws_request_id if 'context' in globals() else 'lambda-trigger',
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Send request to containerized OCR service
        logger.info(f"🌐 Sending request to OCR service: {OCR_SERVICE_URL}")
        
        response = requests.post(
            f"{OCR_SERVICE_URL}/ocr",
            json=payload,
            timeout=300,  # 5 minutes timeout
            headers={
                'Content-Type': 'application/json',
                'User-Agent': 'MedPal-Lambda-Trigger/1.0'
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            
            logger.info(f"✅ High-accuracy OCR completed successfully")
            logger.info(f"   📊 Document ID: {result['result']['documentId']}")
            logger.info(f"   🎯 Confidence: {result['result']['confidence']:.3f}")
            logger.info(f"   📝 Lines extracted: {result['result']['totalLines']}")
            logger.info(f"   📄 Pages: {result['result']['totalPages']}")
            logger.info(f"   ⏱️ Processing time: {result['result'].get('processingTime', 'N/A')}")
            
            return {
                'success': True,
                'documentId': result['result']['documentId'],
                'confidence': result['result']['confidence'],
                'totalLines': result['result']['totalLines'],
                'totalPages': result['result']['totalPages'],
                'documentType': result['result']['documentType'],
                'qualityScore': result['result']['qualityScore'],
                'processingTime': result['result'].get('processingTime'),
                'status': 'completed',
                'engine': 'paddleocr-high-accuracy'
            }
        else:
            error_msg = f"OCR service returned status {response.status_code}: {response.text}"
            logger.error(f"❌ {error_msg}")
            
            return {
                'success': False,
                'error': error_msg,
                'status': 'failed'
            }
            
    except requests.exceptions.Timeout:
        error_msg = "OCR processing timed out (> 5 minutes)"
        logger.error(f"⏱️ {error_msg}")
        return {
            'success': False,
            'error': error_msg,
            'status': 'timeout'
        }
        
    except requests.exceptions.ConnectionError:
        error_msg = f"Failed to connect to OCR service at {OCR_SERVICE_URL}"
        logger.error(f"🔌 {error_msg}")
        return {
            'success': False,
            'error': error_msg,
            'status': 'connection_error'
        }
        
    except Exception as e:
        error_msg = f"Unexpected error triggering OCR: {str(e)}"
        logger.error(f"💥 {error_msg}")
        return {
            'success': False,
            'error': error_msg,
            'status': 'error'
        }

def health_check_ocr_service():
    """Check if the OCR service is healthy"""
    try:
        response = requests.get(f"{OCR_SERVICE_URL}/health", timeout=10)
        return response.status_code == 200
    except:
        return False