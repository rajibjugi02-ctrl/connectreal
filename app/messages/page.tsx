"use client";

import React, { useEffect } from "react";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useAppStore } from "@/lib/store/useAppStore";

export default function MessagesPage() {
  const {
    isMobileChatOpen,
    setIsMobileChatOpen,
    setActiveConversationId,
  } = useAppStore();

  const handleBack = () => {
    setIsMobileChatOpen(false);
  };

  const handleSelectConversation = (id?: string) => {
    if (id) {
      setActiveConversationId(id);
    }
    setIsMobileChatOpen(true);
  };

  // Pastikan saat pertama kali masuk ke /messages, tampilan selalu di daftar percakapan
  useEffect(() => {
    return () => {
      setIsMobileChatOpen(false);
    };
  }, [setIsMobileChatOpen]);

  return (
    <div className="h-full w-full flex overflow-hidden bg-white dark:bg-slate-900">
      {/* Desktop Split-View: Left column list, Right column chat window */}
      <div
        className={`w-full md:w-5/12 lg:w-4/12 h-full ${
          isMobileChatOpen ? "hidden md:block" : "block"
        }`}
      >
        <ConversationList onSelectConversation={handleSelectConversation} />
      </div>

      <div
        className={`w-full md:w-7/12 lg:w-8/12 h-full border-l-0 md:border-l border-[#E2E8F0] dark:border-slate-800 ${
          isMobileChatOpen ? "block" : "hidden md:block"
        }`}
      >
        <ChatWindow onBack={handleBack} />
      </div>
    </div>
  );
}
