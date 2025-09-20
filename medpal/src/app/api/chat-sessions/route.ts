import { getChatSessions } from '@/lib/dynamodb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await getChatSessions();

    return NextResponse.json({
      status: result.success ? 'success' : 'error',
      sessions: result.sessions,
      error: result.success ? null : result.message,
      timestamp: new Date().toISOString()
    }, {
      status: result.success ? 200 : 500
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      sessions: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, {
      status: 500
    });
  }
}