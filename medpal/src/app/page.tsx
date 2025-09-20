'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import FileUpload from '@/components/FileUpload';

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
    <div className="min-h-screen bg-gray-50">
      <Header onSidebarToggle={handleSidebarToggle} />

      <div className="flex pt-16">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={handleSidebarToggle}
          onSessionSelect={handleSessionSelect}
          activeSessionId={activeSessionId}
          onSessionDeleted={handleSessionDeleted}
        />

        <main className="flex-1 md:ml-80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
            {/* Mobile/Tablet stacked layout, Desktop side-by-side */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 lg:gap-8 min-h-[calc(100vh-8rem)]">

              {/* Chat Section */}
              <div className="order-1 xl:order-1">
                <div className="h-full flex flex-col">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 flex-shrink-0">
                    Chat with MedPal
                    {activeSessionId && (
                      <span className="ml-2 text-sm text-gray-500 break-all">
                        Session: {activeSessionId.slice(-6)}
                      </span>
                    )}
                  </h2>
                  <div className="flex-1 min-h-0">
                    <ChatInterface activeSessionId={activeSessionId} />
                  </div>
                </div>
              </div>

              {/* File Upload Section */}
              <div className="order-2 xl:order-2">
                <div className="h-full flex flex-col">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 flex-shrink-0">
                    Upload Medical Documents
                  </h2>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 flex-shrink-0">
                    <FileUpload />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
