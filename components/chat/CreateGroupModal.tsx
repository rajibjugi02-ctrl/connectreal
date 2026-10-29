"use client";

import React, { useState, useMemo } from "react";
import { X, Search, Check, Users, Sparkles } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { cn } from "@/lib/utils";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const {
    currentUser,
    registeredUsers,
    onlineUsers,
    createGroupConversation,
    setActiveConversationId,
    setIsMobileChatOpen,
  } = useAppStore();

  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Kumpulkan semua pengguna yang dapat diundang (kecuali diri sendiri)
  const availableUsers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; username: string; avatarUrl: string; isOnline: boolean }>();

    for (const u of registeredUsers) {
      if (u.id !== currentUser.id && u.username.toLowerCase() !== currentUser.username.toLowerCase()) {
        map.set(u.id, {
          id: u.id,
          name: u.name,
          username: u.username,
          avatarUrl: u.avatarUrl,
          isOnline: Boolean(u.isOnline),
        });
      }
    }

    for (const u of onlineUsers) {
      if (u.id !== currentUser.id && u.username.toLowerCase() !== currentUser.username.toLowerCase()) {
        const existingKey = Array.from(map.entries()).find(
          ([, val]) => val.username.toLowerCase() === u.username.toLowerCase()
        );
        if (existingKey) {
          map.set(existingKey[0], {
            ...existingKey[1],
            isOnline: true,
          });
        } else {
          map.set(u.id, {
            id: u.id,
            name: u.name,
            username: u.username,
            avatarUrl: u.avatarUrl,
            isOnline: true,
          });
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0));
  }, [registeredUsers, onlineUsers, currentUser.id, currentUser.username]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return availableUsers;
    return availableUsers.filter(
      (u) => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)
    );
  }, [availableUsers, searchQuery]);

  if (!isOpen) return null;

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreateGroup = () => {
    const trimmedName = groupName.trim();
    if (!trimmedName || selectedUserIds.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const newConvId = createGroupConversation(trimmedName, selectedUserIds);
      setActiveConversationId(newConvId);
      setIsMobileChatOpen(true);
      onClose();
      setGroupName("");
      setSelectedUserIds([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-group-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-sky-500/10 text-blue-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 id="create-group-title" className="font-bold text-base text-slate-900 dark:text-slate-100">
                Buat Grup Baru
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih anggota dan tentukan nama grup
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Input Nama Grup */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nama Grup <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Contoh: Tim Project Alpha, Sahabat Connect..."
              maxLength={40}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Chips Anggota Terpilih */}
          {selectedUserIds.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                <span>Anggota Dipilih ({selectedUserIds.length})</span>
                <button
                  type="button"
                  onClick={() => setSelectedUserIds([])}
                  className="text-blue-600 dark:text-sky-400 hover:underline"
                >
                  Hapus semua
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                {selectedUserIds.map((id) => {
                  const user = availableUsers.find((u) => u.id === id);
                  if (!user) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 shadow-2xs"
                    >
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      <span className="font-medium max-w-[100px] truncate">{user.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleSelectUser(id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cari Pengguna */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tambah Anggota
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau username..."
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Daftar Pengguna */}
          <div className="space-y-1 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 pr-1">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const isSelected = selectedUserIds.includes(user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleSelectUser(user.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left",
                      isSelected
                        ? "bg-blue-50/70 dark:bg-sky-500/10 text-slate-900 dark:text-slate-100"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0",
                        isSelected
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-slate-300 dark:border-slate-600"
                      )}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                Tidak ada pengguna yang cocok dengan pencarian.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedUserIds.length === 0 || isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSubmitting ? "Membuat..." : "Buat Grup"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

