#!/usr/bin/env python3
"""
Create Simplified DynamoDB table for Medical Documents OCR
Only stores essential attributes for LLM prompting
"""

import boto3
from botocore.exceptions import ClientError

def create_simple_medical_table():
    """Create simplified DynamoDB table for OCR text storage"""
    
    # Configuration
    TABLE_NAME = 'OCR-Text-Extraction-Table'
    REGION = 'us-east-1'  # Keep your current region
    
    print("🏗️  Creating Simplified DynamoDB Table")
    print("=" * 50)
    print(f"📋 Table Name: {TABLE_NAME}")
    print(f"🌍 Region: {REGION}")
    
    try:
        # Initialize DynamoDB client
        dynamodb = boto3.client('dynamodb', region_name=REGION)
        
        # Check if table already exists
        try:
            response = dynamodb.describe_table(TableName=TABLE_NAME)
            print(f"✅ Table {TABLE_NAME} already exists!")
            print(f"   Status: {response['Table']['TableStatus']}")
            return True
        except ClientError as e:
            if e.response['Error']['Code'] != 'ResourceNotFoundException':
                raise e
            print(f"📝 Table {TABLE_NAME} does not exist. Creating...")
        
        # Simplified table definition - only essential attributes
        table_definition = {
            'TableName': TABLE_NAME,
            'KeySchema': [
                {
                    'AttributeName': 'documentId',
                    'KeyType': 'HASH'  # Partition key
                }
            ],
            'AttributeDefinitions': [
                {
                    'AttributeName': 'documentId',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'userId',
                    'AttributeType': 'S'
                }
            ],
            'GlobalSecondaryIndexes': [
                {
                    'IndexName': 'UserIndex',
                    'KeySchema': [
                        {
                            'AttributeName': 'userId',
                            'KeyType': 'HASH'
                        }
                    ],
                    'Projection': {
                        'ProjectionType': 'ALL'
                    }
                    # Note: No ProvisionedThroughput needed for PAY_PER_REQUEST
                }
            ],
            'BillingMode': 'PAY_PER_REQUEST',  # This goes at table level, not GSI level
            'Tags': [
                {
                    'Key': 'Project',
                    'Value': 'MedicalOCR'
                }
            ]
        }
        
        print("🚀 Creating table...")
        response = dynamodb.create_table(**table_definition)
        
        print("⏳ Waiting for table to be created...")
        waiter = dynamodb.get_waiter('table_exists')
        waiter.wait(TableName=TABLE_NAME)
        
        # Get final table description
        response = dynamodb.describe_table(TableName=TABLE_NAME)
        table_info = response['Table']
        
        print("✅ Table created successfully!")
        print(f"   📋 Table Name: {table_info['TableName']}")
        print(f"   📊 Status: {table_info['TableStatus']}")
        print(f"   🔑 Primary Key: documentId")
        print(f"   📈 Billing Mode: {table_info['BillingModeSummary']['BillingMode']}")
        
        # Display GSI info
        if 'GlobalSecondaryIndexes' in table_info:
            gsi = table_info['GlobalSecondaryIndexes'][0]
            print(f"   🔍 GSI: {gsi['IndexName']} ({gsi['IndexStatus']})")
        
        print("\n📋 Simplified Schema for LLM:")
        print("   Primary Key: documentId (string)")
        print("   GSI: userId (to query user's documents)")
        print("")
        print("📝 Essential Attributes Only:")
        print("   - documentId: unique identifier")
        print("   - userId: owner of document") 
        print("   - filename: original file name")
        print("   - extractedText: OCR result (for LLM)")
        print("   - documentType: lab_result, prescription, etc.")
        print("   - confidence: OCR quality score")
        print("   - createdAt: timestamp")
        
        return True
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        
        print(f"❌ AWS Error: {error_code}")
        print(f"   Message: {error_message}")
        
        if error_code == 'AccessDeniedException':
            print("💡 Check your AWS credentials and permissions")
        elif error_code == 'ValidationException':
            print("💡 Check table schema definition")
        
        return False
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_table_operations():
    """Test basic table operations"""
    
    TABLE_NAME = 'OCR-Text-Extraction-Table'
    REGION = 'us-east-1'
    
    try:
        print(f"\n🧪 Testing table operations...")
        
        # Test with resource interface
        dynamodb = boto3.resource('dynamodb', region_name=REGION)
        table = dynamodb.Table(TABLE_NAME)
        
        # Test putting a sample item
        sample_item = {
            'documentId': 'test-doc-123',
            'userId': 'test-user',
            'filename': 'sample.pdf',
            'extractedText': 'Patient: John Doe\nDate: 2025-01-15\nGlucose: 95 mg/dL',
            'documentType': 'lab_result',
            'confidence': 0.95,
            'createdAt': '2025-01-15T10:30:00Z'
        }
        
        table.put_item(Item=sample_item)
        print("✅ Sample item inserted successfully")
        
        # Test getting the item back
        response = table.get_item(Key={'documentId': 'test-doc-123'})
        if 'Item' in response:
            item = response['Item']
            print("✅ Sample item retrieved successfully")
            print(f"   📄 Filename: {item['filename']}")
            print(f"   🏥 Type: {item['documentType']}")
            print(f"   📝 Text preview: {item['extractedText'][:50]}...")
        
        # Test querying by user
        response = table.query(
            IndexName='UserIndex',
            KeyConditionExpression='userId = :userId',
            ExpressionAttributeValues={':userId': 'test-user'}
        )
        
        print(f"✅ User query successful - found {response['Count']} documents")
        
        # Clean up test item
        table.delete_item(Key={'documentId': 'test-doc-123'})
        print("✅ Test cleanup completed")
        
        return True
        
    except Exception as e:
        print(f"❌ Table operation test failed: {e}")
        return False

def main():
    """Main function"""
    
    print("🏥 Simplified Medical Documents DynamoDB Setup")
    print("")
    
    # Check AWS credentials
    try:
        boto3.client('sts').get_caller_identity()
        print("✅ AWS credentials configured")
    except Exception as e:
        print("❌ AWS credentials not configured!")
        print("   Run: aws configure")
        exit(1)
    
    # Create table
    if create_simple_medical_table():
        # Test operations
        if test_table_operations():
            print("\n" + "=" * 60)
            print("🎉 SUCCESS - Table Ready for OCR Integration!")
            print("=" * 60)
            print("")
            print("🚀 Next Steps:")
            print("1. Update paddleocr-to-dynamodb.py with simplified schema")
            print("2. Run: python3 paddleocr-simple-dynamodb.py")
            print("3. Your OCR text will be stored for LLM prompting")
            print("")
            print("📋 Table Info:")
            print("   Name: OCR-Text-Extraction-Table")
            print("   Region: us-east-1")
            print("   Primary Key: documentId")
            print("   GSI: UserIndex (query by userId)")
        else:
            print("⚠️  Table created but operation test failed")
    else:
        print("❌ Failed to create table")

if __name__ == "__main__":
    main()