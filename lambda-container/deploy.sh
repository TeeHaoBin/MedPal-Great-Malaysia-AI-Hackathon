#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# --- Configuration ---
AWS_ACCOUNT_ID=""
AWS_REGION="" # e.g., us-east-1
ECR_REPOSITORY_NAME="paddleocr-lambda-container"
LAMBDA_FUNCTION_NAME="paddleocr-processor"
IAM_ROLE_NAME="LambdaPaddleOCRRole"
IAM_POLICY_NAME="LambdaPaddleOCRPolicy"

# S3 and DynamoDB details from your project
S3_BUCKET_NAME="testing-pdf-files-medpal"
S3_PREFIX="medpal-uploads/" # The folder inside the bucket
DYNAMODB_TABLE_NAME="OCR-Text-Extraction-Table"

# --- Script ---

# 1. Get User Input
if [ -z "$AWS_ACCOUNT_ID" ]; then
  read -p "Enter your AWS Account ID: " AWS_ACCOUNT_ID
fi
if [ -z "$AWS_REGION" ]; then
  read -p "Enter your AWS Region: " AWS_REGION
fi

IMAGE_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_NAME:latest"
IAM_ROLE_ARN="arn:aws:iam::$AWS_ACCOUNT_ID:role/$IAM_ROLE_NAME"

echo "--- Starting Deployment ---"
echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "AWS Region:     $AWS_REGION"
echo "Image URI:      $IMAGE_URI"
echo "---------------------------"

# 2. Login to AWS ECR
echo "Logging in to Amazon ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# 3. Create ECR repository if it doesn't exist
echo "Checking for ECR repository: $ECR_REPOSITORY_NAME..."
if ! aws ecr describe-repositories --repository-names $ECR_REPOSITORY_NAME --region $AWS_REGION > /dev/null 2>&1; then
  echo "Repository not found. Creating..."
  aws ecr create-repository --repository-name $ECR_REPOSITORY_NAME --region $AWS_REGION --image-scanning-configuration scanOnPush=true --image-tag-mutability MUTABLE
else
  echo "Repository already exists."
fi

# 4. Build and Push Docker Image
echo "Building Docker image..."
docker build -t $ECR_REPOSITORY_NAME .

echo "Tagging Docker image for ECR..."
docker tag $ECR_REPOSITORY_NAME:latest $IMAGE_URI

echo "Pushing Docker image to ECR..."
docker push $IMAGE_URI

# 5. Create IAM Role and Policy
echo "Setting up IAM Role and Policy..."
POLICY_DOCUMENT=$(cat <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
            "Resource": "arn:aws:logs:$AWS_REGION:$AWS_ACCOUNT_ID:*"
        },
        {
            "Effect": "Allow",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$S3_BUCKET_NAME/*"
        },
        {
            "Effect": "Allow",
            "Action": "dynamodb:PutItem",
            "Resource": "arn:aws:dynamodb:$AWS_REGION:$AWS_ACCOUNT_ID:table/$DYNAMODB_TABLE_NAME"
        }
    ]
}
EOF
)

ASSUME_ROLE_POLICY_DOCUMENT=$(cat <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF
)

if ! aws iam get-role --role-name $IAM_ROLE_NAME --region $AWS_REGION > /dev/null 2>&1; then
    echo "IAM Role not found. Creating..."
    aws iam create-role --role-name $IAM_ROLE_NAME --assume-role-policy-document "$ASSUME_ROLE_POLICY_DOCUMENT" --region $AWS_REGION
    echo "IAM Role created. Attaching policy..."
    aws iam put-role-policy --role-name $IAM_ROLE_NAME --policy-name $IAM_POLICY_NAME --policy-document "$POLICY_DOCUMENT" --region $AWS_REGION
    echo "Waiting for IAM role to propagate..."
    sleep 10
else
    echo "IAM Role already exists. Updating policy..."
    aws iam put-role-policy --role-name $IAM_ROLE_NAME --policy-name $IAM_POLICY_NAME --policy-document "$POLICY_DOCUMENT" --region $AWS_REGION
fi

# 6. Create/Update Lambda Function
echo "Checking for Lambda function: $LAMBDA_FUNCTION_NAME..."
if ! aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME --region $AWS_REGION > /dev/null 2>&1; then
    echo "Lambda function not found. Creating..."
    aws lambda create-function \
      --function-name $LAMBDA_FUNCTION_NAME \
      --package-type Image \
      --code ImageUri=$IMAGE_URI \
      --role $IAM_ROLE_ARN \
      --memory-size 3008 \
      --timeout 600 \
      --region $AWS_REGION
    echo "Waiting for function to be created..."
    aws lambda wait function-exists --function-name $LAMBDA_FUNCTION_NAME --region $AWS_REGION
else
    echo "Lambda function found. Updating code..."
    aws lambda update-function-code \
      --function-name $LAMBDA_FUNCTION_NAME \
      --image-uri $IMAGE_URI \
      --region $AWS_REGION
    echo "Waiting for function update to complete..."
    aws lambda wait function-updated --function-name $LAMBDA_FUNCTION_NAME --region $AWS_REGION
fi

# 7. Update Lambda Environment Variables
echo "Updating Lambda environment variables..."
aws lambda update-function-configuration \
  --function-name $LAMBDA_FUNCTION_NAME \
  --environment "Variables={PADDLE_CACHE_HOME=/tmp/paddle_cache}" \
  --region $AWS_REGION

# 8. Add S3 trigger permissions
echo "Adding S3 trigger permissions to Lambda..."
# We remove old permissions to avoid conflicts, then add the new one.
aws lambda remove-permission --function-name $LAMBDA_FUNCTION_NAME --statement-id "S3-Invoke-Permission-$(date +%s)" --region $AWS_REGION 2>/dev/null || true
aws lambda add-permission \
  --function-name $LAMBDA_FUNCTION_NAME \
  --statement-id "S3-Invoke-Permission-$(date +%s)" \
  --action "lambda:InvokeFunction" \
  --principal s3.amazonaws.com \
  --source-arn "arn:aws:s3:::$S3_BUCKET_NAME" \
  --source-account $AWS_ACCOUNT_ID \
  --region $AWS_REGION

echo "Waiting for permissions to propagate..."
sleep 15

# 9. Create S3 bucket notification configuration
echo "Configuring S3 bucket notification..."
NOTIFICATION_CONFIG=$(cat <<EOF
{
    "LambdaFunctionConfigurations": [
        {
            "Id": "paddleocr-trigger-config",
            "LambdaFunctionArn": "arn:aws:lambda:$AWS_REGION:$AWS_ACCOUNT_ID:function:$LAMBDA_FUNCTION_NAME",
            "Events": ["s3:ObjectCreated:*"],
            "Filter": {
                "Key": {
                    "FilterRules": [
                        {"Name": "prefix", "Value": "$S3_PREFIX"},
                        {"Name": "suffix", "Value": ".pdf"}
                    ]
                }
            }
        }
    ]
}
EOF
)

aws s3api put-bucket-notification-configuration \
  --bucket $S3_BUCKET_NAME \
  --notification-configuration "$NOTIFICATION_CONFIG" \
  --region $AWS_REGION

echo "--- Deployment Complete! ---"
echo "The system is now live. Upload a PDF to 's3://$S3_BUCKET_NAME/$S3_PREFIX' to trigger the OCR process."