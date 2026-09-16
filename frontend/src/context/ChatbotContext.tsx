"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SESSION_KEY = "chatbot_messages";

function loadMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveMessages(messages: ChatMessage[]): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages));
  } catch {
    // sessionStorage full or unavailable — silently ignore
  }
}

interface ChatbotContextType {
  isOpen: boolean;
  openChatbot: () => void;
  closeChatbot: () => void;
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  clearMessages: () => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessagesState] = useState<ChatMessage[]>([]);

  // Load from sessionStorage on mount
  useEffect(() => {
    setMessagesState(loadMessages());
  }, []);

  const openChatbot = () => setIsOpen(true);
  const closeChatbot = () => setIsOpen(false);

  const setMessages = useCallback((msgs: ChatMessage[]) => {
    setMessagesState(msgs);
    saveMessages(msgs);
  }, []);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessagesState((prev) => {
      const updated = [...prev, msg];
      saveMessages(updated);
      return updated;
    });
  }, []);

  const clearMessages = useCallback(() => {
    setMessagesState([]);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <ChatbotContext.Provider
      value={{ isOpen, openChatbot, closeChatbot, messages, addMessage, setMessages, clearMessages }}
    >
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbot() {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error("useChatbot must be used within ChatbotProvider");
  }
  return context;
}
