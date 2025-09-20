#!/usr/bin/env python3
"""
Simple PaddleOCR Test Script
Tests PaddleOCR with example.pdf file
"""

import os
import sys

def test_paddleocr():
    """Test PaddleOCR with example.pdf"""
    
    print("🚀 Testing PaddleOCR with example.pdf")
    print("=" * 50)
    
    # Check if example.pdf exists
    if not os.path.exists("example.pdf"):
        print("❌ example.pdf not found!")
        print("📝 Please place a PDF file named 'example.pdf' in this directory")
        return
    
    try:
        # Import required libraries
        print("📦 Importing libraries...")
        from paddleocr import PaddleOCR
        import fitz  # PyMuPDF
        from PIL import Image
        import io
        import numpy as np
        print("✅ All libraries imported successfully")
        
        # Initialize PaddleOCR
        print("\n🔍 Initializing PaddleOCR...")
        ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
        print("✅ PaddleOCR initialized")
        
        # Open PDF
        print(f"\n📄 Opening example.pdf...")
        pdf_document = fitz.open("example.pdf")
        total_pages = len(pdf_document)
        print(f"✅ PDF opened - {total_pages} page(s) found")
        
        all_extracted_text = []
        
        # Process each page
        for page_num in range(total_pages):
            print(f"\n--- Processing Page {page_num + 1}/{total_pages} ---")
            
            # Get page
            page = pdf_document.load_page(page_num)
            
            # Convert page to image
            print("🖼️  Converting page to image...")
            mat = fitz.Matrix(2.0, 2.0)  # 2x zoom for better quality
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            
            # Convert to PIL Image then numpy array
            img = Image.open(io.BytesIO(img_data))
            img_array = np.array(img)
            print(f"✅ Image converted ({img.size[0]}x{img.size[1]} pixels)")
            
            # Perform OCR
            print("🔍 Running OCR...")
            result = ocr.ocr(img_array, cls=True)
            
            # Extract text from results
            page_text = []
            if result and result[0]:
                print("📝 Text found:")
                for line in result[0]:
                    if len(line) >= 2:
                        # Extract text and confidence
                        text_info = line[1]
                        if isinstance(text_info, tuple):
                            text = text_info[0]
                            confidence = text_info[1]
                        else:
                            text = text_info
                            confidence = 1.0
                        
                        # Only include text with good confidence
                        if confidence > 0.6:
                            page_text.append(text)
                            print(f"   📄 {text} (confidence: {confidence:.2f})")
                        else:
                            print(f"   🔸 {text} (low confidence: {confidence:.2f}) - skipped")
            else:
                print("⚠️  No text detected on this page")
            
            # Add page text to results
            if page_text:
                all_extracted_text.append(f"=== PAGE {page_num + 1} ===")
                all_extracted_text.extend(page_text)
                all_extracted_text.append("")  # Empty line
        
        # Close PDF
        pdf_document.close()
        
        # Display final results
        print("\n" + "=" * 60)
        print("📋 COMPLETE EXTRACTED TEXT:")
        print("=" * 60)
        
        final_text = "\n".join(all_extracted_text)
        print(final_text)
        
        # Save to file
        with open("extracted_text.txt", "w", encoding="utf-8") as f:
            f.write(final_text)
        print(f"\n💾 Text saved to: extracted_text.txt")
        
        # Basic analysis
        print("\n📊 Quick Analysis:")
        word_count = len(final_text.split())
        line_count = len([line for line in all_extracted_text if line.strip()])
        print(f"   📝 Total words: {word_count}")
        print(f"   📄 Total lines: {line_count}")
        print(f"   📑 Total pages processed: {total_pages}")
        
        print("\n✅ PaddleOCR test completed successfully!")
        
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("\n📦 Install required packages:")
        print("   pip install paddleocr PyMuPDF Pillow numpy")
    
    except Exception as e:
        print(f"❌ Error during processing: {e}")
        print("\n💡 Possible solutions:")
        print("   1. Make sure example.pdf is a valid PDF file")
        print("   2. Check if you have enough disk space")
        print("   3. Ensure good internet connection (for model download)")

if __name__ == "__main__":
    test_paddleocr()