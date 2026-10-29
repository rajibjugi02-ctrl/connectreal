"use client";

import React, { useState } from "react";
import { Search, Trash2, Plus } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useTranslation } from "@/lib/i18n/translations";
import { formatTimestamp, cn } from "@/lib/utils";
import { getChatPartner } from "@/lib/utils/chatPartner";
import { canSeeOnlineStatus, getOnlineDotClass } from "@/lib/utils/onlineStatus";
import { CreateGroupModal } from "./CreateGroupModal";

interface ConversationListProps {
  onSelectConversation?: (id: string) => void;
}

export function ConversationList({ onSelectConversation }: ConversationListProps) {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    setIsMobileChatOpen,
    clearConversation,
    currentUser,
    registeredUsers,
    onlineUsers,
    messages,
  } = useAppStore();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<"all" | "unread" | "groups">("all");
  const [search, setSearch] = useState("");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  const filteredConversations = conversations.filter((c) => {
    // Percakapan grup dan obrolan yang melibatkan akun pengguna saat ini
    const isParticipant =
      !currentUser?.id ||
      c.isGroup ||
      c.participant?.id === currentUser.id ||
      c.participantIds?.some((id) => id === currentUser.id || id === currentUser.username) ||
      c.creatorId === currentUser.id ||
      c.creatorId === currentUser.username ||
      (messages[c.id] && messages[c.id].some((m) => m.senderId === currentUser.id));

    if (!isParticipant) return false;

    if (filter === "unread" && c.unreadCount === 0) return false;
    if (filter === "groups" && !c.isGroup) return false;
    const partner = getChatPartner(c, currentUser, registeredUsers, onlineUsers, messages[c.id] || []);
    if (search.trim()) {
      const query = search.toLowerCase();
      const name = c.isGroup ? (c.groupName || "") : partner.name;
      const username = partner.username || "";
      return name.toLowerCase().includes(query) || username.toLowerCase().includes(query);
    }
    return true;
  });

  const handleSelect = (id: string) => {
    setActiveConversationId(id);
    setIsMobileChatOpen(true);
    onSelectConversation?.(id);
  };

  return (
    <div className="flex flex-col h-full border-r border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900">
      {/* Header & Search */}
      <div className="p-4 border-b border-[#E2E8F0] dark:border-slate-800 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">
            {t.chatTitle}
          </h2>
          <button
            type="button"
            onClick={() => setIsCreateGroupOpen(true)}
            title="Buat Grup Baru"
            aria-label="Buat Grup Baru"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Grup</span>
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari percakapan..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-full transition-all shrink-0 active:scale-95",
              filter === "all"
                ? "bg-blue-600 dark:bg-sky-500 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-[#E2E8F0] dark:border-slate-700"
            )}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-full transition-all shrink-0 active:scale-95",
              filter === "unread"
                ? "bg-blue-600 dark:bg-sky-500 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-[#E2E8F0] dark:border-slate-700"
            )}
          >
            Belum Dibaca
          </button>
          <button
            type="button"
            onClick={() => setFilter("groups")}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-full transition-all shrink-0 active:scale-95",
              filter === "groups"
                ? "bg-blue-600 dark:bg-sky-500 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-[#E2E8F0] dark:border-slate-700"
            )}
          >
            Grup
          </button>
        </div>
      </div>

      {/* Conversation Item List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#E2E8F0] dark:divide-slate-800">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((item) => {
            const isSelected = item.id === activeConversationId;
            const partner = getChatPartner(item, currentUser, registeredUsers, onlineUsers, messages[item.id] || []);
            const displayName = item.isGroup ? item.groupName : partner.name;

            return (
              <div
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={cn(
                  "flex items-center gap-3 p-3.5 cursor-pointer transition-colors relative group",
                  isSelected
                    ? "bg-blue-50 dark:bg-sky-400/10"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                )}
              >
                {/* Avatar with Online indicator */}
                <div className="relative shrink-0">
                  <img
                    src={partner.avatarUrl}
                    alt={displayName || "Pengguna"}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {!item.isGroup && (
                    <div
                      title={canSeeOnlineStatus(partner, currentUser, partner.isFollowing) ? "Aktif sekarang" : "Offline"}
                      className={cn(
                        "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full",
                        getOnlineDotClass(canSeeOnlineStatus(partner, currentUser, partner.isFollowing))
                      )}
                    />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                      {displayName}
                    </span>
                    {item.lastMessageAt && (
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {formatTimestamp(item.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {item.lastMessage || "Belum ada pesan"}
                  </p>
                </div>

                {/* Unread badge */}
                {item.unreadCount > 0 && (
                  <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-blue-600 dark:bg-sky-500 text-white text-[11px] font-bold flex items-center justify-center">
                    {item.unreadCount}
                  </span>
                )}

                {/* Clear conversation messages button (keeps contact intact) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Bersihkan riwayat pesan dengan ${displayName}? Pesan akan dikosongkan tanpa menghapus kontak.`)) {
                      clearConversation(item.id);
                    }
                  }}
                  title="Bersihkan riwayat pesan"
                  aria-label="Bersihkan riwayat pesan"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            Tidak ada percakapan pada filter ini.
          </div>
        )}
      </div>

      {/* Modal Pembuatan Grup Baru */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
      />
    </div>
  );
}
