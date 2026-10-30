"use client";

export const dynamic = "force-dynamic";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  UserPlus,
  UserMinus,
  Edit2,
  Camera,
  Image as ImageIcon,
  FileText,
  Link as LinkIcon,
  Download,
  LogOut,
  Palette,
  Check,
  X,
  Users,
} from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { formatTimestamp, cn } from "@/lib/utils";
import { MediaRenderer } from "@/components/media/MediaRenderer";

export default function GroupInfoPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const {
    conversations,
    currentUser,
    registeredUsers,
    onlineUsers,
    messages,
    updateGroupConversation,
    makeGroupAdmin,
    removeGroupAdmin,
    leaveGroupConversation,
    chatCustomization,
    setChatCustomization,
  } = useAppStore();

  const conv = conversations.find((c) => c.id === groupId);

  const [activeTab, setActiveTab] = useState<"media" | "links" | "docs">("media");
  const [isEditingName, setIsEditingName] = useState(false);
  const [groupNameDraft, setGroupNameDraft] = useState(conv?.groupName || "");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  if (!conv || !conv.isGroup) {
    return (
      <div className="w-full min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6">
        <header className="flex items-center gap-3 py-3 border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => router.push("/messages")}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">Detail Grup</h1>
        </header>
        <div className="py-20 text-center text-slate-500">
          <p>Grup tidak ditemukan atau telah dihapus.</p>
        </div>
      </div>
    );
  }

  const isAdmin =
    conv.creatorId === currentUser.id ||
    conv.adminIds?.includes(currentUser.id) ||
    conv.adminIds?.includes(currentUser.username);

  const groupMessages = messages[groupId] || [];

  // 1. Group Media (Photos & Videos)
  const groupMedia = useMemo(() => {
    const list: Array<{ id: string; url: string; type: "image" | "video"; createdAt: string }> = [];
    groupMessages.forEach((m) => {
      if (m.type === "image") {
        if (m.mediaUrls && m.mediaUrls.length > 0) {
          m.mediaUrls.forEach((u, i) => list.push({ id: `${m.id}-${i}`, url: u, type: "image", createdAt: m.createdAt }));
        } else if (m.mediaUrl) {
          list.push({ id: m.id, url: m.mediaUrl, type: "image", createdAt: m.createdAt });
        }
      }
    });
    return list;
  }, [groupMessages]);

  // 2. Group Links
  const groupLinks = useMemo(() => {
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    const list: Array<{ id: string; url: string; createdAt: string }> = [];
    groupMessages.forEach((m) => {
      const matches = m.content?.match(linkRegex);
      if (matches) {
        matches.forEach((u, i) => list.push({ id: `${m.id}-link-${i}`, url: u, createdAt: m.createdAt }));
      }
    });
    return list;
  }, [groupMessages]);

  // 3. Group Documents
  const groupDocs = useMemo(() => {
    return groupMessages.filter((m) => m.type === "file" && m.mediaUrl);
  }, [groupMessages]);

  const handleSaveGroupName = () => {
    if (!groupNameDraft.trim()) return;
    updateGroupConversation(groupId, { groupName: groupNameDraft.trim() });
    setIsEditingName(false);
    showToast("Nama grup berhasil diperbarui");
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          updateGroupConversation(groupId, { avatarUrl: reader.result });
          showToast("Foto profil grup berhasil diperbarui");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadDoc = async (url: string, fileName: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const bUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = bUrl;
      a.download = fileName || "dokumen";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(bUrl);
      showToast("Berkas berhasil diunduh");
    } catch {
      window.open(url, "_blank");
    }
  };

  const handleLeaveGroup = () => {
    if (confirm(`Yakin ingin keluar dari grup "${conv.groupName}"?`)) {
      leaveGroupConversation(groupId);
      router.push("/messages");
    }
  };

  const currentParticipants = conv.participants || [];

  return (
    <div className="w-full min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 pb-20 select-none">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold shadow-xl animate-in fade-in">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/messages")}
            className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-base sm:text-lg">Detail Grup</h1>
        </div>
      </header>

      {/* Group Profile Hero Banner */}
      <div className="p-6 flex flex-col items-center justify-center border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="relative group">
          <img
            src={
              conv.avatarUrl ||
              `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(conv.groupName || "grup")}`
            }
            alt={conv.groupName}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover shadow-xl border-4 border-white dark:border-slate-800"
          />
          {isAdmin && (
            <label className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center cursor-pointer shadow-md transition-transform active:scale-90">
              <Camera className="w-4 h-4" />
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          )}
        </div>

        {/* Group Name & Edit Name */}
        <div className="mt-4 text-center">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={groupNameDraft}
                onChange={(e) => setGroupNameDraft(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-xl border border-blue-500 bg-white dark:bg-slate-800 outline-none font-bold text-center"
              />
              <button
                type="button"
                onClick={handleSaveGroupName}
                className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditingName(false)}
                className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <h2 className="font-extrabold text-xl text-slate-900 dark:text-slate-100">
                {conv.groupName}
              </h2>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setGroupNameDraft(conv.groupName || "");
                    setIsEditingName(true);
                  }}
                  className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-sky-400"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Grup • {currentParticipants.length} Anggota
          </p>
        </div>
      </div>

      {/* Theme Customization Pill for Group */}
      {isAdmin && (
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Palette className="w-4 h-4 text-blue-600" />
            <span>Warna Gelembung Chat Grup:</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[
              { id: "blue", bg: "bg-blue-600" },
              { id: "purple", bg: "bg-purple-600" },
              { id: "emerald", bg: "bg-emerald-600" },
              { id: "rose", bg: "bg-rose-600" },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setChatCustomization({ bubbleColor: c.id });
                  showToast(`Warna tema diubah ke ${c.id}`);
                }}
                className={cn(
                  "w-6 h-6 rounded-full transition-transform active:scale-90",
                  c.bg,
                  chatCustomization?.bubbleColor === c.id && "ring-2 ring-offset-2 ring-blue-500 scale-110"
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tabs: Media, Links, Docs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {[
          { id: "media", label: `Media (${groupMedia.length})`, icon: ImageIcon },
          { id: "links", label: `Link (${groupLinks.length})`, icon: LinkIcon },
          { id: "docs", label: `Dokumen (${groupDocs.length})`, icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "flex-1 py-3 text-xs sm:text-sm font-bold text-center transition-colors relative flex items-center justify-center gap-1.5",
                activeTab === tab.id
                  ? "text-blue-600 dark:text-sky-400"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-sky-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        {activeTab === "media" && (
          <div>
            {groupMedia.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {groupMedia.map((item) => (
                  <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-black/10">
                    <MediaRenderer src={item.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-center text-slate-400 py-6">Belum ada media dibagikan di grup ini.</p>
            )}
          </div>
        )}

        {activeTab === "links" && (
          <div className="space-y-2">
            {groupLinks.length > 0 ? (
              groupLinks.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs text-blue-600 dark:text-sky-400 font-semibold truncate"
                >
                  <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.url}</span>
                </a>
              ))
            ) : (
              <p className="text-xs text-center text-slate-400 py-6">Belum ada link dibagikan di grup ini.</p>
            )}
          </div>
        )}

        {activeTab === "docs" && (
          <div className="space-y-2">
            {groupDocs.length > 0 ? (
              groupDocs.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {item.fileName || "Dokumen"}
                      </p>
                      <p className="text-[10px] text-slate-400">{item.fileSize || "Berkas"}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadDoc(item.mediaUrl!, item.fileName || "dokumen")}
                    className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shrink-0 active:scale-95 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-center text-slate-400 py-6">Belum ada dokumen dibagikan di grup ini.</p>
            )}
          </div>
        )}
      </div>

      {/* Member List Section */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Daftar Anggota ({currentParticipants.length})</span>
          </h3>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowAddMemberModal(true)}
              className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-sky-400 hover:bg-blue-100 transition-colors flex items-center gap-1"
            >
              <UserPlus className="w-3 h-3" />
              <span>Tambah</span>
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {currentParticipants.map((member) => {
            const memberIsAdmin =
              conv.creatorId === member.id ||
              conv.adminIds?.includes(member.id) ||
              conv.adminIds?.includes(member.username);

            return (
              <div key={member.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                        {member.name}
                      </span>
                      {member.id === currentUser.id && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          Anda
                        </span>
                      )}
                      {memberIsAdmin && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                          Admin
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">@{member.username}</span>
                  </div>
                </div>

                {isAdmin && member.id !== currentUser.id && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (memberIsAdmin) {
                          removeGroupAdmin(groupId, member.id);
                          showToast(`Status admin @${member.username} dicabut`);
                        } else {
                          makeGroupAdmin(groupId, member.id);
                          showToast(`@${member.username} dijadikan admin`);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      {memberIsAdmin ? "Hapus Admin" : "Jadikan Admin"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Leave Group Action */}
      <div className="p-4 pt-6">
        <button
          type="button"
          onClick={handleLeaveGroup}
          className="w-full py-3 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-bold text-xs sm:text-sm border border-red-200 dark:border-red-900/40 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar dari Grup</span>
        </button>
      </div>
    </div>
  );
}
