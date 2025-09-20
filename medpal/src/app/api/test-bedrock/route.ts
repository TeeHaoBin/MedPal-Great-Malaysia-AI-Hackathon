import { NextResponse } from 'next/server';
import { testBedrockConnection } from '@/lib/bedrock';

export async function GET() {
  try {
    const result = await testBedrockConnection();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Bedrock connection successful',
        response: result.content
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Bedrock connection failed',
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Bedrock connection test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}