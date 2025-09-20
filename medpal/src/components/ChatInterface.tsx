'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Upload, ScanText } from 'lucide-react';
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeSessionId) {
      setCurrentSessionId(activeSessionId);
      fetchMessages(activeSessionId);
    } else {
      // Don't auto-create session, wait for user to send first message
      setCurrentSessionId('');
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
    if (!messageText.trim() || !currentSessionId) return;

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

    // Create new session if none exists
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = `session_${Date.now()}`;
      setCurrentSessionId(sessionId);
    }

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if it's an image file
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (validTypes.includes(file.type)) {
        setSelectedFile(file);
      } else {
        alert('Please select an image file (JPEG, PNG, GIF) or PDF document.');
      }
    }
  };

  const handleOCR = async () => {
    if (!selectedFile) {
      alert('Please select a file first.');
      return;
    }

    setIsProcessingOCR(true);

    try {
      // Simulate OCR processing (replace with actual OCR service)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock OCR result
      const ocrText = `This is an AI response: I've processed your uploaded ${selectedFile.type.includes('pdf') ? 'PDF document' : 'image'}. Here's what I found:

Sample extracted text from the document. In a real implementation, this would be the actual OCR results from your document.

Please note: This is a simulated OCR result. You would integrate with an actual OCR service like AWS Textract, Google Vision API, or Tesseract.js for real text extraction.`;

      // Send OCR result as a message
      if (currentSessionId || inputValue.trim()) {
        await sendMessage(`Uploaded file: ${selectedFile.name}`, 'User');
        await sendMessage(ocrText, 'AI');
      }

      // Clear the selected file
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('OCR processing failed:', error);
      alert('OCR processing failed. Please try again.');
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (validTypes.includes(file.type)) {
        setSelectedFile(file);
      } else {
        alert('Please select an image file (JPEG, PNG, GIF) or PDF document.');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-center">
          <h1 className="text-xl font-semibold text-gray-900">
            Chat with MedPal
            {activeSessionId && (
              <span className="ml-2 text-sm text-gray-500 font-normal">
                Session: {activeSessionId.slice(-6)}
              </span>
            )}
          </h1>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {loading && messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>How can I help you today?</p>
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
                  className="group"
                >
                  <div className={`flex ${message.Sender === 'User' ? 'justify-end' : 'justify-start'} mb-6`}>
                    <div className={`flex max-w-[80%] ${message.Sender === 'User' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className={`flex-shrink-0 ${message.Sender === 'User' ? 'ml-3' : 'mr-3'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          message.Sender === 'User'
                            ? 'bg-blue-500 text-white'
                            : 'bg-green-500 text-white'
                        }`}>
                          {message.Sender === 'User' ? 'U' : 'AI'}
                        </div>
                      </div>

                      {/* Message Content */}
                      <div className="flex-1">
                        <div className={`px-4 py-3 rounded-2xl ${
                          message.Sender === 'User'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.Message}</p>
                          {message.Metadata?.IsSensitive && (
                            <span className="inline-block mt-2 text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded">
                              PHI
                            </span>
                          )}
                        </div>
                        <div className={`text-xs text-gray-500 mt-1 ${
                          message.Sender === 'User' ? 'text-right' : 'text-left'
                        }`}>
                          {formatTimestamp(message.Timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group mb-6"
            >
              <div className="flex justify-start">
                <div className="flex max-w-[80%]">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-medium">
                      AI
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 text-gray-900 rounded-2xl px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {/* File Upload Section */}
          {selectedFile && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800 font-medium">{selectedFile.name}</span>
                  <span className="text-xs text-blue-600">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleOCR}
                    disabled={isProcessingOCR}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                  >
                    <ScanText className="w-3 h-3" />
                    <span>{isProcessingOCR ? 'Processing...' : 'Extract Text'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-blue-600 hover:text-blue-800 p-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chat Input */}
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,.pdf"
              className="hidden"
            />
            <div className="flex items-end space-x-2 bg-gray-50 rounded-2xl border border-gray-200 p-2">
              <button
                onClick={triggerFileInput}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  isDragOver
                    ? 'bg-blue-100 text-blue-600 border-2 border-blue-300 border-dashed scale-110'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                }`}
                title="Upload document or image (drag & drop supported)"
              >
                <Upload className={`w-4 h-4 ${isDragOver ? 'animate-bounce' : ''}`} />
              </button>
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Message MedPal..."
                className="flex-1 px-3 py-2 bg-transparent border-0 resize-none focus:outline-none text-sm min-h-[40px] max-h-32"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !loading && !isProcessingOCR) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={loading || isProcessingOCR}
                rows={1}
                style={{
                  height: 'auto',
                  minHeight: '40px'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                }}
              />
              <button
                onClick={handleSend}
                disabled={loading || isProcessingOCR || !inputValue.trim()}
                className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Session Info */}
          {currentSessionId && (
            <div className="mt-2 text-xs text-gray-400 text-center">
              Session: {currentSessionId.slice(-6)}
              {selectedFile && <span> • File ready for OCR processing</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}