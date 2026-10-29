"use client";

import React, { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Edit2,
  Check,
  UserPlus,
  Trash2,
  LogOut,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  Camera,
  User,
  MoreVertical,
  Loader2,
} from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { cn } from "@/lib/utils";

interface GroupDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
}

export function GroupDetailsModal({ isOpen, onClose, conversationId }: GroupDetailsModalProps) {
  const router = useRouter();
  const {
    currentUser,
    conversations,
    registeredUsers,
    onlineUsers,
    updateGroupConversation,
    leaveGroupConversation,
    makeGroupAdmin,
    removeGroupAdmin,
    updateGroupAvatar,
    sendMessage,
  } = useAppStore();

  const conv = conversations.find((c) => c.id === conversationId);

  const [isEditingName, setIsEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pop up aksi anggota untuk fitur admin
  const [selectedMemberForAction, setSelectedMemberForAction] = useState<{
    id: string;
    name: string;
    username: string;
    avatarUrl: string;
    isAdmin: boolean;
    isCreator: boolean;
    isMe: boolean;
  } | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const currentGroupName = conv?.groupName || conv?.participant?.name || "Grup";
  const groupAvatar =
    conv?.avatarUrl ||
    conv?.participant?.avatarUrl ||
    `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(currentGroupName)}`;

  // Penentuan hak akses admin: pembuat grup ATAU anggota yang terdaftar di adminIds (fleksibel ID maupun Username)
  const isCurrentUserAdmin = useMemo(() => {
    if (!conv || !currentUser) return false;
    const currentId = currentUser.id;
    const currentUsername = (currentUser.username || "").toLowerCase();

    if (
      conv.creatorId === currentId ||
      (conv.creatorId && conv.creatorId.toLowerCase() === currentUsername)
    ) {
      return true;
    }

    if (Array.isArray(conv.adminIds)) {
      return conv.adminIds.some((aid) => {
        if (!aid) return false;
        return (
          aid === currentId ||
          aid.toLowerCase() === currentUsername ||
          aid === `user-${currentUsername}`
        );
      });
    }

    return false;
  }, [conv, currentUser]);

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Resolusi data anggota grup beserta status admin
  const members = useMemo(() => {
    if (!conv) return [];
    const ids = conv.participantIds || [];
    const adminIdsSet = new Set(
      (conv.adminIds || []).map((id) => (id || "").toLowerCase())
    );
    if (conv.creatorId) adminIdsSet.add(conv.creatorId.toLowerCase());

    return ids.map((id) => {
      const isCreator = Boolean(
        conv.creatorId === id ||
          (conv.creatorId && conv.creatorId.toLowerCase() === id.toLowerCase())
      );

      if (id === currentUser.id) {
        return {
          id: currentUser.id,
          name: currentUser.name,
          username: currentUser.username,
          avatarUrl: currentUser.avatarUrl,
          isMe: true,
          isCreator: Boolean(isCreator),
          isAdmin: Boolean(isCurrentUserAdmin),
        };
      }
      const found =
        registeredUsers.find(
          (u) =>
            u.id === id ||
            u.username === id ||
            u.username?.toLowerCase() === id.toLowerCase()
        ) ||
        onlineUsers.find(
          (u) =>
            u.id === id ||
            u.username === id ||
            u.username?.toLowerCase() === id.toLowerCase()
        );

      const isAdmin = Boolean(
        isCreator ||
          adminIdsSet.has(id.toLowerCase()) ||
          (found?.username && adminIdsSet.has(found.username.toLowerCase())) ||
          (found?.id && adminIdsSet.has(found.id.toLowerCase()))
      );

      return {
        id,
        name: found?.name || "Pengguna",
        username: found?.username || `user_${id.slice(-4)}`,
        avatarUrl:
          found?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${id}`,
        isMe: false,
        isCreator,
        isAdmin,
      };
    });
  }, [conv, currentUser, isCurrentUserAdmin, registeredUsers, onlineUsers]);

  // Daftar user yang belum masuk ke grup untuk opsi "Tambah Anggota"
  const nonMembers = useMemo(() => {
    if (!conv) return [];
    const currentMemberIds = new Set(conv.participantIds || []);
    const map = new Map<string, { id: string; name: string; username: string; avatarUrl: string }>();

    for (const u of registeredUsers) {
      if (!currentMemberIds.has(u.id)) {
        map.set(u.id, {
          id: u.id,
          name: u.name,
          username: u.username,
          avatarUrl: u.avatarUrl,
        });
      }
    }
    for (const u of onlineUsers) {
      if (!currentMemberIds.has(u.id) && !map.has(u.id)) {
        map.set(u.id, {
          id: u.id,
          name: u.name,
          username: u.username,
          avatarUrl: u.avatarUrl,
        });
      }
    }

    const q = addSearchQuery.toLowerCase().trim();
    const list = Array.from(map.values());
    if (!q) return list;
    return list.filter(
      (u) => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)
    );
  }, [conv, registeredUsers, onlineUsers, addSearchQuery]);

  if (!isOpen || !conv) return null;

  const handleStartEdit = () => {
    setNewGroupName(currentGroupName);
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    const trimmed = newGroupName.trim();
    if (!trimmed || trimmed === currentGroupName) {
      setIsEditingName(false);
      return;
    }
    updateGroupConversation(conv.id, {
      groupName: trimmed,
      participant: {
        ...conv.participant,
        name: trimmed,
      },
    });
    sendMessage(conv.id, `${currentUser.name} mengubah nama grup menjadi "${trimmed}"`, {
      type: "system",
    });
    setIsEditingName(false);
    showToast("Nama grup berhasil diubah");
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      // Unggah ke server via endpoint /api/upload
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const uploadedUrl = data.url || data.mediaUrl;
        if (uploadedUrl) {
          updateGroupAvatar(conv.id, uploadedUrl);
          sendMessage(conv.id, `${currentUser.name} mengubah foto profil grup`, {
            type: "system",
          });
          showToast("Foto profil grup berhasil diperbarui");
          return;
        }
      }

      // Fallback data URL jika offline / LAN
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          updateGroupAvatar(conv.id, dataUrl);
          sendMessage(conv.id, `${currentUser.name} mengubah foto profil grup`, {
            type: "system",
          });
          showToast("Foto profil grup berhasil diperbarui");
        }
      };
      reader.readAsDataURL(file);
    } catch {
      showToast("Gagal memperbarui foto profil grup");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAddMember = (userId: string) => {
    const currentIds = conv.participantIds || [];
    if (currentIds.includes(userId)) return;

    const addedUser =
      registeredUsers.find((u) => u.id === userId || u.username === userId) ||
      onlineUsers.find((u) => u.id === userId || u.username === userId);

    const nextIds = [...currentIds, userId];
    updateGroupConversation(conv.id, {
      participantIds: nextIds,
    });
    sendMessage(conv.id, `${currentUser.name} menambahkan ${addedUser?.name || "anggota baru"}`, {
      type: "system",
    });
    setAddSearchQuery("");
    showToast("Anggota berhasil ditambahkan");
  };

  const handleRemoveMember = (userId: string) => {
    const currentIds = conv.participantIds || [];
    const nextIds = currentIds.filter((id) => id !== userId);
    const nextAdmins = (conv.adminIds || []).filter((id) => id !== userId);
    const targetMember = members.find((m) => m.id === userId);

    updateGroupConversation(conv.id, {
      participantIds: nextIds,
      adminIds: nextAdmins,
    });
    sendMessage(conv.id, `${currentUser.name} mengeluarkan ${targetMember?.name || "anggota"}`, {
      type: "system",
    });
    setSelectedMemberForAction(null);
    showToast("Anggota berhasil dikeluarkan dari grup");
  };

  const handleMakeAdmin = (userId: string) => {
    const targetMember = members.find((m) => m.id === userId);
    makeGroupAdmin(conv.id, userId);
    sendMessage(conv.id, `${currentUser.name} sekarang menjadikan ${targetMember?.name || "anggota"} sebagai admin`, {
      type: "system",
    });
    setSelectedMemberForAction(null);
    showToast("Berhasil menjadikan anggota sebagai Admin Grup");
  };

  const handleDismissAdmin = (userId: string) => {
    const targetMember = members.find((m) => m.id === userId);
    removeGroupAdmin(conv.id, userId);
    sendMessage(conv.id, `${currentUser.name} mencabut status admin ${targetMember?.name || "anggota"}`, {
      type: "system",
    });
    setSelectedMemberForAction(null);
    showToast("Status admin anggota berhasil dicabut");
  };

  const handleLeaveGroup = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar dari grup ini?")) {
      sendMessage(conv.id, `${currentUser.name} keluar dari grup`, {
        type: "system",
      });
      leaveGroupConversation(conv.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-details-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-sky-500/10 text-blue-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <h2 id="group-details-title" className="font-bold text-base text-slate-900 dark:text-slate-100">
              Detail Grup
            </h2>
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

        {/* Body */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1">
          {/* Avatar & Nama Grup */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative group/avatar">
              <img
                src={groupAvatar}
                alt={currentGroupName}
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-slate-100 dark:ring-slate-800 shadow-md"
              />
              {/* Tombol Ubah Foto Profil Grup (Khusus Admin) */}
              {isCurrentUserAdmin && (
                <>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    aria-label="Ubah foto profil grup"
                    title="Ubah foto profil grup"
                    className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-md transition-all border-2 border-white dark:border-slate-900"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
                    )}
                  </button>
                </>
              )}
            </div>

            {isEditingName ? (
              <div className="flex items-center gap-2 w-full max-w-xs">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  maxLength={40}
                  autoFocus
                  className="w-full px-3 py-1.5 text-sm font-semibold rounded-xl border border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shrink-0"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 truncate max-w-[240px]">
                  {currentGroupName}
                </h3>
                {isCurrentUserAdmin && (
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    title="Ubah nama grup"
                    aria-label="Ubah nama grup"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {members.length} Anggota • Dibuat oleh {conv.creatorId === currentUser.id ? "Anda" : "Pengguna"}
            </p>
          </div>

          {/* Opsi Tambah Anggota (Khusus Admin) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Anggota ({members.length})
              </span>
              {isCurrentUserAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-sky-400 hover:underline"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{showAddMember ? "Sembunyikan" : "Tambah Anggota"}</span>
                </button>
              )}
            </div>

            {/* Panel Tambah Anggota */}
            {showAddMember && isCurrentUserAdmin && (
              <div className="mb-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2.5">
                <input
                  type="text"
                  value={addSearchQuery}
                  onChange={(e) => setAddSearchQuery(e.target.value)}
                  placeholder="Cari pengguna untuk ditambahkan..."
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                />
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {nonMembers.length > 0 ? (
                    nonMembers.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-800"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                              {u.name}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">@{u.username}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddMember(u.id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shrink-0"
                        >
                          Tambah
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-400 py-2 text-center">
                      Semua pengguna sudah masuk ke grup ini.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* List Anggota - Klik kontak untuk membuka menu kelola admin */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              {members.map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    if (isCurrentUserAdmin && !m.isMe) {
                      setSelectedMemberForAction(m);
                    }
                  }}
                  className={cn(
                    "flex items-center justify-between p-3 bg-white dark:bg-slate-900 transition-colors",
                    isCurrentUserAdmin && !m.isMe
                      ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100 dark:active:bg-slate-800"
                      : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={m.avatarUrl}
                      alt={m.name}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {m.name} {m.isMe && "(Anda)"}
                        </p>
                        {m.isAdmin && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20">
                            <Shield className="w-2.5 h-2.5" />
                            <span>Admin</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">@{m.username}</p>
                    </div>
                  </div>

                  {isCurrentUserAdmin && !m.isMe && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMemberForAction(m);
                      }}
                      title="Kelola Anggota"
                      aria-label={`Kelola anggota ${m.name}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Opsi Keluar dari Grup */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleLeaveGroup}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-semibold transition-colors active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar dari Grup</span>
            </button>
          </div>
        </div>

        {/* Modal Pop Up: Make Group Admin / Kelola Anggota */}
        {selectedMemberForAction && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150"
            onClick={() => setSelectedMemberForAction(null)}
          >
            <div
              className="w-full max-w-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 space-y-4 animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <img
                  src={selectedMemberForAction.avatarUrl}
                  alt={selectedMemberForAction.name}
                  className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-blue-500/30"
                />
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                    {selectedMemberForAction.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    @{selectedMemberForAction.username}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                {/* Opsi Make Group Admin */}
                {!selectedMemberForAction.isAdmin ? (
                  <button
                    type="button"
                    onClick={() => handleMakeAdmin(selectedMemberForAction.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 active:scale-98 transition-all text-left"
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>Jadikan Admin Grup (Make group admin)</span>
                  </button>
                ) : !selectedMemberForAction.isCreator ? (
                  <button
                    type="button"
                    onClick={() => handleDismissAdmin(selectedMemberForAction.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 active:scale-98 transition-all text-left"
                  >
                    <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500" />
                    <span>Hapus sebagai Admin</span>
                  </button>
                ) : null}

                {/* Keluarkan dari grup (jika bukan pembuat asli) */}
                {!selectedMemberForAction.isCreator && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(selectedMemberForAction.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 active:scale-98 transition-all text-left"
                  >
                    <Trash2 className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>Keluarkan dari Grup</span>
                  </button>
                )}

                {/* Kunjungi Profil */}
                <button
                  type="button"
                  onClick={() => {
                    const uname = selectedMemberForAction.username;
                    setSelectedMemberForAction(null);
                    onClose();
                    router.push(`/profile/${uname}`);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-98 transition-all text-left"
                >
                  <User className="w-4 h-4 shrink-0 text-blue-500" />
                  <span>Lihat Profil Pengguna</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMemberForAction(null)}
                className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Toast Notifikasi */}
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-70 px-4 py-2 rounded-full bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 text-xs font-semibold shadow-xl border border-slate-700 dark:border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
}
