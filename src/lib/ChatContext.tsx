'use client';

import React, { createContext, useContext, useState } from 'react';

interface ChatContextType {
  isOpen: boolean;
  openChat: (category?: string) => void;
  closeChat: () => void;
  selectedCategory?: string;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>();

  const openChat = (category?: string): void => {
    setSelectedCategory(category);
    setIsOpen(true);
  };

  const closeChat = (): void => {
    setIsOpen(false);
  };

  return (
    <ChatContext.Provider value={{ isOpen, openChat, closeChat, selectedCategory }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}
