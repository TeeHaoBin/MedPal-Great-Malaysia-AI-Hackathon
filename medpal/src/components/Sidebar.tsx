'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Calendar, User, Shield, ChevronRight, Plus, Trash2 } from 'lucide-react';

interface ChatSession {
  sessionId: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
  hasSensitiveData: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onSessionSelect: (sessionId: string) => void;
  activeSessionId?: string;
  onSessionDeleted?: () => void;
}

export default function Sidebar({ isOpen, onToggle, onSessionSelect, activeSessionId, onSessionDeleted }: SidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chat-sessions');
      const data = await response.json();

      if (data.status === 'success') {
        setSessions(data.sessions);
      } else {
        console.error('Failed to fetch sessions:', data.error);
        setSessions([]);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const createRealChatConversation = async () => {
    const sessionId = `session_${Date.now()}`;
    const baseTimestamp = new Date();

    // Sample medical conversations
    const conversations = [
      {
        user: "What are the symptoms of dengue fever?",
        ai: "This is an AI response: Dengue fever symptoms include high fever (40°C/104°F), severe headache, muscle and joint pains, skin rash, and nausea. In severe cases, it can cause dengue hemorrhagic fever with bleeding and plasma leakage. Please consult a healthcare provider for proper diagnosis.",
        intent: "SymptomQuery",
        sensitive: true
      },
      {
        user: "Can you help me understand my blood pressure readings?",
        ai: "This is an AI response: Blood pressure readings show systolic (top number) and diastolic (bottom number) pressure. Normal is typically below 120/80 mmHg. High blood pressure (hypertension) is 130/80 mmHg or higher. However, always consult your doctor for personalized interpretation of your specific readings.",
        intent: "LabResultsQuery",
        sensitive: true
      },
      {
        user: "What should I know about diabetes management?",
        ai: "This is an AI response: Diabetes management involves regular blood sugar monitoring, healthy diet with controlled carbohydrates, regular exercise, medication adherence, and routine medical check-ups. Key targets include HbA1c below 7% for most adults. Always work with your healthcare team for personalized management plans.",
        intent: "TreatmentGuidance",
        sensitive: false
      }
    ];

    const conversation = conversations[Math.floor(Math.random() * conversations.length)];

    try {
      // Add user message
      const userMessage = {
        ChatSessionId: sessionId,
        Timestamp: new Date(baseTimestamp.getTime()).toISOString(),
        MessageId: `msg_${Date.now()}_user`,
        Sender: 'User',
        Message: conversation.user,
        Metadata: {
          UserId: 'user_sample',
          Intent: conversation.intent,
          IsSensitive: conversation.sensitive
        }
      };

      await fetch('/api/add-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userMessage),
      });

      // Add AI response 2 seconds later
      const aiMessage = {
        ChatSessionId: sessionId,
        Timestamp: new Date(baseTimestamp.getTime() + 2000).toISOString(),
        MessageId: `msg_${Date.now()}_ai`,
        Sender: 'AI',
        Message: conversation.ai,
        Metadata: {
          UserId: 'user_sample',
          Intent: conversation.intent,
          IsSensitive: conversation.sensitive
        }
      };

      const aiResponse = await fetch('/api/add-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiMessage),
      });

      if (aiResponse.ok) {
        await fetchSessions(); // Refresh sessions
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const deleteSession = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent session selection when clicking delete

    if (!confirm('Are you sure you want to delete this chat session? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/delete-session?sessionId=${sessionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.status === 'success') {
        await fetchSessions(); // Refresh sessions
        // If the deleted session was active, clear it
        if (activeSessionId === sessionId && onSessionDeleted) {
          onSessionDeleted();
        }
      } else {
        console.error('Failed to delete session:', data.error);
        alert('Failed to delete session. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Error deleting session. Please try again.');
    }
  };
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white shadow-lg border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 md:static md:z-auto w-80`}>

        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <MessageSquare className="w-6 h-6 mr-2" />
              Chat Sessions
            </h2>
            <button
              onClick={onToggle}
              className="md:hidden p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Loading sessions...
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No chat sessions yet</p>
                <button
                  onClick={createRealChatConversation}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  Create sample conversation
                </button>
              </div>
            ) : (
              sessions.map((session) => (
              <div
                key={session.sessionId}
                onClick={() => onSessionSelect(session.sessionId)}
                className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors group ${
                  activeSessionId === session.sessionId
                    ? 'bg-blue-50 border-blue-200 border'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                {/* Session Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-500">
                      {session.sessionId.slice(-6)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {session.hasSensitiveData && (
                      <Shield className="w-4 h-4 text-amber-500" title="Contains sensitive PHI" />
                    )}
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <button
                      onClick={(e) => deleteSession(session.sessionId, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                      title="Delete session"
                    >
                      <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
                    </button>
                  </div>
                </div>

                {/* Last Message */}
                <div className="mb-2">
                  <p className="text-sm text-gray-900 line-clamp-2">
                    {session.lastMessage}
                  </p>
                </div>

                {/* Session Info */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      {session.messageCount}
                    </span>
                    <span>{formatTimestamp(session.timestamp)}</span>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={createRealChatConversation}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Chat Session
          </button>
        </div>
      </div>
    </>
  );
}