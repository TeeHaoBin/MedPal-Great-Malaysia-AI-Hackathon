#!/usr/bin/env python3
"""
Local testing script for Google Cloud Vision OCR
Test your GCP credentials and Vision API before deploying to Lambda
"""

import os
import json
import base64
import fitz  # PyMuPDF
from google.cloud import vision
from google.oauth2 import service_account

def test_gcp_vision_ocr(pdf_path, credentials_path):
    """Test Google Cloud Vision OCR locally"""
    
    print(f"🔍 Testing Google Cloud Vision OCR")
    print(f"📄 PDF: {pdf_path}")
    print(f"🔑 Credentials: {credentials_path}")
    print("-" * 50)
    
    try:
        # Load credentials
        with open(credentials_path, 'r') as f:
            credentials_info = json.load(f)
        
        credentials = service_account.Credentials.from_service_account_info(credentials_info)
        client = vision.ImageAnnotatorClient(credentials=credentials)
        
        print("✅ Google Cloud Vision client initialized")
        
        # Open PDF
        doc = fitz.open(pdf_path)
        print(f"📖 PDF opened: {len(doc)} pages")
        
        full_text = ""
        
        for page_num in range(min(len(doc), 3)):  # Test first 3 pages max
            print(f"🔄 Processing page {page_num + 1}...")
            
            page = doc.load_page(page_num)
            pix = page.get_pixmap(matrix=fitz.Matrix(2.0, 2.0))  # Higher resolution
            img_bytes = pix.tobytes("png")
            
            # Create Vision API request
            image = vision.Image(content=img_bytes)
            response = client.text_detection(image=image)
            texts = response.text_annotations
            
            if texts:
                page_text = texts[0].description
                full_text += f"--- Page {page_num + 1} ---\n{page_text}\n\n"
                print(f"✅ Page {page_num + 1}: {len(page_text)} characters extracted")
            else:
                print(f"⚠️  Page {page_num + 1}: No text found")
            
            # Check for errors
            if response.error.message:
                print(f"❌ Error on page {page_num + 1}: {response.error.message}")
        
        doc.close()
        
        print("-" * 50)
        print(f"🎉 OCR Complete!")
        print(f"📊 Total characters extracted: {len(full_text)}")
        print(f"📝 Sample text (first 200 chars):")
        print(full_text[:200] + "..." if len(full_text) > 200 else full_text)
        
        # Test base64 encoding (for Lambda)
        print("\n🔧 Testing base64 encoding for Lambda...")
        credentials_b64 = base64.b64encode(json.dumps(credentials_info).encode()).decode()
        print(f"✅ Base64 credentials ready (length: {len(credentials_b64)})")
        
        return full_text, credentials_b64
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None, None

def main():
    """Main function for local testing"""
    
    # Configuration - UPDATE THESE PATHS
    PDF_PATH = "test_pdfplumber.pdf"  # Update with your test PDF path
    CREDENTIALS_PATH = "gcp-service-account-key.json"  # Update with your GCP credentials path
    
    # Check if files exist
    if not os.path.exists(PDF_PATH):
        print(f"❌ PDF not found: {PDF_PATH}")
        print("Please update PDF_PATH in the script or place a test PDF file")
        return
    
    if not os.path.exists(CREDENTIALS_PATH):
        print(f"❌ GCP credentials not found: {CREDENTIALS_PATH}")
        print("Please update CREDENTIALS_PATH or download your service account key")
        return
    
    # Run test
    extracted_text, credentials_b64 = test_gcp_vision_ocr(PDF_PATH, CREDENTIALS_PATH)
    
    if extracted_text:
        print("\n🎯 Ready for Lambda deployment!")
        print("Use this base64 credentials string in your Lambda deployment:")
        print(f"GCP_CREDENTIALS_BASE64={credentials_b64[:50]}...")
        
        # Save results for inspection
        with open("tmp_rovodev_ocr_results.txt", "w") as f:
            f.write(extracted_text)
        print(f"💾 Full results saved to: tmp_rovodev_ocr_results.txt")
    else:
        print("\n❌ Test failed. Please check your setup.")

if __name__ == "__main__":
    main()