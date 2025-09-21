# 🔑 Google Cloud Vision API Setup Guide

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "medpal-ocr-vision")
4. Click "Create"

## Step 2: Enable Vision API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Vision API"
3. Click on "Cloud Vision API"
4. Click "Enable"

## Step 3: Create Service Account

1. Go to "IAM & Admin" → "Service Accounts"
2. Click "Create Service Account"
3. Enter details:
   - **Name**: `medpal-vision-ocr`
   - **Description**: `Service account for MedPal OCR processing`
4. Click "Create and Continue"

## Step 4: Assign Permissions

1. In "Grant this service account access to project":
   - Add role: **Cloud Vision API User**
   - Add role: **Service Account User** (optional, for better security)
2. Click "Continue" → "Done"

## Step 5: Create and Download Key

1. Find your service account in the list
2. Click on the service account name
3. Go to "Keys" tab
4. Click "Add Key" → "Create new key"
5. Select "JSON" format
6. Click "Create"
7. Save the downloaded JSON file securely

## Step 6: Convert to Base64

```bash
# On macOS/Linux:
base64 -i your-service-account-key.json

# On Windows (PowerShell):
[Convert]::ToBase64String([IO.File]::ReadAllBytes("your-service-account-key.json"))
```

Copy the base64 output - you'll need this for the Lambda deployment.

## Step 7: Test Your Setup (Optional)

```bash
# Install Google Cloud CLI
# https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth activate-service-account --key-file=your-service-account-key.json

# Test Vision API
gcloud ml vision detect-text gs://cloud-samples-data/vision/ocr/sign.jpg
```

## 🔒 Security Best Practices

1. **Never commit the JSON key to version control**
2. **Use environment variables for the base64 credentials**
3. **Rotate keys regularly** (every 90 days recommended)
4. **Apply principle of least privilege** - only Vision API access needed
5. **Monitor usage** in Google Cloud Console

## 💰 Pricing Information

### Google Cloud Vision API:
- **Free Tier**: 1,000 text detection units per month
- **Paid Tier**: $1.50 per 1,000 units after free tier
- **1 unit = 1 image/page processed**

### Cost Examples:
- 100 medical PDFs (avg 5 pages each) = 500 units = **FREE**
- 1,000 medical PDFs (avg 5 pages each) = 5,000 units = **$6/month**
- Very cost-effective for medical document processing!

## 🌏 Regional Considerations

For **Malaysia (ap-southeast-1)** deployment:
- Vision API is available globally
- No regional restrictions
- Low latency from Southeast Asia
- Complies with data residency if needed

Your Google Cloud Vision setup is complete! 🚀