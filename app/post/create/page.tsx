"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Image as ImageIcon,
  Video,
  X,
  Share2,
  Smile,
  Sparkles,
  Users,
  Check,
  Plus,
  Play,
  Film,
  Music2,
} from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { MusicPickerModal } from "@/components/music/MusicPickerModal";
import { MusicTrack } from "@/lib/types";
import { cn } from "@/lib/utils";
import { saveMediaFile } from "@/lib/db/mediaStorage";
import { uploadMediaFile } from "@/lib/utils/mediaUpload";
import { MediaRenderer } from "@/components/media/MediaRenderer";

// Filter Styles & Names
export const POST_FILTERS = [
  { id: "normal", label: "Normal", css: "none" },
  { id: "fade", label: "Fade", css: "contrast(90%) brightness(105%) saturate(80%)" },
  { id: "paris", label: "Paris", css: "contrast(105%) brightness(110%) saturate(115%) sepia(10%)" },
  { id: "simple", label: "Simple", css: "contrast(100%) brightness(102%)" },
  { id: "midnight", label: "Midnight", css: "contrast(120%) brightness(85%) hue-rotate(190deg) saturate(110%)" },
  { id: "jakarta", label: "Jakarta", css: "contrast(115%) brightness(105%) sepia(25%) saturate(125%)" },
  { id: "vivid", label: "Vivid", css: "contrast(125%) saturate(140%)" },
  { id: "vintage", label: "Vintage", css: "sepia(45%) contrast(95%) brightness(95%)" },
  { id: "noir", label: "Noir", css: "grayscale(100%) contrast(120%)" },
];

const EMOJIS = ["😀", "😂", "😍", "🥳", "😎", "🚀", "🔥", "✨", "❤️", "👍", "🙌", "💯", "🎉", "💡", "☕", "🌟"];

interface SelectedMedia {
  id: string;
  url: string;
  type: "image" | "video";
}

export default function CreatePostPage() {
  const router = useRouter();
  const { currentUser, addPost, onlineUsers } = useAppStore();

  const [content, setContent] = useState("");
  const [mediaList, setMediaList] = useState<SelectedMedia[]>([]);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState("normal");
  const [taggedUsers, setTaggedUsers] = useState<string[]>([]);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [selectedMusicTrack, setSelectedMusicTrack] = useState<MusicTrack | null>(null);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper kompresi gambar client-side untuk menghemat storage browser
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newMedias: SelectedMedia[] = [];

    for (const file of files) {
      try {
        const uploadedUrl = await uploadMediaFile(file);
        const mediaId = "media_post_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
        newMedias.push({
          id: mediaId,
          url: uploadedUrl,
          type: file.type.startsWith("video/") ? "video" : "image",
        });
      } catch {
        if (file.type.startsWith("image/")) {
          const compressedUrl = await compressImage(file);
          const mediaId = "image_post_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
          const persistentKey = await saveMediaFile(mediaId, compressedUrl);
          newMedias.push({
            id: mediaId,
            url: persistentKey,
            type: "image",
          });
        } else if (file.type.startsWith("video/")) {
          const mediaId = "video_post_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
          const persistentKey = await saveMediaFile(mediaId, file);
          newMedias.push({
            id: mediaId,
            url: persistentKey,
            type: "video",
          });
        }
      }
    }

    setMediaList((prev) => [...prev, ...newMedias]);
    if (mediaList.length === 0 && newMedias.length > 0) {
      setActiveMediaIndex(0);
    }
  };

  const removeMedia = (index: number) => {
    setMediaList((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (activeMediaIndex >= updated.length) {
        setActiveMediaIndex(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  };

  const toggleTagUser = (username: string) => {
    setTaggedUsers((prev) =>
      prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username]
    );
  };

  const handleShare = () => {
    if (!content.trim() && mediaList.length === 0) return;
    setIsSubmitting(true);

    const mediaUrls = mediaList.map((m) => m.url);
    const primaryMedia = mediaUrls[0];

    addPost(
      content.trim(),
      primaryMedia,
      mediaUrls,
      activeFilter,
      taggedUsers,
      selectedMusicTrack || undefined
    );

    setTimeout(() => {
      setIsSubmitting(false);
      router.push("/");
    }, 300);
  };

  const activeMedia = mediaList[activeMediaIndex];
  const activeFilterCss = POST_FILTERS.find((f) => f.id === activeFilter)?.css || "none";

  const filteredUsersToTag = onlineUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.name.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 flex flex-col justify-start">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Batal dan kembali ke beranda"
            className="p-2 -ml-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-base sm:text-lg leading-tight">Buat Postingan Baru</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Foto, Video, Filter & Tandai Teman
            </p>
          </div>
        </div>

        {/* Share Button Header */}
        <button
          type="button"
          onClick={handleShare}
          disabled={(!content.trim() && mediaList.length === 0) || isSubmitting}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>{isSubmitting ? "Membagikan..." : "Bagikan"}</span>
        </button>
      </header>

      {/* Main Studio Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Author Info */}
        <div className="flex items-center gap-3">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/30"
          />
          <div>
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 block">
              {currentUser.name}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              @{currentUser.username} • Publik
            </span>
          </div>
        </div>

        {/* Caption Input */}
        <div className="space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tuliskan sesuatu tentang momen ini..."
            rows={3}
            className="w-full text-sm sm:text-base p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111827] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors resize-none"
          />

          {/* Quick Emoji Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
              <Smile className="w-3.5 h-3.5" /> Emoji:
            </span>
            {EMOJIS.map((emoji, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setContent((prev) => prev + emoji)}
                className="text-base p-1 hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Media Preview & Active Display */}
        {mediaList.length > 0 ? (
          <div className="space-y-4">
            {/* Active Media Big View with Filter Applied */}
            <div className="relative w-full max-h-[460px] sm:max-h-[520px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black flex items-center justify-center">
              <MediaRenderer
                src={activeMedia?.url || ""}
                forceType={activeMedia?.type}
                controls
                playsInline
                className="max-h-[500px] w-full object-contain"
                style={{ filter: activeFilterCss }}
              />

              {/* Active Filter Label Badge */}
              {activeFilter !== "normal" && (
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Filter: {POST_FILTERS.find((f) => f.id === activeFilter)?.label}</span>
                </div>
              )}
            </div>

            {/* Thumbnail Carousel Bar */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {mediaList.map((media, idx) => (
                <div
                  key={media.id}
                  onClick={() => setActiveMediaIndex(idx)}
                  className={cn(
                    "relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer transition-all",
                    activeMediaIndex === idx
                      ? "border-blue-600 scale-105 shadow-md"
                      : "border-slate-300 dark:border-slate-700 opacity-70 hover:opacity-100"
                  )}
                >
                  <MediaRenderer
                    src={media.url}
                    forceType={media.type}
                    className="w-full h-full object-cover"
                  />
                  {media.type === "video" && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                      <Play className="w-5 h-5 text-white" />
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMedia(idx);
                    }}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-white hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Add More Media Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-blue-600 hover:border-blue-500 transition-colors shrink-0"
              >
                <Plus className="w-5 h-5" />
                <span className="text-[10px] font-semibold">Tambah</span>
              </button>
            </div>

            {/* Filter Selector (Fade, Paris, Simple, Midnight, Jakarta, dll.) */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111827] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Pilih Filter Visual:
                </span>
                <span className="text-[11px] text-slate-400 capitalize">
                  {POST_FILTERS.find((f) => f.id === activeFilter)?.label}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                {POST_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setActiveFilter(f.id)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all text-center",
                      activeFilter === f.id
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 font-bold shadow-xs"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400"
                    )}
                  >
                    {/* Filter mini preview square */}
                    <div
                      className="w-10 h-10 rounded-lg bg-cover bg-center border border-slate-300 dark:border-slate-600"
                      style={{
                        backgroundImage: activeMedia?.type === "image" ? `url(${activeMedia.url})` : "none",
                        backgroundColor: activeMedia?.type === "video" ? "#1e293b" : "#3b82f6",
                        filter: f.css,
                      }}
                    />
                    <span className="text-[11px] leading-tight">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Empty Media Picker State */
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-8 sm:p-12 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50 dark:bg-[#111827]/50 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors group"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Film className="w-7 h-7" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                Pilih Foto atau Video
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                Bisa memilih 1 atau lebih berkas sekaligus dari galeri perangkat atau PC Anda.
              </p>
            </div>
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              Jelajahi Berkas
            </button>
          </div>
        )}

        {/* Hidden File Picker Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFilesSelected}
          className="hidden"
        />

        {/* Tagged Friends Section */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111827] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-500" />
              Tandai Orang / Kontak:
            </span>
            <button
              type="button"
              onClick={() => setShowTagSelector(!showTagSelector)}
              className="text-xs font-semibold text-blue-600 dark:text-sky-400 hover:underline"
            >
              {showTagSelector ? "Tutup Pilihan" : "+ Tandai Teman"}
            </button>
          </div>

          {/* Selected Tag Pills */}
          {taggedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {taggedUsers.map((u) => (
                <span
                  key={u}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800"
                >
                  @{u}
                  <button
                    type="button"
                    onClick={() => toggleTagUser(u)}
                    className="p-0.5 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Tag Selector Drawer */}
          {showTagSelector && (
            <div className="pt-2 space-y-2 border-t border-slate-200 dark:border-slate-700">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Cari username atau nama..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
              <div className="max-h-40 overflow-y-auto space-y-1">
                {filteredUsersToTag.map((user) => {
                  const isTagged = taggedUsers.includes(user.username);
                  return (
                    <div
                      key={user.id}
                      onClick={() => toggleTagUser(user.username)}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors text-xs",
                        isTagged
                          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 font-semibold"
                          : "hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span>{user.name}</span>
                        <span className="text-slate-400 text-[11px]">@{user.username}</span>
                      </div>
                      {isTagged && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Music Track Section */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111827] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Music2 className="w-4 h-4 text-pink-500" />
              Musik Latar & Lirik Beat:
            </span>
            <button
              type="button"
              onClick={() => setShowMusicPicker(true)}
              className="text-xs font-semibold text-pink-600 dark:text-pink-400 hover:underline cursor-pointer"
            >
              {selectedMusicTrack ? "Ganti Lagu" : "+ Tambah Musik"}
            </button>
          </div>

          {selectedMusicTrack ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 border border-pink-200 dark:border-pink-800/40">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center shrink-0">
                  <Music2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {selectedMusicTrack.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {selectedMusicTrack.artist} • Lirik Sinkronisasi Aktif
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMusicTrack(null)}
                className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 hover:text-red-500 transition-colors"
                title="Hapus lagu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Pilih dari perpustakaan audio bebas royalti atau unggah berkas audio sendiri. Dilengkapi lirik yang beranimasi mengikuti ketukan nada musik!
            </p>
          )}
        </div>

        {/* Big Bottom Share Action for Convenience */}
        <div className="pt-4 pb-12">
          <button
            type="button"
            onClick={handleShare}
            disabled={(!content.trim() && mediaList.length === 0) || isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-sm sm:text-base shadow-xl shadow-blue-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Share2 className="w-5 h-5" />
            <span>{isSubmitting ? "Sedang Membagikan..." : "Bagikan Postingan Sekarang"}</span>
          </button>
        </div>
      </main>

      {showMusicPicker && (
        <MusicPickerModal
          isOpen={showMusicPicker}
          selectedTrackId={selectedMusicTrack?.id}
          onSelectTrack={(track) => {
            setSelectedMusicTrack(track);
            setShowMusicPicker(false);
          }}
          onClose={() => setShowMusicPicker(false)}
        />
      )}
    </div>
  );
}

