"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  RotateCcw, 
  ArrowLeft
} from "lucide-react";
import { getSmartBotReply } from "@/lib/bot/connectBot";
import { useAppStore } from "@/lib/store/useAppStore";
import { cn } from "@/lib/utils";
import { ApplePulseDots } from "@/components/ui/apple-pulse-dots";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome-1",
    sender: "bot",
    text: "Halo! Saya **ConnectBot AI**, asisten cerdas resmi ConnectReal. Ada yang bisa saya bantu terkait fitur platform atau panduan penggunaan?",
    timestamp: "Sekarang",
  },
];

const SUGGESTION_CHIPS = [
  { label: "💡 Upload Story HD", query: "Bagaimana cara upload story agar kualitasnya HD?" },
  { label: "📹 Panggilan Kamera", query: "Bagaimana cara melakukan video call dengan kamera asli?" },
  { label: "🔒 Privasi & Akun", query: "Bagaimana cara mengatur privasi dan akun saya?" },
  { label: "🔍 Cari Kontak & Berita", query: "Apa saja yang bisa dicari di menu Eksplorasi?" },
];

export function AIAssistantModal() {
  const { isAuthenticated, currentUser, isMobileChatOpen } = useAppStore();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Posisi drag tombol AI
  const [pos, setPos] = useState<{ x?: number; y?: number }>({});
  const isDraggingRef = useRef(false);
  const startDragRef = useRef<{ clientX: number; clientY: number; startX: number; startY: number } | null>(null);
  const hasMovedRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    const rect = e.currentTarget.getBoundingClientRect();
    startDragRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: rect.left,
      startY: rect.top,
    };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDraggingRef.current || !startDragRef.current) return;
    const dx = e.clientX - startDragRef.current.clientX;
    const dy = e.clientY - startDragRef.current.clientY;
    if (Math.hypot(dx, dy) > 5) {
      hasMovedRef.current = true;
    }
    if (hasMovedRef.current) {
      const btnSize = 56;
      const newX = Math.max(8, Math.min(window.innerWidth - btnSize - 8, startDragRef.current.startX + dx));
      const newY = Math.max(8, Math.min(window.innerHeight - btnSize - 8, startDragRef.current.startY + dy));
      setPos({ x: newX, y: newY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    isDraggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    if (!hasMovedRef.current) {
      setIsOpen(true);
    }
  };

  // Auto-scroll saat pesan baru masuk
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  // Fokus input otomatis
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Sembunyikan jika belum login, di halaman auth, atau saat sedang aktif chating di layar ponsel
  const shouldHide =
    !isAuthenticated ||
    pathname === "/auth" ||
    !currentUser ||
    !currentUser.id ||
    currentUser.id === "user-current" ||
    (pathname?.startsWith("/messages") && isMobileChatOpen);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: "u-" + Date.now(),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput("");
    setIsTyping(true);

    try {
      const replyText = await getSmartBotReply(text, updatedHistory);
      const botMsg: ChatMessage = {
        id: "b-" + Date.now(),
        sender: "bot",
        text: replyText,
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: "b-" + Date.now(),
        sender: "bot",
        text: "Aku selalu siap mendengarkan. Ada yang ingin kamu ceritakan lebih banyak?",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
  };

  if (shouldHide) {
    return null;
  }

  return (
    <>
      {/* Floating Trigger Button: Bulat, Elegan Hitam Obsidian, dan Bisa Dipindah-pindah (Draggable) */}
      {!isOpen && (
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            isDraggingRef.current = false;
          }}
          style={
            pos.x !== undefined && pos.y !== undefined
              ? { left: `${pos.x}px`, top: `${pos.y}px`, right: "auto", bottom: "auto" }
              : undefined
          }
          aria-label="Tanya AI Assistant (ConnectBot)"
          className={cn(
            "fixed z-40 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#0B0F17] hover:bg-black text-white",
            "border border-slate-700/90 shadow-2xl shadow-black/70 flex items-center justify-center",
            "touch-none select-none cursor-grab active:cursor-grabbing transition-transform duration-150 hover:scale-105 active:scale-95 group",
            pos.x === undefined &&
              (pathname?.startsWith("/messages") && isMobileChatOpen
                ? "top-16 right-4 md:bottom-8 md:top-auto md:right-8"
                : "bottom-20 md:bottom-8 right-4 md:right-8")
          )}
        >
          <div className="relative flex items-center justify-center pointer-events-none">
            <Bot className="w-6 h-6 text-slate-200 transition-transform duration-300 group-hover:scale-110" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0B0F17] animate-pulse" />
          </div>
        </button>
      )}

      {/* Tampilan Chat: Mobile Fullscreen Halaman Penuh, Desktop Window Pop-up Kecil */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:inset-auto md:bottom-6 md:right-6 flex flex-col justify-end md:justify-start">
          {/* Main Chat View */}
          <section
            aria-label="ConnectBot AI Assistant"
            className={cn(
              "flex flex-col overflow-hidden bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100",
              // Mobile: Full screen seperti halaman baru
              "w-full h-[100dvh] fixed inset-0 z-50",
              // Desktop: Pop-up kecil di kanan bawah
              "md:relative md:inset-auto md:w-[380px] md:h-[540px] md:rounded-2xl md:border md:border-slate-800 md:shadow-2xl"
            )}
          >
            {/* Header: Bersih dengan Aksen Hitam Obsidian */}
            <div className="p-3.5 px-4 bg-[#0B0F17] text-white border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {/* Back button on Mobile */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="md:hidden p-1 text-slate-300 hover:text-white"
                  aria-label="Kembali"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="relative w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white">
                  <Bot className="w-4.5 h-4.5 text-slate-200" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-[#0B0F17]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-white leading-tight">
                      ConnectBot AI
                    </h3>
                    <span className="text-[10px] px-1.5 py-0.2 font-medium rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Asisten
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Bantuan cepat fitur ConnectReal
                  </p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleResetChat}
                  title="Reset Percakapan"
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                {/* Desktop Close Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  title="Tutup"
                  className="hidden md:block p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/70 dark:bg-[#0B0F17]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[85%]",
                    msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div
                    className={cn(
                      "px-3.5 py-2.5 rounded-2xl text-xs md:text-sm leading-relaxed whitespace-pre-wrap break-words shadow-xs",
                      msg.sender === "user"
                        ? "bg-[#0B0F17] dark:bg-black text-white border border-slate-700 rounded-br-xs"
                        : "bg-white dark:bg-[#131B29] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-bl-xs"
                    )}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {/* Typing indicator with Apple Pulse Dots */}
              {isTyping && (
                <div className="flex items-center px-4 py-2.5 rounded-2xl bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 w-fit text-slate-400">
                  <ApplePulseDots size="sm" color="bg-blue-600 dark:bg-sky-400" />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions Chips */}
            <div className="px-3 pt-2 pb-1 bg-white dark:bg-[#0B0F17] border-t border-slate-200 dark:border-slate-800/80 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
              {SUGGESTION_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip.query)}
                  className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-black hover:text-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white dark:bg-[#0B0F17] border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanyakan sesuatu ke ConnectBot..."
                className="flex-1 text-xs md:text-sm px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#131B29] text-slate-900 dark:text-slate-100 placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-slate-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                aria-label="Kirim Pesan"
                className="p-2.5 rounded-xl bg-[#0B0F17] dark:bg-black hover:bg-slate-800 text-white border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
