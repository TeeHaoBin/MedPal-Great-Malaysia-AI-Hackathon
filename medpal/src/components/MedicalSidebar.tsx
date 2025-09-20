'use client';
import React, { useState, useEffect } from 'react';
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from './ui/sidebar';
import {
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
  IconPlus,
  IconTrash,
  IconMessageCircle,
  IconShield,
  IconHistory,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ChatSession {
  sessionId: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
  hasSensitiveData: boolean;
}

interface MedicalSidebarProps {
  onSessionSelect: (sessionId: string) => void;
  activeSessionId?: string;
  onSessionDeleted?: () => void;
}

function SidebarContent({
  onSessionSelect,
  activeSessionId,
  onSessionDeleted,
}: MedicalSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { open, animate } = useSidebar();

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

    const conversations = [
      {
        user: 'What are the symptoms of dengue fever?',
        ai: 'This is an AI response: Dengue fever symptoms include high fever (40°C/104°F), severe headache, muscle and joint pains, skin rash, and nausea. In severe cases, it can cause dengue hemorrhagic fever with bleeding and plasma leakage. Please consult a healthcare provider for proper diagnosis.',
        intent: 'SymptomQuery',
        sensitive: true,
      },
      {
        user: 'Can you help me understand my blood pressure readings?',
        ai: 'This is an AI response: Blood pressure readings show systolic (top number) and diastolic (bottom number) pressure. Normal is typically below 120/80 mmHg. High blood pressure (hypertension) is 130/80 mmHg or higher. However, always consult your doctor for personalized interpretation of your specific readings.',
        intent: 'LabResultsQuery',
        sensitive: true,
      },
      {
        user: 'What should I know about diabetes management?',
        ai: 'This is an AI response: Diabetes management involves regular blood sugar monitoring, healthy diet with controlled carbohydrates, regular exercise, medication adherence, and routine medical check-ups. Key targets include HbA1c below 7% for most adults. Always work with your healthcare team for personalized management plans.',
        intent: 'TreatmentGuidance',
        sensitive: false,
      },
    ];

    const conversation =
      conversations[Math.floor(Math.random() * conversations.length)];

    try {
      const userMessage = {
        ChatSessionId: sessionId,
        Timestamp: new Date(baseTimestamp.getTime()).toISOString(),
        MessageId: `msg_${Date.now()}_user`,
        Sender: 'User',
        Message: conversation.user,
        Metadata: {
          UserId: 'user_sample',
          Intent: conversation.intent,
          IsSensitive: conversation.sensitive,
        },
      };

      await fetch('/api/add-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userMessage),
      });

      const aiMessage = {
        ChatSessionId: sessionId,
        Timestamp: new Date(baseTimestamp.getTime() + 2000).toISOString(),
        MessageId: `msg_${Date.now()}_ai`,
        Sender: 'AI',
        Message: conversation.ai,
        Metadata: {
          UserId: 'user_sample',
          Intent: conversation.intent,
          IsSensitive: conversation.sensitive,
        },
      };

      const aiResponse = await fetch('/api/add-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiMessage),
      });

      if (aiResponse.ok) {
        await fetchSessions();
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const deleteSession = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();

    if (
      !confirm(
        'Are you sure you want to delete this chat session? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/delete-session?sessionId=${sessionId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();
      if (data.status === 'success') {
        await fetchSessions();
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
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const links = [
    {
      label: 'New Chat',
      href: '#',
      icon: (
        <IconPlus className="h-6 w-6 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
      onClick: createRealChatConversation,
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: (
        <IconUserBolt className="h-6 w-6 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: (
        <IconSettings className="h-6 w-6 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
  ];

  return (
    <div
      className={cn(
        'flex flex-col flex-1 overflow-x-hidden',
        (animate ? open : true) ? 'overflow-y-auto pr-2' : 'overflow-y-hidden'
      )}
    >
      <Logo />
      <div className="mt-8 flex flex-col gap-2">
        {links.map((link, idx) => (
          <div key={idx} onClick={link.onClick || (() => {})}>
            <SidebarLink link={link} />
          </div>
        ))}
      </div>

      {/* Chat Sessions */}
      <div className="mt-6">
        <div className="flex items-center justify-start gap-2 py-2">
          <IconHistory className="h-6 w-6 shrink-0 text-neutral-700 dark:text-neutral-200" />
          <motion.span
            animate={{
              display: animate
                ? open
                  ? 'inline-block'
                  : 'none'
                : 'inline-block',
              opacity: animate ? (open ? 1 : 0) : 1,
            }}
            className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider whitespace-pre inline-block !p-0 !m-0"
          >
            Chat History
          </motion.span>
        </div>
        <div className="mt-2 space-y-1">
          {loading
            ? (animate ? open : true) && (
                <div className="text-xs text-neutral-500 px-2">Loading...</div>
              )
            : sessions.length === 0
            ? null
            : sessions.map((session) => (
                <div
                  key={session.sessionId}
                  onClick={() => onSessionSelect(session.sessionId)}
                  className={cn(
                    'group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700',
                    activeSessionId === session.sessionId &&
                      'bg-neutral-200 dark:bg-neutral-700'
                  )}
                >
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <IconMessageCircle className="h-5 w-5 shrink-0 text-neutral-600 dark:text-neutral-300" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-neutral-700 dark:text-neutral-200 truncate">
                        {session.sessionId.slice(-6)}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                        {session.lastMessage.substring(0, 30)}...
                      </div>
                      <div className="flex items-center space-x-1 mt-1">
                        <span className="text-xs text-neutral-400">
                          {formatTimestamp(session.timestamp)}
                        </span>
                        {session.hasSensitiveData && (
                          <IconShield className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteSession(session.sessionId, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-all"
                  >
                    <IconTrash className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}

export function MedicalSidebar({
  onSessionSelect,
  activeSessionId,
  onSessionDeleted,
}: MedicalSidebarProps) {
  return (
    <div className={cn('flex flex-col h-full w-full')}>
      <Sidebar>
        <SidebarBody className="justify-between gap-10">
          <SidebarContent
            onSessionSelect={onSessionSelect}
            activeSessionId={activeSessionId}
            onSessionDeleted={onSessionDeleted}
          />
          <div>
            <SidebarLink
              link={{
                label: 'MedPal User',
                href: '#',
                icon: (
                  <Image
                    src="/profile.jpg"
                    className="h-7 w-7 shrink-0 rounded-full"
                    width={50}
                    height={50}
                    alt="User Profile"
                  />
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
    </div>
  );
}

export const Logo = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <Image
        src="/MedPal.png"
        className="h-8 w-8 shrink-0"
        width={32}
        height={32}
        alt="MedPal Logo"
      />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-black dark:text-white"
      >
        MedPal
      </motion.span>
    </a>
  );
};

export const LogoIcon = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-blue-600 dark:bg-blue-500" />
    </a>
  );
};
