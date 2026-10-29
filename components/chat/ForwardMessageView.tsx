"use client";

import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Search,
  Check,
  Send,
  FileText,
  Mic,
  Image as ImageIcon,
  CheckCheck,
  X,
} from "lucide-react";
import { MessageItem, ConversationItem, UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ForwardMessageViewProps {
  message: MessageItem;
  conversations: ConversationItem[];
  currentUser: UserProfile;
  onClose: () => void;
  onForward: (targetConvIds: string[]) => void;
}

export function ForwardMessageView({
  message,
  conversations,
  currentUser,
  onClose,
  onForward,
}: ForwardMessageViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConvIds, setSelectedConvIds] = useState<string[]>([]);

  // Filter conversations based on contact name or username
  const filteredConversations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return conversations;
    return conversations.filter((conv) => {
      const name = conv.isGroup ? conv.groupName || "" : conv.participant.name;
      const username = conv.participant.username || "";
      return name.toLowerCase().includes(q) || username.toLowerCase().includes(q);
    });
  }, [conversations, searchQuery]);

  const toggleSelect = (convId: string) => {
    setSelectedConvIds((prev) =>
      prev.includes(convId) ? prev.filter((id) => id !== convId) : [...prev, convId]
    );
  };

  const handleSendSelected = () => {
    if (selectedConvIds.length === 0) return;
    onForward(selectedConvIds);
  };

  const handleSendSingle = (convId: string) => {
    onForward([convId]);
  };

  return (
    <div className="absolute inset-0 z-40 bg-white dark:bg-slate-900 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E2E8F0] dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Kembali ke obrolan"
            className="p-2 -ml-1 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Teruskan Pesan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pilih satu atau beberapa kontak tujuan
            </p>
          </div>
        </div>

        {selectedConvIds.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedConvIds([])}
            className="text-xs font-semibold text-blue-600 dark:text-sky-400 hover:underline"
          >
            Batal Pilih ({selectedConvIds.length})
          </button>
        )}
      </div>

      {/* Message Preview Box */}
      <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/40 border-b border-[#E2E8F0] dark:border-slate-800 shrink-0">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
          Pesan yang Diteruskan
        </div>
        <div className="flex items-start gap-3 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
          {message.type === "image" && message.mediaUrl ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={message.mediaUrl}
                alt="Foto"
                className="w-12 h-12 rounded-xl object-cover shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                  <span>Foto</span>
                </div>
                {message.content && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {message.content}
                  </p>
                )}
              </div>
            </div>
          ) : message.type === "audio" ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Pesan Suara ({message.audioDuration ? `${message.audioDuration}s` : "Audio"})
                </div>
                <p className="text-[11px] text-slate-400">Rekaman audio jernih</p>
              </div>
            </div>
          ) : message.type === "file" ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {message.fileName || "Dokumen"}
                </div>
                <p className="text-[11px] text-slate-400">{message.fileSize || "Berkas"}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2">
              "{message.content}"
            </p>
          )}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="p-3 border-b border-[#E2E8F0] dark:border-slate-800 shrink-0">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama kontak atau @username..."
            className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Recipient List Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 p-2">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-xs">Tidak ada kontak yang cocok dengan pencarian.</p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = selectedConvIds.includes(conv.id);
            const name = conv.isGroup ? conv.groupName : conv.participant.name;
            const username = conv.participant.username;

            return (
              <div
                key={conv.id}
                onClick={() => toggleSelect(conv.id)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-colors group",
                  isSelected
                    ? "bg-blue-50/70 dark:bg-sky-500/10"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Multi-select Checkbox */}
                  <div
                    className={cn(
                      "w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all",
                      isSelected
                        ? "bg-blue-600 border-blue-600 text-white dark:bg-sky-500 dark:border-sky-500"
                        : "border-slate-300 dark:border-slate-600 group-hover:border-slate-400"
                    )}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <img
                      src={conv.participant.avatarUrl}
                      alt={name || "Kontak"}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {!conv.isGroup && conv.participant.isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0">
                    <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                      {name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {conv.isGroup ? "Grup Tim" : `@${username}`}
                    </div>
                  </div>
                </div>

                {/* Direct Instant Forward Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSendSingle(conv.id);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:hover:bg-sky-500 dark:hover:text-white text-slate-700 dark:text-slate-300 transition-all active:scale-95 shrink-0"
                >
                  Kirim
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Bottom Send Button for Multi-selected */}
      {selectedConvIds.length > 0 && (
        <div className="p-3.5 border-t border-[#E2E8F0] dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0 animate-in fade-in slide-in-from-bottom-2">
          <button
            type="button"
            onClick={handleSendSelected}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white font-bold text-xs sm:text-sm shadow-md active:scale-98 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Teruskan ke {selectedConvIds.length} Percakapan Terpilih</span>
          </button>
        </div>
      )}
    </div>
  );
}
