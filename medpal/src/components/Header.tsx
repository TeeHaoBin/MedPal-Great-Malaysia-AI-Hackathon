'use client';

import { User, Menu } from 'lucide-react';
import Image from 'next/image';

interface HeaderProps {
  onSidebarToggle: () => void;
}

export default function Header({ onSidebarToggle }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <button
              onClick={onSidebarToggle}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden">
              <Image
                src="/MedPal.png"
                alt="MedPal Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">MedPal</h1>
          </div>

          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors cursor-pointer">
              <User className="w-4 h-4 text-gray-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
