# 🔑 Step-by-Step: Getting the JSON Service Account File

## ⚠️ Important: You Need a Service Account JSON File, NOT an API Key

The short string API key you found is for simple REST API calls. For Lambda, we need a **Service Account with JSON credentials**.

## 📋 Detailed Steps to Get the JSON File

### Step 1: Go to the Right Place
1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. **Important**: Go to **"IAM & Admin"** → **"Service Accounts"**
   - ❌ **NOT** "APIs & Services" → "Credentials" (that's where you found the API key)
   - ✅ **YES** "IAM & Admin" → "Service Accounts"

### Step 2: Create Service Account
1. Click **"+ CREATE SERVICE ACCOUNT"** button (top of page)
2. Fill in details:
   ```
   Service account name: medpal-vision-ocr
   Service account ID: medpal-vision-ocr (auto-filled)
   Description: Service account for MedPal OCR processing
   ```
3. Click **"CREATE AND CONTINUE"**

### Step 3: Grant Permissions
1. In "Grant this service account access to project" section:
2. Click **"Select a role"** dropdown
3. Search for and select: **"Cloud Vision AI Service Agent"**
4. Click **"+ ADD ANOTHER ROLE"**
5. Add: **"Storage Object Viewer"** (if you plan to read from GCS)
6. Click **"CONTINUE"** → **"DONE"**

### Step 4: Download JSON Key File
1. You'll see your service account in the list
2. Click on the **service account email** (e.g., `medpal-vision-ocr@your-project.iam.gserviceaccount.com`)
3. Go to the **"KEYS"** tab
4. Click **"ADD KEY"** → **"Create new key"**
5. Select **"JSON"** format (not P12!)
6. Click **"CREATE"**
7. A JSON file will download automatically (e.g., `your-project-a1b2c3d4e5f6.json`)

### Step 5: Verify Your JSON File
Your downloaded file should look like this:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id-here",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "medpal-vision-ocr@your-project.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/medpal-vision-ocr%40your-project.iam.gserviceaccount.com"
}
```

## 🔧 Convert to Base64 for Lambda

Once you have the JSON file:

### On macOS/Linux:
```bash
base64 -i your-project-a1b2c3d4e5f6.json
```

### On Windows PowerShell:
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("your-project-a1b2c3d4e5f6.json"))
```

### Expected Output:
You should get a long base64 string like:
```
ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAieW91ci1wcm9qZWN0LWlkIiwKICAicHJpdmF0ZV9rZXlfaWQiOiAia2V5LWlkLWhlcmUiLAogICJwcml2YXRlX2tleSI6ICItLS0tLUJFR0lOIFBSSVZBVEUgS0VZLS0tLS1cbk1JSUVSd0lCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktvd2dnU21BZ0VBQW9JQkFRQy4uLlxuLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLVxuIiwKICAiY2xpZW50X2VtYWlsIjogIm1lZHBhbC12aXNpb24tb2NyQHlvdXItcHJvamVjdC5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgImNsaWVudF9pZCI6ICIxMjM0NTY3ODkwMTIzNDU2Nzg5MDEiLAogICJhdXRoX3VyaSI6ICJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20vby9vYXV0aDIvYXV0aCIsCiAgInRva2VuX3VyaSI6ICJodHRwczovL29hdXRoMi5nb29nbGVhcGlzLmNvbS90b2tlbiIsCiAgImF1dGhfcHJvdmlkZXJfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9vYXV0aDIvdjEvY2VydHMiLAogICJjbGllbnRfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9yb2JvdC92MS9tZXRhZGF0YS94NTA5L21lZHBhbC12aXNpb24tb2NyJTQweW91ci1wcm9qZWN0LmlhbS5nc2VydmljZWFjY291bnQuY29tIgp9
```

## ✅ Troubleshooting

### If you only see API keys:
You're in the wrong section. API keys are in "APIs & Services" → "Credentials". You need to go to "IAM & Admin" → "Service Accounts".

### If "Create Service Account" is grayed out:
You need "Service Account Admin" or "Project IAM Admin" permissions on the project.

### If Vision API is not enabled:
1. Go to "APIs & Services" → "Library"
2. Search "Cloud Vision API"
3. Click "Enable"

## 🎯 What's Next?

Once you have the base64 string:
1. Test locally with `test-local.py` (optional)
2. Run `./deploy.sh` and paste the base64 string when prompted
3. Upload a PDF to test: `aws s3 cp test.pdf s3://testing-pdf-files-medpal/medpal-uploads/`

The key difference: **Service Account JSON file** (what we need) vs **API Key string** (what you found).