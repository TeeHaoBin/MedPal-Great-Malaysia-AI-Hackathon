'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
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

interface ChatInterfaceProps {
  activeSessionId?: string;
}

export default function ChatInterface({ activeSessionId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeSessionId) {
      setCurrentSessionId(activeSessionId);
      fetchMessages(activeSessionId);
    } else {
      // Create a new session ID if none is provided
      const newSessionId = `session_${Date.now()}`;
      setCurrentSessionId(newSessionId);
      setMessages([]);
    }
  }, [activeSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/chat-messages?sessionId=${sessionId}`);
      const data = await response.json();

      if (data.status === 'success') {
        setMessages(data.messages);
      } else {
        console.error('Failed to fetch messages:', data.error);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageText: string, sender: 'User' | 'AI' = 'User') => {
    if (!messageText.trim()) return;

    const message: ChatMessage = {
      ChatSessionId: currentSessionId,
      Timestamp: new Date().toISOString(),
      MessageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      Sender: sender,
      Message: messageText.trim(),
      Metadata: {
        UserId: 'current_user',
        Intent: 'GeneralQuery',
        IsSensitive: false
      }
    };

    try {
      const response = await fetch('/api/add-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const data = await response.json();
      if (data.status === 'success') {
        // Add message to local state immediately for better UX
        setMessages(prev => [...prev, message]);
        return true;
      } else {
        console.error('Failed to send message:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  const generateAIResponse = (userMessage: string): string => {
    const responses = [
      `This is an AI response: Thank you for your question about "${userMessage.substring(0, 30)}...". I'm here to help with medical information. Please remember to consult healthcare professionals for personalized advice.`,
      `This is an AI response: I understand you're asking about "${userMessage.substring(0, 30)}...". Based on general medical knowledge, I can provide information, but please seek professional medical advice for your specific situation.`,
      `This is an AI response: Regarding your query "${userMessage.substring(0, 30)}...", I can offer general guidance. However, it's important to discuss your specific concerns with a qualified healthcare provider.`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setInputValue('');
    setLoading(true);

    // Send user message
    const userMessageSent = await sendMessage(userMessage, 'User');

    if (userMessageSent) {
      // Generate and send AI response after a brief delay
      setTimeout(async () => {
        const aiResponse = generateAIResponse(userMessage);
        await sendMessage(aiResponse, 'AI');
        setLoading(false);
      }, 1000);
    } else {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {loading && messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start a conversation!</p>
            <p className="text-sm mt-2">Session ID: {currentSessionId.slice(-6)}</p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.MessageId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.Sender === 'User' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.Sender === 'User'
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : message.Sender === 'AI'
                      ? 'bg-green-100 text-green-900 rounded-bl-sm border border-green-200'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${
                      message.Sender === 'User' ? 'text-blue-100' :
                      message.Sender === 'AI' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {message.Sender}
                    </span>
                    {message.Metadata?.IsSensitive && (
                      <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-1 rounded">
                        PHI
                      </span>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.Message}</p>
                  <p className={`text-xs mt-1 ${
                    message.Sender === 'User' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatTimestamp(message.Timestamp)}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 text-gray-900 rounded-lg rounded-bl-sm px-4 py-2 max-w-xs">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-500">AI is typing...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about symptoms, medications, lab results..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && !loading && handleSend()}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !inputValue.trim()}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Session Info */}
        {currentSessionId && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            Session: {currentSessionId.slice(-6)} • Messages are saved to DynamoDB
          </div>
        )}
      </div>
    </div>
  );
}