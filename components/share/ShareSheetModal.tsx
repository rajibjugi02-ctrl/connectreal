"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Share2,
  Copy,
  Check,
  Send,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";

interface ShareSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  description?: string;
}

export function ShareSheetModal({
  isOpen,
  onClose,
  title,
  url,
  description,
}: ShareSheetModalProps) {
  const router = useRouter();
  const { conversations, sendMessage, setActiveConversationId } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [sentConvId, setSentConvId] = useState<string | null>(null);

  if (!isOpen) return null;

  const fullShareText = `${title}\n${description ? `"${description}"\n` : ""}${url}`;

  const handleCopyLink = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleShareWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullShareText)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || title,
          url,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const handleSendToDM = (convId: string) => {
    sendMessage(convId, `Membagikan tautan: ${url}`);
    setSentConvId(convId);
    setTimeout(() => {
      setSentConvId(null);
      setActiveConversationId(convId);
      router.push("/messages");
      onClose();
    }, 600);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 space-y-4 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600 dark:text-sky-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Bagikan Konten
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Social Share Buttons */}
        <div className="grid grid-cols-3 gap-3">
          {/* WhatsApp */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/70 transition-all active:scale-95 shadow-2xs"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <MessageCircle className="w-5 h-5 fill-current" />
            </div>
            <span className="text-xs font-bold">WhatsApp</span>
          </button>

          {/* Instagram / Web Share API */}
          <button
            type="button"
            onClick={handleNativeShare}
            className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-gradient-to-tr from-amber-500/10 via-pink-500/10 to-purple-500/10 border border-pink-200/60 dark:border-pink-800/40 text-pink-700 dark:text-pink-300 hover:bg-pink-100/70 transition-all active:scale-95 shadow-2xs"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-md">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold">Instagram / Lain</span>
          </button>

          {/* Copy Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 text-blue-700 dark:text-sky-300 hover:bg-blue-100/70 transition-all active:scale-95 shadow-2xs"
          >
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </div>
            <span className="text-xs font-bold">{copied ? "Tersalin!" : "Salin Tautan"}</span>
          </button>
        </div>

        {/* Copy Link Input Bar */}
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <input
            type="text"
            readOnly
            value={url}
            className="flex-1 bg-transparent text-xs text-slate-600 dark:text-slate-300 px-2 outline-none select-all truncate"
          />
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shrink-0 active:scale-95"
          >
            {copied ? "Tersalin" : "Salin"}
          </button>
        </div>

        {/* Send to ConnectReal Direct Message (DM) */}
        {conversations.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Kirim ke Chat Langsung (DM ConnectReal)
            </h4>
            <div className="max-h-40 overflow-y-auto space-y-1.5 no-scrollbar">
              {conversations.slice(0, 5).map((conv) => {
                const label = conv.isGroup
                  ? conv.groupName || "Grup"
                  : conv.participant?.name || "Kontak";
                const avatar = conv.isGroup
                  ? conv.avatarUrl
                  : conv.participant?.avatarUrl;

                return (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={
                          avatar ||
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80"
                        }
                        alt={label}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {label}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSendToDM(conv.id)}
                      disabled={sentConvId === conv.id}
                      className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all active:scale-95 flex items-center gap-1 shrink-0"
                    >
                      {sentConvId === conv.id ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Terkirim</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3" />
                          <span>Kirim</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

