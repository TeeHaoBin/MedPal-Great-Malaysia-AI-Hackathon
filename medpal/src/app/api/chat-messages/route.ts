import { getChatHistory } from '@/lib/dynamodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({
        status: 'error',
        messages: [],
        error: 'Session ID is required',
        timestamp: new Date().toISOString()
      }, {
        status: 400
      });
    }

    const result = await getChatHistory(sessionId);

    return NextResponse.json({
      status: result.success ? 'success' : 'error',
      messages: result.messages,
      error: result.success ? null : result.message,
      timestamp: new Date().toISOString()
    }, {
      status: result.success ? 200 : 500
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      messages: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, {
      status: 500
    });
  }
}