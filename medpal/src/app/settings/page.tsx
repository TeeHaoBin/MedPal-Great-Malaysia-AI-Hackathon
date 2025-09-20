'use client';

import { useState } from 'react';
import { MedicalSidebar } from '@/components/MedicalSidebar';
import { IconSettings, IconUser, IconBell, IconShield, IconPalette, IconLanguage, IconMoon, IconSun } from '@tabler/icons-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsPage() {
  const [activeSessionId, setActiveSessionId] = useState<string>();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('en');
  const [autoSave, setAutoSave] = useState(true);
  const [dataRetention, setDataRetention] = useState('30');

  const handleSessionSelect = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  const handleSessionDeleted = () => {
    setActiveSessionId(undefined);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <MedicalSidebar
        onSessionSelect={handleSessionSelect}
        activeSessionId={activeSessionId}
        onSessionDeleted={handleSessionDeleted}
      />

      <main className="md:ml-[300px] flex flex-col min-h-screen">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <IconSettings className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Manage your MedPal preferences and account settings</p>
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="space-y-8">

              {/* Appearance */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <IconPalette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Appearance</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Use dark theme across the application</p>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                      {theme === 'dark' ? (
                        <IconMoon className="absolute left-1 w-3 h-3 text-blue-600" />
                      ) : (
                        <IconSun className="absolute right-1 w-3 h-3 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <IconBell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Notifications</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Push Notifications</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Receive notifications for important updates</p>
                    </div>
                    <button
                      onClick={() => setNotifications(!notifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifications ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Language */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <IconLanguage className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Language & Region</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="en">English</option>
                      <option value="ms">Bahasa Malaysia</option>
                      <option value="zh">中文</option>
                      <option value="ta">தமிழ்</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Privacy & Security */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <IconShield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Privacy & Security</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-save Conversations</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Automatically save chat conversations to DynamoDB</p>
                    </div>
                    <button
                      onClick={() => setAutoSave(!autoSave)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        autoSave ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          autoSave ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data Retention Period</label>
                    <select
                      value={dataRetention}
                      onChange={(e) => setDataRetention(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="7">7 days</option>
                      <option value="30">30 days</option>
                      <option value="90">90 days</option>
                      <option value="365">1 year</option>
                      <option value="forever">Forever</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">How long to keep your chat history and medical data</p>
                  </div>
                </div>
              </div>

              {/* Medical Preferences */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <IconUser className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-medium text-gray-900">Medical Preferences</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Units</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Temperature</label>
                        <select className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500">
                          <option value="celsius">Celsius (°C)</option>
                          <option value="fahrenheit">Fahrenheit (°F)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Weight</label>
                        <select className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500">
                          <option value="kg">Kilograms (kg)</option>
                          <option value="lbs">Pounds (lbs)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h2 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h2>
                <div className="space-y-4">
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    Clear All Chat History
                  </button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ml-3">
                    Delete Account
                  </button>
                </div>
                <p className="text-xs text-red-600 mt-2">These actions cannot be undone.</p>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}