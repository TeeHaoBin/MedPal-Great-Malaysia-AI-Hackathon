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
    setActiveSessionId(sessionId);
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
      />

      <main className="md:ml-[300px] h-screen flex flex-col">
        <ChatInterface activeSessionId={activeSessionId} />
      </main>
    </div>
  );
}
