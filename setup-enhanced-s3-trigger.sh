#!/bin/bash
# Setup S3 trigger for Instant OCR Lambda

set -e

echo "🚀 Setting up S3 trigger for Instant OCR Lambda"
echo "=============================================="

# Configuration
S3_BUCKET="testing-pdf-files-medpal"
LAMBDA_FUNCTION="medpal-enhanced-ocr"
REGION="us-east-1"

echo "📋 Configuration:"
echo "   S3 Bucket: $S3_BUCKET"
echo "   Lambda Function: $LAMBDA_FUNCTION"
echo "   Region: $REGION"

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "   Account ID: $ACCOUNT_ID"

# Check if Lambda function exists
echo "🔍 Checking Lambda function..."
if aws lambda get-function --function-name $LAMBDA_FUNCTION --region $REGION >/dev/null 2>&1; then
    echo "✅ Lambda function found"
else
    echo "❌ Lambda function not found"
    exit 1
fi

# Remove existing permissions
echo "🧹 Cleaning up existing permissions..."
aws lambda remove-permission \
    --function-name $LAMBDA_FUNCTION \
    --statement-id s3-instant-ocr-permission \
    --region $REGION \
    2>/dev/null || echo "   No existing permission found"

# Add S3 invoke permission
echo "🔐 Adding S3 invoke permission..."
aws lambda add-permission \
    --function-name $LAMBDA_FUNCTION \
    --principal s3.amazonaws.com \
    --action lambda:InvokeFunction \
    --statement-id s3-instant-ocr-permission \
    --source-arn arn:aws:s3:::$S3_BUCKET \
    --region $REGION

echo "✅ Permission added successfully"

# Create S3 notification configuration
echo "📝 Creating S3 notification configuration..."
cat > notification-config.json << EOF
{
    "LambdaFunctionConfigurations": [
        {
            "Id": "medpal-enhanced-ocr-pdf-trigger",
            "LambdaFunctionArn": "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${LAMBDA_FUNCTION}",
            "Events": ["s3:ObjectCreated:*"],
            "Filter": {
                "Key": {
                    "FilterRules": [
                        {
                            "Name": "prefix",
                            "Value": "medpal-uploads/"
                        },
                        {
                            "Name": "suffix",
                            "Value": ".pdf"
                        }
                    ]
                }
            }
        }
    ]
}
EOF

# Apply S3 notification configuration
echo "📤 Applying S3 notification configuration..."
aws s3api put-bucket-notification-configuration \
    --bucket $S3_BUCKET \
    --notification-configuration file://notification-config.json

echo "✅ S3 trigger configured successfully!"

# Verify configuration
echo "🔍 Verifying configuration..."
aws s3api get-bucket-notification-configuration --bucket $S3_BUCKET > current-config.json

if grep -q "$LAMBDA_FUNCTION" current-config.json; then
    echo "✅ S3 notification verified - Lambda will be triggered on PDF uploads"
else
    echo "⚠️  Verification incomplete - check AWS Console"
fi

# Clean up
rm -f notification-config.json current-config.json

echo ""
echo "🎉 S3 Trigger Setup Complete!"
echo "============================="
echo "✅ Trigger: PDF files uploaded to medpal-uploads/"
echo "✅ Lambda: $LAMBDA_FUNCTION"
echo "✅ Table: OCR-Text-Extraction-Table"
echo ""
echo "🧪 Test the complete workflow:"
echo "1. Upload PDF through MedPal UI"
echo "2. Or manually:"
echo "   aws s3 cp test.pdf s3://$S3_BUCKET/medpal-uploads/"
echo ""
echo "🔍 Monitor processing:"
echo "   aws logs tail /aws/lambda/$LAMBDA_FUNCTION --follow"
echo ""
echo "📊 Check results:"
echo "   aws dynamodb scan --table-name OCR-Text-Extraction-Table --max-items 5"
echo ""
echo "🎉 Your MedPal OCR system is now live!"
echo "Upload a PDF through your existing MedPal interface and watch it process automatically!"