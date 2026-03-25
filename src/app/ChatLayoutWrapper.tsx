'use client';

import React from 'react';
import { useChat } from '@/lib/ChatContext';
import ChatOverlay from '@/components/ChatOverlay';

export default function ChatLayoutWrapper() {
  const { isOpen, openChat, closeChat, selectedCategory } = useChat();

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => openChat()}
        className="fixed bottom-6 right-6 z-40 w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 flex items-center justify-center"
        aria-label="Open chat"
        title="Chat with Gordon"
      >
        <svg
          className="w-8 h-8"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
          <path d="M6 11a1 1 0 11-2 0 1 1 0 012 0zM10 11a1 1 0 11-2 0 1 1 0 012 0zM14 11a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
      </button>

      {/* Chat Overlay Modal */}
      <ChatOverlay isOpen={isOpen} onClose={closeChat} category={selectedCategory} />
    </>
  );
}
