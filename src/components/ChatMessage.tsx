'use client';

import React from 'react';

interface ChatMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  };
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';

  // Simple markdown parsing for bold, italic, and lists
  const parseMarkdown = (text: string): string => {
    // Handle bold
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Handle italic
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Handle line breaks
    text = text.replace(/\n/g, '<br />');
    return text;
  };

  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-xs sm:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
          isAssistant
            ? 'bg-red-100 dark:bg-red-900 text-gray-900 dark:text-white rounded-bl-none'
            : 'bg-blue-500 text-white rounded-br-none'
        }`}
      >
        <div
          className="text-sm sm:text-base leading-relaxed"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }}
        />
        <p className={`text-xs mt-1 ${isAssistant ? 'text-gray-600 dark:text-gray-400' : 'text-blue-100'}`}>
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    </div>
  );
}
