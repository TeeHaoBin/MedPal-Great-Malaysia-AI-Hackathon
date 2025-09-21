// Save OCR result to a specific DynamoDB table
export interface OCRResultItem {
  id: string; // unique id for the record
  fileName: string;
  fileUrl: string;
  extractedText: string;
  uploadedAt: string;
  [key: string]: any;
}

export const saveOCRResult = async (item: OCRResultItem) => {
  try {
    const command = new PutCommand({
      TableName: 'OCR-Text-Extraction-Table-Test',
      Item: item,
    });
    await dynamoDb.send(command);
    return { success: true, message: 'OCR result saved successfully' };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to save OCR result',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION!,
});

export const dynamoDb = DynamoDBDocumentClient.from(client);

export interface ChatMessage {
  ChatSessionId: string;
  Timestamp: string;
  MessageId: string;
  Sender: 'Doctor' | 'User' | 'AI';
  Message: string;
  Metadata?: {
    UserId?: string;
    Intent?: string;
    IsSensitive?: boolean;
  };
}

export interface ChatSession {
  sessionId: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
  hasSensitiveData: boolean;
}

export const testConnection = async () => {
  try {
    const command = new ScanCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      Limit: 1,
    });

    await dynamoDb.send(command);
    return { success: true, message: 'DynamoDB connection successful' };
  } catch (error) {
    return {
      success: false,
      message: 'DynamoDB connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const addChatMessage = async (message: ChatMessage) => {
  try {
    const command = new PutCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      Item: message,
    });

    await dynamoDb.send(command);
    return { success: true, message: 'Message added successfully' };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to add message',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const getChatSessions = async () => {
  try {
    const command = new ScanCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
    });

    const result = await dynamoDb.send(command);
    const messages = result.Items as ChatMessage[] || [];

    const sessionsMap = new Map<string, ChatSession>();

    messages.forEach((message) => {
      const sessionId = message.ChatSessionId;
      const existing = sessionsMap.get(sessionId);

      if (!existing || new Date(message.Timestamp) > new Date(existing.timestamp)) {
        sessionsMap.set(sessionId, {
          sessionId,
          lastMessage: message.Message,
          timestamp: message.Timestamp,
          messageCount: existing ? existing.messageCount + 1 : 1,
          hasSensitiveData: message.Metadata?.IsSensitive || (existing?.hasSensitiveData || false),
        });
      } else {
        existing.messageCount++;
        if (message.Metadata?.IsSensitive) {
          existing.hasSensitiveData = true;
        }
      }
    });

    const sessions = Array.from(sessionsMap.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return { success: true, sessions };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to get chat sessions',
      error: error instanceof Error ? error.message : 'Unknown error',
      sessions: []
    };
  }
};

export const getChatHistory = async (sessionId: string) => {
  try {
    const command = new QueryCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      KeyConditionExpression: 'ChatSessionId = :sessionId',
      ExpressionAttributeValues: {
        ':sessionId': sessionId,
      },
      ScanIndexForward: true, // Sort by timestamp ascending
    });

    const result = await dynamoDb.send(command);
    const messages = result.Items as ChatMessage[] || [];

    return { success: true, messages };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to get chat history',
      error: error instanceof Error ? error.message : 'Unknown error',
      messages: []
    };
  }
};

export const deleteChatSession = async (sessionId: string) => {
  try {
    // First, get all messages for this session
    const historyResult = await getChatHistory(sessionId);

    if (!historyResult.success) {
      return {
        success: false,
        message: 'Failed to retrieve session messages for deletion',
        error: historyResult.error
      };
    }

    // Delete each message in the session
    const deletePromises = historyResult.messages.map(async (message) => {
      const deleteCommand = new DeleteCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: {
          ChatSessionId: message.ChatSessionId,
          Timestamp: message.Timestamp,
        },
      });

      return dynamoDb.send(deleteCommand);
    });

    await Promise.all(deletePromises);

    return {
      success: true,
      message: `Successfully deleted ${historyResult.messages.length} messages from session ${sessionId}`
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to delete chat session',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};