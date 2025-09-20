#!/usr/bin/env python3
"""
Fixed PaddleOCR to DynamoDB Integration
Handles Decimal types correctly for DynamoDB
"""

import os
import sys
import uuid
from datetime import datetime
from decimal import Decimal
import re

def paddleocr_to_simple_dynamodb():
    """Extract text from PDF and save to DynamoDB with correct data types"""
    
    print("🚀 Fixed PaddleOCR to DynamoDB")
    print("=" * 50)
    
    # Configuration
    config = {
        'AWS_REGION': 'us-east-1',
        'DYNAMODB_TABLE': 'OCR-Text-Extraction-Table',
        'USER_ID': 'medical-user-001',
        'PDF_FILE': 'example.pdf'
    }
    
    # Check if PDF exists
    if not os.path.exists(config['PDF_FILE']):
        print(f"❌ {config['PDF_FILE']} not found!")
        print("📝 Please place a PDF file named 'example.pdf' in this directory")
        return
    
    try:
        # Import required libraries
        print("📦 Importing libraries...")
        import boto3
        from paddleocr import PaddleOCR
        import fitz  # PyMuPDF
        from PIL import Image
        import io
        import numpy as np
        print("✅ All libraries imported successfully")
        
        # Initialize AWS DynamoDB
        print(f"🔗 Connecting to DynamoDB table: {config['DYNAMODB_TABLE']}")
        dynamodb = boto3.resource('dynamodb', region_name=config['AWS_REGION'])
        table = dynamodb.Table(config['DYNAMODB_TABLE'])
        print("✅ DynamoDB connection established")
        
        # Initialize PaddleOCR
        print("\n🔍 Initializing PaddleOCR...")
        ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
        print("✅ PaddleOCR initialized")
        
        # Generate document ID
        document_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        print(f"\n📄 Processing document: {config['PDF_FILE']}")
        print(f"📋 Document ID: {document_id}")
        
        # Open PDF and process all pages
        pdf_document = fitz.open(config['PDF_FILE'])
        total_pages = len(pdf_document)
        print(f"✅ PDF opened - {total_pages} page(s) found")
        
        # Extract text from all pages
        all_text_lines = []
        total_confidence = 0
        total_lines = 0
        
        for page_num in range(total_pages):
            print(f"\n--- Processing Page {page_num + 1}/{total_pages} ---")
            
            # Convert page to image
            page = pdf_document.load_page(page_num)
            mat = fitz.Matrix(2.0, 2.0)  # High resolution for better OCR
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            
            # Convert to numpy array for PaddleOCR
            img = Image.open(io.BytesIO(img_data))
            img_array = np.array(img)
            print(f"🖼️  Image converted ({img.size[0]}x{img.size[1]} pixels)")
            
            # Perform OCR
            print("🔍 Running OCR...")
            result = ocr.ocr(img_array, cls=True)
            
            # Extract text and calculate confidence
            page_lines = 0
            if result and result[0]:
                print("📝 Text found:")
                for line in result[0]:
                    if len(line) >= 2:
                        text_info = line[1]
                        if isinstance(text_info, tuple):
                            text = text_info[0]
                            confidence = text_info[1]
                        else:
                            text = text_info
                            confidence = 1.0
                        
                        # Only include high-confidence text
                        if confidence > 0.6:
                            all_text_lines.append(text)
                            total_confidence += confidence
                            total_lines += 1
                            page_lines += 1
                            print(f"   📄 {text} (confidence: {confidence:.2f})")
                        else:
                            print(f"   🔸 {text} (low confidence: {confidence:.2f}) - skipped")
            
            print(f"✅ Page {page_num + 1} processed: {page_lines} lines extracted")
        
        pdf_document.close()
        
        # Combine all text
        extracted_text = '\n'.join(all_text_lines)
        avg_confidence = total_confidence / total_lines if total_lines > 0 else 0
        
        # Basic medical document analysis
        document_type = classify_medical_document(extracted_text)
        
        # Prepare DynamoDB record with correct data types
        record = {
            'documentId': document_id,
            'userId': config['USER_ID'],
            'filename': config['PDF_FILE'],
            'extractedText': extracted_text,
            'documentType': document_type,
            'confidence': Decimal(str(round(avg_confidence, 2))),  # Convert to Decimal
            'totalLines': total_lines,  # Integer is fine
            'totalPages': total_pages,  # Integer is fine
            'createdAt': timestamp
        }
        
        # Save to DynamoDB
        print(f"\n💾 Saving to DynamoDB...")
        table.put_item(Item=record)
        print("✅ Successfully saved to DynamoDB!")
        
        # Display summary
        print(f"\n📊 Processing Summary:")
        print(f"   📄 Document: {config['PDF_FILE']}")
        print(f"   📋 Document ID: {document_id}")
        print(f"   📑 Pages processed: {total_pages}")
        print(f"   📝 Lines extracted: {total_lines}")
        print(f"   🎯 Average confidence: {avg_confidence:.2f}")
        print(f"   📚 Total characters: {len(extracted_text)}")
        print(f"   🏥 Document type: {document_type}")
        
        # Show text preview for LLM
        print(f"\n📋 Extracted Text for LLM:")
        print("-" * 60)
        if extracted_text:
            preview = extracted_text[:400] + "..." if len(extracted_text) > 400 else extracted_text
            print(preview)
        else:
            print("⚠️  No text was extracted. Check PDF quality or OCR settings.")
        print("-" * 60)
        
        # Save local copy
        with open("extracted_text_for_llm.txt", "w", encoding="utf-8") as f:
            f.write(extracted_text)
        print(f"💾 Local copy saved: extracted_text_for_llm.txt")
        
        # Show how to query for LLM
        print(f"\n🤖 Ready for LLM Integration:")
        print(f"   📋 Document ID: {document_id}")
        print(f"   🏥 Document Type: {document_type}")
        print(f"   🎯 Confidence: {avg_confidence:.2f}")
        print(f"   📝 Characters: {len(extracted_text)}")
        
        print(f"\n🔍 Query with AWS CLI:")
        print(f"aws dynamodb get-item \\")
        print(f"  --table-name {config['DYNAMODB_TABLE']} \\")
        print(f'  --key \'{{"documentId":{{"S":"{document_id}"}}}}\' \\')
        print(f"  --region {config['AWS_REGION']}")
        
        return document_id
        
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("\n📦 Install required packages:")
        print("   pip install boto3 paddleocr PyMuPDF Pillow numpy")
    
    except Exception as e:
        print(f"❌ Error during processing: {e}")
        import traceback
        traceback.print_exc()

def classify_medical_document(text):
    """Simple document classification for medical documents"""
    if not text:
        return 'unknown'
    
    text_lower = text.lower()
    
    # Check for lab results
    if any(keyword in text_lower for keyword in ['laboratory', 'lab result', 'glucose', 'cholesterol', 'blood test', 'hemoglobin']):
        return 'lab_result'
    
    # Check for prescriptions
    elif any(keyword in text_lower for keyword in ['prescription', 'medication', 'pharmacy', 'rx', 'tablets', 'mg', 'dosage']):
        return 'prescription'
    
    # Check for imaging reports
    elif any(keyword in text_lower for keyword in ['x-ray', 'mri', 'ct scan', 'ultrasound', 'radiology', 'imaging']):
        return 'imaging_report'
    
    # Check for discharge summaries
    elif any(keyword in text_lower for keyword in ['discharge', 'admission', 'hospital', 'summary', 'patient']):
        return 'discharge_summary'
    
    # Check for general medical
    elif any(keyword in text_lower for keyword in ['doctor', 'patient', 'medical', 'clinic', 'health', 'diagnosis']):
        return 'medical_document'
    
    # Default
    else:
        return 'document'

def query_document_for_llm(document_id, table_name='OCR-Text-Extraction-Table', region='us-east-1'):
    """Query document from DynamoDB for LLM processing"""
    try:
        import boto3
        
        dynamodb = boto3.resource('dynamodb', region_name=region)
        table = dynamodb.Table(table_name)
        
        response = table.get_item(Key={'documentId': document_id})
        
        if 'Item' in response:
            item = response['Item']
            print("✅ Document retrieved for LLM:")
            print(f"   📋 ID: {item['documentId']}")
            print(f"   📄 Filename: {item['filename']}")
            print(f"   🏥 Type: {item['documentType']}")
            print(f"   🎯 Confidence: {item['confidence']}")
            print(f"   📝 Text length: {len(item['extractedText'])} characters")
            print(f"   📑 Total pages: {item.get('totalPages', 'N/A')}")
            print(f"   📊 Total lines: {item.get('totalLines', 'N/A')}")
            
            return item
        else:
            print("❌ Document not found")
            return None
            
    except Exception as e:
        print(f"❌ Error querying document: {e}")
        return None

def create_llm_prompt_example(extracted_text, user_question, document_type='medical_document'):
    """Example of how to create LLM prompt with OCR text"""
    
    # Enhanced prompt based on document type
    type_instructions = {
        'lab_result': 'Focus on test values, normal ranges, and clinical significance.',
        'prescription': 'Focus on medications, dosages, and instructions.',
        'imaging_report': 'Focus on findings, impressions, and recommendations.',
        'discharge_summary': 'Focus on diagnosis, treatment, and follow-up care.',
        'medical_document': 'Provide general medical interpretation.'
    }
    
    specific_instruction = type_instructions.get(document_type, type_instructions['medical_document'])
    
    prompt = f"""
You are a medical AI assistant analyzing OCR-extracted text from a {document_type.replace('_', ' ')}.

IMPORTANT INSTRUCTIONS:
1. The text below was extracted using OCR and may contain scanning errors
2. Use medical context to interpret information correctly
3. If you see obvious OCR errors (like '0' instead of 'O', '1' instead of 'l'), correct them
4. {specific_instruction}
5. Always recommend consulting healthcare professionals for medical decisions

MEDICAL DOCUMENT TEXT:
{extracted_text}

PATIENT QUESTION: {user_question}

Please provide a clear, accurate medical interpretation based on the document content.
"""
    
    return prompt

def test_document_retrieval():
    """Test document retrieval and LLM prompt creation"""
    try:
        import boto3
        
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.Table('OCR-Text-Extraction-Table')
        
        # Get the most recent document
        response = table.scan(Limit=1)
        
        if response['Items']:
            latest_doc = response['Items'][0]
            document_id = latest_doc['documentId']
            
            print(f"\n🔍 Testing with document: {document_id}")
            
            # Retrieve document
            document_data = query_document_for_llm(document_id)
            
            if document_data:
                # Create example LLM prompt
                sample_question = "What are the key findings in this medical document?"
                example_prompt = create_llm_prompt_example(
                    document_data['extractedText'], 
                    sample_question,
                    document_data['documentType']
                )
                
                print(f"\n📋 Example LLM Prompt:")
                print("=" * 80)
                print(example_prompt)
                print("=" * 80)
                
                print(f"\n🎯 Ready for Bedrock Integration!")
                print(f"   📝 Text length: {len(document_data['extractedText'])} characters")
                print(f"   🏥 Document type: {document_data['documentType']}")
                print(f"   🎯 Quality score: {document_data['confidence']}")
                
                return True
        else:
            print("📝 No documents found in table. Run OCR processing first.")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    print("🏥 Fixed OCR to DynamoDB for LLM Integration")
    print("=" * 60)
    print("✅ Table already exists and is ready")
    print("📝 Fixed: Using Decimal types for DynamoDB numbers")
    print("")
    
    # Check if table has existing documents
    print("🔍 Checking for existing documents...")
    if test_document_retrieval():
        print("\n✨ Found existing documents - ready for LLM!")
    else:
        print("\n📄 Processing new PDF document...")
        # Run the main function
        document_id = paddleocr_to_simple_dynamodb()
        
        if document_id:
            print(f"\n🧪 Testing document retrieval...")
            query_document_for_llm(document_id)
            
            print(f"\n🎉 Success! Document ready for LLM integration!")
            print(f"   Use document ID: {document_id}")
            print(f"   Query the extractedText field for LLM prompts")