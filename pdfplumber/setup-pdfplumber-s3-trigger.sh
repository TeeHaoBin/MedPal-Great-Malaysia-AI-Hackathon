#!/bin/bash
# Setup S3 trigger for the PDFPlumber OCR Lambda

set -e

echo "🚀 Setting up S3 trigger for PDFPlumber OCR Lambda"
echo "=================================================="

# Configuration
S3_BUCKET="testing-pdf-files-medpal"
LAMBDA_FUNCTION="medpal-pdfplumber-ocr" # <-- This is our new function
REGION="us-east-1"

echo "📋 Configuration:"
echo "   S3 Bucket: $S3_BUCKET"
echo "   Lambda Function: $LAMBDA_FUNCTION"

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "   Account ID: $ACCOUNT_ID"

# To prevent race conditions, first remove any existing permissions.
echo "🧹 Cleaning up old permissions..."
aws lambda remove-permission \
    --function-name $LAMBDA_FUNCTION \
    --statement-id s3-pdfplumber-ocr-permission \
    --region $REGION 2>/dev/null || echo "   No existing permission to remove."

# Add S3 invoke permission to the Lambda function
echo "🔐 Adding S3 invoke permission..."
aws lambda add-permission \
    --function-name $LAMBDA_FUNCTION \
    --principal s3.amazonaws.com \
    --action lambda:InvokeFunction \
    --statement-id s3-pdfplumber-ocr-permission \
    --source-arn arn:aws:s3:::$S3_BUCKET \
    --region $REGION

echo "⏳ Waiting 5 seconds for permissions to propagate..."
sleep 5

echo "✅ Permission added successfully."

# Create the S3 notification configuration JSON file
echo "📝 Creating S3 notification configuration..."
cat > notification-config.json << EOF
{
    "LambdaFunctionConfigurations": [
        {
            "Id": "medpal-pdfplumber-ocr-trigger",
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

# Apply the notification configuration to the S3 bucket
echo "📤 Applying S3 notification configuration..."
aws s3api put-bucket-notification-configuration \
    --bucket $S3_BUCKET \
    --notification-configuration file://notification-config.json

echo "✅ S3 trigger configured successfully!"

# Clean up the temporary JSON file
rm -f notification-config.json

echo ""
echo "🎉 S3 Trigger Setup Complete!"
echo "=============================";
echo "✅ Your MedPal OCR system is now live with the pdfplumber engine."
