#!/bin/bash
# Create custom PaddleOCR Lambda layer

set -e

echo "🚀 Creating Custom PaddleOCR Lambda Layer"
echo "========================================"

LAYER_NAME="medpal-paddleocr-layer"
REGION="us-east-1"

echo "📋 Configuration:"
echo "   Layer Name: $LAYER_NAME"
echo "   Region: $REGION"

# Create layer directory
echo "📦 Creating layer structure..."
rm -rf layer-build
mkdir -p layer-build/python

# Install PaddleOCR and dependencies
echo "📦 Installing PaddleOCR (this may take 10-15 minutes)..."
pip install paddleocr==2.7.3 -t layer-build/python/
pip install paddlepaddle==2.5.2 -t layer-build/python/
pip install opencv-python-headless==4.8.1.78 -t layer-build/python/
pip install PyMuPDF==1.23.26 -t layer-build/python/
pip install Pillow==10.2.0 -t layer-build/python/
pip install numpy==1.24.3 -t layer-build/python/

# Clean up unnecessary files to reduce size
echo "🧹 Cleaning up layer..."
find layer-build/python -name "*.pyc" -delete
find layer-build/python -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find layer-build/python -name "*.so" -exec strip {} \; 2>/dev/null || true

# Create layer zip
echo "🗜️ Creating layer package..."
cd layer-build
zip -r ../paddleocr-layer.zip . -q
cd ..

LAYER_SIZE=$(du -h paddleocr-layer.zip | cut -f1)
echo "✅ Layer package created: paddleocr-layer.zip ($LAYER_SIZE)"

# Check size limit (Lambda layers must be < 250MB)
LAYER_SIZE_MB=$(du -m paddleocr-layer.zip | cut -f1)
if [ $LAYER_SIZE_MB -gt 250 ]; then
    echo "⚠️  Warning: Layer size ($LAYER_SIZE_MB MB) exceeds Lambda limit (250MB)"
    echo "Consider using EFS or container approach instead"
fi

# Publish layer
echo "📤 Publishing Lambda layer..."
LAYER_ARN=$(aws lambda publish-layer-version \
    --layer-name $LAYER_NAME \
    --zip-file fileb://paddleocr-layer.zip \
    --compatible-runtimes python3.9 python3.8 \
    --region $REGION \
    --query 'LayerVersionArn' \
    --output text)

echo "✅ Layer published successfully!"
echo "📋 Layer ARN: $LAYER_ARN"

# Clean up
rm -rf layer-build paddleocr-layer.zip

echo ""
echo "🎉 Custom PaddleOCR Layer Created!"
echo "================================="
echo "✅ Layer Name: $LAYER_NAME"
echo "✅ Layer ARN: $LAYER_ARN"
echo ""
echo "📋 Next Steps:"
echo "1. Update Lambda function to use this layer:"
echo "   aws lambda update-function-configuration \\"
echo "     --function-name medpal-instant-ocr \\"
echo "     --layers $LAYER_ARN"
echo ""
echo "2. Update Lambda function code to use PaddleOCR instead of basic parsing"
echo ""
echo "💡 This layer is owned by you, so no permission issues!"