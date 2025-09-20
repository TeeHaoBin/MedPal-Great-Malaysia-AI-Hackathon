import { NextRequest, NextResponse } from 'next/server';
import { invokeBedrock, BedrockMessage } from '@/lib/bedrock';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, fileContext } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({
        success: false,
        error: 'Messages array is required'
      }, { status: 400 });
    }

    // Validate message format
    const validMessages: BedrockMessage[] = messages.map(msg => ({
      role: msg.role === 'User' ? 'user' : 'assistant',
      content: msg.content || msg.Message || ''
    })).filter(msg => msg.content.trim() !== '');

    if (validMessages.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'At least one valid message is required'
      }, { status: 400 });
    }

    // Call Bedrock
    const result = await invokeBedrock(validMessages, fileContext);

    if (result.success) {
      return NextResponse.json({
        success: true,
        response: result.content
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to get response from Bedrock'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Bedrock chat API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}