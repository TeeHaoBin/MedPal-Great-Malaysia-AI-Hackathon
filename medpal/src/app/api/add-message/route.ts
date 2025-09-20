import { addChatMessage, type ChatMessage } from '@/lib/dynamodb';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.ChatSessionId || !body.Timestamp || !body.MessageId || !body.Sender || !body.Message) {
      return NextResponse.json({
        status: 'error',
        message: 'Missing required fields: ChatSessionId, Timestamp, MessageId, Sender, Message',
        timestamp: new Date().toISOString()
      }, {
        status: 400
      });
    }

    // Validate Sender field
    if (!['Doctor', 'User', 'AI'].includes(body.Sender)) {
      return NextResponse.json({
        status: 'error',
        message: 'Sender must be one of: Doctor, User, AI',
        timestamp: new Date().toISOString()
      }, {
        status: 400
      });
    }

    const message: ChatMessage = {
      ChatSessionId: body.ChatSessionId,
      Timestamp: body.Timestamp,
      MessageId: body.MessageId,
      Sender: body.Sender,
      Message: body.Message,
      Metadata: body.Metadata || undefined
    };

    const result = await addChatMessage(message);

    return NextResponse.json({
      status: result.success ? 'success' : 'error',
      message: result.message,
      error: result.success ? null : result.error,
      timestamp: new Date().toISOString()
    }, {
      status: result.success ? 201 : 500
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to add message',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, {
      status: 500
    });
  }
}