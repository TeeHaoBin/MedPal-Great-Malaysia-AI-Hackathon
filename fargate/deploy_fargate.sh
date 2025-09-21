#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# --- Configuration ---
AWS_ACCOUNT_ID=""
AWS_REGION="" # e.g., us-east-1

# --- Resource Naming ---
ECR_REPOSITORY_NAME="fargate-ocr-processor"
ECS_CLUSTER_NAME="ocr-cluster"
ECS_TASK_DEFINITION_NAME="ocr-task-def"
ECS_TASK_ROLE_NAME="ECSTaskRoleForOCR"
ECS_EXECUTION_ROLE_NAME="ECSTaskExecutionRoleForOCR"
EVENTBRIDGE_RULE_NAME="S3-PDF-Upload-Trigger-OCR"
EVENTBRIDGE_TARGET_ID="Fargate-OCR-Task-Target"

# --- Source/Destination Config ---
S3_BUCKET_NAME="testing-pdf-files-medpal"
S3_PREFIX="medpal-uploads/"
DYNAMODB_TABLE_NAME="OCR-Text-Extraction-Table"

# --- Task Configuration ---
TASK_CPU="1024"  # 1 vCPU
TASK_MEMORY="3072" # 3 GB

# --- Script ---

# 1. Get User Input
if [ -z "$AWS_ACCOUNT_ID" ]; then
  read -p "Enter your AWS Account ID: " AWS_ACCOUNT_ID
fi
if [ -z "$AWS_REGION" ]; then
  read -p "Enter your AWS Region: " AWS_REGION
fi

IMAGE_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_NAME:latest"

echo "--- Starting Fargate Deployment ---"

# 2. ECR Login, Repo, Build, Push (Same as before)
echo "--> Step 2: Logging in, Building, and Pushing container image..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
if ! aws ecr describe-repositories --repository-names $ECR_REPOSITORY_NAME --region $AWS_REGION > /dev/null 2>&1; then
  aws ecr create-repository --repository-name $ECR_REPOSITORY_NAME --region $AWS_REGION > /dev/null
fi
docker build -t $ECR_REPOSITORY_NAME .
docker tag $ECR_REPOSITORY_NAME:latest $IMAGE_URI
docker push $IMAGE_URI
echo "<-- Step 2 Complete."

# 3. IAM Roles
echo "--> Step 3: Setting up IAM Roles..."
# Role for the ECS agent to make AWS API calls on your behalf (pulling images, etc.)
if ! aws iam get-role --role-name $ECS_EXECUTION_ROLE_NAME > /dev/null 2>&1; then
    echo "Creating ECS Task Execution Role..."
    aws iam create-role --role-name $ECS_EXECUTION_ROLE_NAME --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "ecs-tasks.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }' > /dev/null
    aws iam attach-role-policy --role-name $ECS_EXECUTION_ROLE_NAME --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy > /dev/null
else
    echo "ECS Task Execution Role already exists."
fi

# Role for our application code inside the container to access S3 and DynamoDB
if ! aws iam get-role --role-name $ECS_TASK_ROLE_NAME > /dev/null 2>&1; then
    echo "Creating ECS Task Role..."
    TASK_POLICY_DOCUMENT=$(cat <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {"Effect": "Allow", "Action": "s3:GetObject", "Resource": "arn:aws:s3:::$S3_BUCKET_NAME/*"},
        {"Effect": "Allow", "Action": "dynamodb:PutItem", "Resource": "arn:aws:dynamodb:$AWS_REGION:$AWS_ACCOUNT_ID:table/$DYNAMODB_TABLE_NAME"}
    ]
}
EOF
)
    aws iam create-role --role-name $ECS_TASK_ROLE_NAME --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "ecs-tasks.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }' > /dev/null
    aws iam put-role-policy --role-name $ECS_TASK_ROLE_NAME --policy-name "S3-Dynamo-Access-For-OCR" --policy-document "$TASK_POLICY_DOCUMENT" > /dev/null
else
    echo "ECS Task Role already exists."
fi

EXECUTION_ROLE_ARN=$(aws iam get-role --role-name $ECS_EXECUTION_ROLE_NAME --query Role.Arn --output text)
TASK_ROLE_ARN=$(aws iam get-role --role-name $ECS_TASK_ROLE_NAME --query Role.Arn --output text)
echo "<-- Step 3 Complete."

# 4. ECS Cluster
echo "--> Step 4: Setting up ECS Cluster..."
if ! aws ecs describe-clusters --clusters $ECS_CLUSTER_NAME > /dev/null 2>&1; then
    aws ecs create-cluster --cluster-name $ECS_CLUSTER_NAME > /dev/null
else
    echo "ECS Cluster '$ECS_CLUSTER_NAME' already exists."
fi
echo "<-- Step 4 Complete."

# 5. ECS Task Definition
echo "--> Step 5: Registering ECS Task Definition..."
TASK_DEFINITION_JSON=$(cat <<EOF
{
    "family": "$ECS_TASK_DEFINITION_NAME",
    "executionRoleArn": "$EXECUTION_ROLE_ARN",
    "taskRoleArn": "$TASK_ROLE_ARN",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "$TASK_CPU",
    "memory": "$TASK_MEMORY",
    "containerDefinitions": [{
        "name": "ocr-container",
        "image": "$IMAGE_URI",
        "essential": true,
        "environment": [
            {"name": "DYNAMODB_TABLE", "value": "$DYNAMODB_TABLE_NAME"}
        ],
        "logConfiguration": {
            "logDriver": "awslogs",
            "options": {
                "awslogs-group": "/ecs/$ECS_TASK_DEFINITION_NAME",
                "awslogs-region": "$AWS_REGION",
                "awslogs-stream-prefix": "ecs"
            }
        }
    }]
}
EOF
)
TASK_DEF_ARN=$(aws ecs register-task-definition --cli-input-json "$TASK_DEFINITION_JSON" --query taskDefinition.taskDefinitionArn --output text)
echo "Task Definition ARN: $TASK_DEF_ARN"
echo "<-- Step 5 Complete."

# 6. Networking: Discover Default VPC and Public Subnets
echo "--> Step 6: Discovering default network configuration..."
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text)
if [ -z "$VPC_ID" ] || [ "$VPC_ID" == "None" ]; then
    echo "FATAL: Could not find default VPC in region $AWS_REGION. Please create one or configure the script manually."
    exit 1
fi

# Find subnets that auto-assign public IPs, which are typically the public subnets.
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" "Name=map-public-ip-on-launch,Values=true" --query "Subnets[*].SubnetId" --output text | tr '\t' ',')

if [ -z "$SUBNET_IDS" ]; then
    echo "WARNING: Could not find any public subnets (ones that auto-assign public IPs) in the default VPC."
    echo "Attempting to use all subnets. This may fail if the task is placed in a private subnet without a NAT Gateway."
    SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[*].SubnetId" --output text | tr '\t' ',')
fi

if [ -z "$SUBNET_IDS" ]; then
    echo "FATAL: Could not find any subnets in the default VPC. Please create them."
    exit 1
fi
echo "Using VPC: $VPC_ID and Subnets: $SUBNET_IDS"
echo "<-- Step 6 Complete."

# 7. Create Security Group
echo "--> Step 7: Creating Security Group..."
ECS_SECURITY_GROUP_NAME="FargateOCRSecurityGroup"
# Check if security group already exists
SG_ID=$(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID" "Name=group-name,Values=$ECS_SECURITY_GROUP_NAME" --query "SecurityGroups[0].GroupId" --output text 2>/dev/null)

if [ "$SG_ID" == "None" ] || [ -z "$SG_ID" ]; then
    echo "Creating Security Group '$ECS_SECURITY_GROUP_NAME'..."
    SG_ID=$(aws ec2 create-security-group --group-name "$ECS_SECURITY_GROUP_NAME" --description "Security group for Fargate OCR task" --vpc-id "$VPC_ID" --query "GroupId" --output text)
    # Default outbound rule (Allow All) is sufficient. No inbound rules needed.
    echo "Created Security Group with ID: $SG_ID"
else
    echo "Security Group '$ECS_SECURITY_GROUP_NAME' already exists with ID: $SG_ID"
fi
echo "<-- Step 7 Complete."

# 8. EventBridge Rule and Target
echo "--> Step 8: Setting up EventBridge rule and target..."
RULE_ARN=$(aws events put-rule --name "$EVENTBRIDGE_RULE_NAME" --event-pattern "{\"source\":[\"aws.s3\"],\"detail-type\":[\"Object Created\"],\"detail\":{\"bucket\":{\"name\":[\"$S3_BUCKET_NAME\"]},\"object\":{\"key\":[{\"prefix\":\"$S3_PREFIX\"}]}}}" --query RuleArn --output text)

echo "Creating EventBridge target..."
# Using a heredoc for the targets JSON to improve readability and avoid escaping issues.
TARGETS_JSON=$(cat <<EOF
[{
    "Id": "$EVENTBRIDGE_TARGET_ID",
    "Arn": "arn:aws:ecs:$AWS_REGION:$AWS_ACCOUNT_ID:cluster/$ECS_CLUSTER_NAME",
    "RoleArn": "$TASK_ROLE_ARN",
    "EcsParameters": {
        "TaskDefinitionArn": "$TASK_DEF_ARN",
        "TaskCount": 1,
        "LaunchType": "FARGATE",
        "NetworkConfiguration": {
            "awsvpcConfiguration": {
                "Subnets": ["${SUBNET_IDS//,/","}"],
                "SecurityGroups": ["$SG_ID"],
                "AssignPublicIp": "ENABLED"
            }
        }
    },
    "InputTransformer": {
        "InputPathsMap": {
            "s3_bucket": "$.detail.bucket.name",
            "s3_key": "$.detail.object.key"
        },
        "InputTemplate": "{\"containerOverrides\":[{\"name\":\"ocr-container\",\"environment\":[{\"name\":\"S3_BUCKET\",\"value\":<s3_bucket>},{\"name\":\"S3_KEY\",\"value\":<s3_key>}]}]}"
    }
}]
EOF
)

aws events put-targets --rule "$EVENTBRIDGE_RULE_NAME" --targets "$TARGETS_JSON"
echo "<-- Step 8 Complete."

echo "--- Fargate Deployment Complete! ---"
echo "The system is now live. Upload a PDF to 's3://$S3_BUCKET_NAME/$S3_PREFIX' to trigger the Fargate task."