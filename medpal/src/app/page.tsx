'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { MedicalSidebar } from '@/components/MedicalSidebar';
import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string>();

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSessionSelect = (sessionId: string) => {
    if (sessionId === '') {
      setActiveSessionId(undefined); // Clear session for "New Chat" / homepage
    } else {
      setActiveSessionId(sessionId);
    }
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const handleSessionDeleted = () => {
    setActiveSessionId(undefined); // Clear active session when deleted
  };
  return (
    <div className="min-h-screen bg-white">
      <MedicalSidebar
        onSessionSelect={handleSessionSelect}
        activeSessionId={activeSessionId}
        onSessionDeleted={handleSessionDeleted}
        isOpen={sidebarOpen}
        onToggle={handleSidebarToggle}
      />

      <main className="h-screen flex flex-col main-content">
        <ChatInterface
          activeSessionId={activeSessionId}
          onSidebarToggle={handleSidebarToggle}
        />
      </main>
    </div>
  );
}
