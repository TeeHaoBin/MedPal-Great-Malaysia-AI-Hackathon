import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET_NAME } from '@/lib/s3';
import { processDocument } from '@/lib/documentProcessor';
import { saveOCRResult, dynamoDb } from '@/lib/dynamodb';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file type. Only PDF, JPG, PNG, and GIF files are allowed.'
      }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: 'File size too large. Maximum size is 10MB.'
      }, { status: 400 });
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const key = `medpal-uploads/${uniqueFileName}`;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'medpal-user',
      },
    });

    await s3Client.send(command);

    // Construct file URL
    const fileUrl = `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;



    // Process document for text extraction (if applicable)
    const documentResult = await processDocument(fileUrl, file.name);

    // Save OCR result to DynamoDB (OCR-Text-Extraction-Table-Test)
    let ocrItemId = uuidv4();
    if (documentResult.success && documentResult.extractedText) {
      await saveOCRResult({
        id: ocrItemId,
        fileName: file.name,
        fileUrl: fileUrl,
        extractedText: documentResult.extractedText,
        uploadedAt: new Date().toISOString(),
        s3Key: key,
        documentType: documentResult.documentType,
      });
    }

    // Fetch the latest item from OCR-Text-Extraction-Table-Test
    let latestOCRItem = null;
    try {
      const scanResult = await dynamoDb.send(new ScanCommand({
        TableName: 'OCR-Text-Extraction-Table-Test',
        Limit: 1,
        // Optionally, you can add a filter for fileName or s3Key if you want to be more specific
      }));
      if (scanResult.Items && scanResult.Items.length > 0) {
        latestOCRItem = scanResult.Items[0];
      }
    } catch (err) {
      console.error('Failed to fetch latest OCR item:', err);
    }

    // Return success response with documentProcessing from latest OCR table item
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      fileType: file.type,
      fileUrl: fileUrl,
      s3Key: key,
      documentProcessing: latestOCRItem
        ? { success: true, extractedText: latestOCRItem.extractedText, documentType: latestOCRItem.documentType }
        : { success: false, error: 'No OCR result found' },
    });
  } catch (error) {
    console.error('S3 upload error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to upload file to S3. Please try again.'
    }, { status: 500 });
  }
}