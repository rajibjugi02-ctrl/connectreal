"use client";

export const dynamic = "force-dynamic";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Search,
  Edit3,
  Image as ImageIcon,
  Link as LinkIcon,
  FileText,
  Download,
  Ban,
  AlertTriangle,
  Check,
  X,
  ExternalLink,
  Shield,
  MessageSquare,
} from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { formatTimestamp, cn } from "@/lib/utils";
import { MediaRenderer } from "@/components/media/MediaRenderer";

export default function ContactInfoPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;

  const {
    registeredUsers,
    onlineUsers,
    currentUser,
    messages,
    conversations,
    contactAliases,
    setContactAlias,
    blockUser,
    blockedUsers,
    unblockUser,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<"media" | "links" | "docs">("media");
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [aliasDraft, setAliasDraft] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Find target contact user
  const contactUser = useMemo(() => {
    return (
      registeredUsers.find(
        (u) =>
          u.id === contactId ||
          u.username.toLowerCase() === contactId.toLowerCase()
      ) ||
      onlineUsers.find(
        (u) =>
          u.id === contactId ||
          u.username.toLowerCase() === contactId.toLowerCase()
      ) || {
        id: contactId,
        name: contactId,
        username: contactId,
        avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(contactId)}`,
        bio: "",
        isOnline: false,
      }
    );
  }, [registeredUsers, onlineUsers, contactId]);

  const existingAlias = contactAliases[contactUser.id] || contactAliases[contactUser.username] || "";

  // Find conversation
  const conv = conversations.find(
    (c) =>
      !c.isGroup &&
      (c.participant?.id === contactUser.id ||
        c.participant?.username?.toLowerCase() === contactUser.username?.toLowerCase() ||
        c.participantIds?.includes(contactUser.id))
  );

  const contactMessages = conv ? messages[conv.id] || [] : [];

  // 1. Media
  const contactMedia = useMemo(() => {
    const list: Array<{ id: string; url: string; type: "image" | "video"; createdAt: string }> = [];
    contactMessages.forEach((m) => {
      if (m.type === "image") {
        if (m.mediaUrls && m.mediaUrls.length > 0) {
          m.mediaUrls.forEach((u, i) => list.push({ id: `${m.id}-${i}`, url: u, type: "image", createdAt: m.createdAt }));
        } else if (m.mediaUrl) {
          list.push({ id: m.id, url: m.mediaUrl, type: "image", createdAt: m.createdAt });
        }
      }
    });
    return list;
  }, [contactMessages]);

  // 2. Links
  const contactLinks = useMemo(() => {
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    const list: Array<{ id: string; url: string; createdAt: string }> = [];
    contactMessages.forEach((m) => {
      const matches = m.content?.match(linkRegex);
      if (matches) {
        matches.forEach((u, i) => list.push({ id: `${m.id}-link-${i}`, url: u, createdAt: m.createdAt }));
      }
    });
    return list;
  }, [contactMessages]);

  // 3. Docs
  const contactDocs = useMemo(() => {
    return contactMessages.filter((m) => m.type === "file" && m.mediaUrl);
  }, [contactMessages]);

  const isBlocked = blockedUsers.some((u) => u.id === contactUser.id || u.username === contactUser.username);

  const handleSaveAlias = () => {
    setContactAlias(contactUser.id, aliasDraft.trim());
    if (contactUser.username) {
      setContactAlias(contactUser.username, aliasDraft.trim());
    }
    setIsEditingAlias(false);
    showToast(aliasDraft.trim() ? "Nama alias berhasil disimpan" : "Alias dihapus");
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

  const displayName = existingAlias || contactUser.name;

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
          <h1 className="font-bold text-base sm:text-lg">Info Kontak</h1>
        </div>
      </header>

      {/* Hero Contact Info */}
      <div className="p-6 flex flex-col items-center justify-center border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
        <img
          src={contactUser.avatarUrl}
          alt={displayName}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover shadow-xl border-4 border-white dark:border-slate-800"
        />

        <div className="mt-4 text-center">
          {isEditingAlias ? (
            <div className="flex items-center justify-center gap-2">
              <input
                type="text"
                value={aliasDraft}
                onChange={(e) => setAliasDraft(e.target.value)}
                placeholder="Nama alias lokal..."
                className="px-3 py-1.5 text-sm rounded-xl border border-blue-500 bg-white dark:bg-slate-800 outline-none font-bold text-center"
              />
              <button
                type="button"
                onClick={handleSaveAlias}
                className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditingAlias(false)}
                className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <h2 className="font-extrabold text-xl text-slate-900 dark:text-slate-100">
                {displayName}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setAliasDraft(existingAlias || contactUser.name);
                  setIsEditingAlias(true);
                }}
                title="Edit Nama Kontak (Alias)"
                className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-sky-400"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            @{contactUser.username} {existingAlias && `(Asli: ${contactUser.name})`}
          </p>

          {/* Quick Profile Navigation & Chat Button */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <Link
              href={`/profile/${contactUser.username}`}
              className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-sky-400/10 text-blue-600 dark:text-sky-400 border border-blue-200 dark:border-sky-400/20 text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Lihat Profil Akun</span>
            </Link>

            <button
              type="button"
              onClick={() => router.push("/messages")}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Buka Chat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs: Media, Links, Docs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {[
          { id: "media", label: `Media (${contactMedia.length})`, icon: ImageIcon },
          { id: "links", label: `Link (${contactLinks.length})`, icon: LinkIcon },
          { id: "docs", label: `Dokumen (${contactDocs.length})`, icon: FileText },
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

      {/* Tab Contents with Independent Scrollbox (Windows & Mobile Ergonomics) */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 max-h-[360px] overflow-y-auto">
        {activeTab === "media" && (
          <div>
            {contactMedia.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                {contactMedia.map((item) => (
                  <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:opacity-90 transition-opacity">
                    <MediaRenderer src={item.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-center text-slate-400 py-6">Belum ada media dibagikan dalam obrolan ini.</p>
            )}
          </div>
        )}

        {activeTab === "links" && (
          <div className="space-y-2">
            {contactLinks.length > 0 ? (
              contactLinks.map((item) => {
                let domain = "";
                try {
                  domain = new URL(item.url).hostname.replace("www.", "");
                } catch {
                  domain = "tautan luar";
                }
                return (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-blue-500/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                      <LinkIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-sky-400">
                          {domain}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:underline">
                        {item.url}
                      </p>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {formatTimestamp(item.createdAt)}
                      </span>
                    </div>
                  </a>
                );
              })
            ) : (
              <p className="text-xs text-center text-slate-400 py-6">Belum ada link dibagikan dalam obrolan ini.</p>
            )}
          </div>
        )}

        {activeTab === "docs" && (
          <div className="space-y-2">
            {contactDocs.length > 0 ? (
              contactDocs.map((item) => {
                const ext = (item.fileName?.split(".").pop() || "DOC").toUpperCase().slice(0, 4);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-blue-500/40 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-xs">
                        {ext}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {item.fileName || "Dokumen"}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {ext} • {item.fileSize || "Berkas"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadDoc(item.mediaUrl!, item.fileName || "dokumen")}
                      className="p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-sky-400 transition-colors ml-2 shrink-0 active:scale-95"
                      title="Unduh berkas"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-center text-slate-400 py-6">Belum ada dokumen dibagikan dalam obrolan ini.</p>
            )}
          </div>
        )}
      </div>

      {/* Privacy & Danger Actions */}
      <div className="p-4 space-y-3">
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Privasi & Keamanan Kontak
        </h4>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              if (isBlocked) {
                unblockUser(contactUser.id);
                showToast(`Kontak @${contactUser.username} berhasil dibuka blokirnya`);
              } else {
                if (confirm(`Blokir kontak @${contactUser.username}? Mereka tidak akan bisa mengirim pesan lagi.`)) {
                  blockUser({
                    id: contactUser.id,
                    name: contactUser.name,
                    username: contactUser.username,
                    avatarUrl: contactUser.avatarUrl,
                  });
                  showToast(`Kontak @${contactUser.username} telah diblokir`);
                }
              }
            }}
            className="w-full py-3 px-4 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-bold text-xs sm:text-sm border border-red-200 dark:border-red-900/40 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
          >
            <Ban className="w-4 h-4" />
            <span>{isBlocked ? "Buka Blokir Kontak" : "Blokir Kontak"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              showToast("Laporan telah dikirim ke tim keamanan ConnectReal.");
            }}
            className="w-full py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Laporkan Kontak</span>
          </button>
        </div>
      </div>
    </div>
  );
}

