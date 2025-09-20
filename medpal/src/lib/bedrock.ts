import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.BEDROCK_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  ...(process.env.BEDROCK_API_KEY && {
    apiKey: process.env.BEDROCK_API_KEY
  })
});

export interface BedrockMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface BedrockResponse {
  success: boolean;
  content?: string;
  error?: string;
}

export const invokeBedrock = async (
  messages: BedrockMessage[],
  includeFileContext?: string
): Promise<BedrockResponse> => {
  try {
    const modelId = process.env.BEDROCK_MODEL_ID || 'deepseek-r1:240b-chat';

    // Build the prompt with medical expertise context
    let systemPrompt = `You are MedPal, an AI medical assistant with deep expertise in healthcare, medicine, and medical literature. Your role is to:

1. Provide accurate, evidence-based medical information
2. Help interpret medical documents and reports
3. Assist with medical queries while emphasizing the importance of professional medical consultation
4. Maintain patient privacy and confidentiality
5. Use clear, accessible language while maintaining medical accuracy

**Formatting Guidelines:**
- Use **bold text** for important medical terms, conditions, and key points
- Use *italics* for emphasis and medical terminology definitions
- Use bullet points (- or *) for lists of symptoms, treatments, or recommendations
- Use numbered lists (1., 2., 3.) for step-by-step instructions or prioritized information
- Use > blockquotes for important warnings or critical medical advice
- Structure your responses with clear headings using ## or ###
- Use `inline code` for specific measurements, dosages, or technical terms

**Content Guidelines:**
- Always recommend consulting healthcare professionals for specific medical advice
- Be thorough but concise in your responses
- If analyzing medical documents, provide structured summaries with clear headings
- Highlight any concerning findings that warrant immediate medical attention
- Maintain empathy and professionalism in all interactions
- Use markdown formatting to make medical information more readable and organized`;

    if (includeFileContext) {
      systemPrompt += `\n\nYou are also analyzing an uploaded medical document or image. Here is the context from the file:\n\n${includeFileContext}`;
    }

    // Prepare the conversation history
    const conversationHistory = messages.map(msg =>
      `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
    ).join('\n\n');

    const fullPrompt = `${systemPrompt}\n\nConversation:\n${conversationHistory}\n\nAssistant:`;

    // Detect model type and prepare appropriate request
    const isDeepseekR1 = modelId.includes('deepseek');

    let requestBody;
    if (isDeepseekR1) {
      // Deepseek R1 format
      requestBody = {
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          ...messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        ],
        max_tokens: 2048,
        temperature: 0.7,
        top_p: 0.9
      };
    } else {
      // Claude 3 format
      requestBody = {
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        system: systemPrompt,
        max_tokens: 2048,
        temperature: 0.7,
        top_p: 0.9,
        anthropic_version: "bedrock-2023-05-31"
      };
    }

    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody),
    });

    const response = await bedrockClient.send(command);

    if (!response.body) {
      throw new Error('No response body from Bedrock');
    }

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    // Handle response format based on model type
    let content = '';
    if (isDeepseekR1) {
      // Deepseek R1 response format
      if (responseBody.choices && responseBody.choices[0]) {
        content = responseBody.choices[0].message?.content || responseBody.choices[0].text || '';
      } else if (responseBody.content && responseBody.content[0]) {
        content = responseBody.content[0].text || '';
      } else if (responseBody.completion) {
        content = responseBody.completion;
      } else {
        throw new Error('Unexpected Deepseek R1 response format from Bedrock');
      }
    } else {
      // Claude 3 response format
      if (responseBody.content && responseBody.content[0]) {
        content = responseBody.content[0].text || '';
      } else if (responseBody.completion) {
        content = responseBody.completion;
      } else {
        throw new Error('Unexpected Claude response format from Bedrock');
      }
    }

    return {
      success: true,
      content: content.trim(),
    };
  } catch (error) {
    console.error('Bedrock invocation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

export const testBedrockConnection = async (): Promise<BedrockResponse> => {
  try {
    const testMessages: BedrockMessage[] = [
      {
        role: 'user',
        content: 'Hello, can you confirm you are working as MedPal, the medical AI assistant?'
      }
    ];

    return await invokeBedrock(testMessages);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
    };
  }
};