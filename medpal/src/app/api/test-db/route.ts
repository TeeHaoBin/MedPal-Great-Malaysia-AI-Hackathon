import { testConnection } from '@/lib/dynamodb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await testConnection();

    return NextResponse.json({
      status: result.success ? 'success' : 'error',
      message: result.message,
      error: result.error || null,
      timestamp: new Date().toISOString(),
      config: {
        region: process.env.AWS_REGION,
        tableName: process.env.DYNAMODB_TABLE_NAME,
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      }
    }, {
      status: result.success ? 200 : 500
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to test DynamoDB connection',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, {
      status: 500
    });
  }
}