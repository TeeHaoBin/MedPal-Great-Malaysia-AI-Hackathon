import { deleteChatSession } from '@/lib/dynamodb';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({
        status: 'error',
        message: 'Session ID is required',
        timestamp: new Date().toISOString()
      }, {
        status: 400
      });
    }

    const result = await deleteChatSession(sessionId);

    return NextResponse.json({
      status: result.success ? 'success' : 'error',
      message: result.message,
      error: result.success ? null : result.error,
      timestamp: new Date().toISOString()
    }, {
      status: result.success ? 200 : 500
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to delete session',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, {
      status: 500
    });
  }
}