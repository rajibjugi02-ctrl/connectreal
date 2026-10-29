"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Image as ImageIcon, Smile, X, Send, Sparkles } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useTranslation } from "@/lib/i18n/translations";
import { saveMediaFile } from "@/lib/db/mediaStorage";
import { uploadMediaFile } from "@/lib/utils/mediaUpload";
import { MediaRenderer } from "@/components/media/MediaRenderer";

export function CreatePostBox() {
  const { currentUser, addPost } = useAppStore();
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const EMOJIS = [
    "😀", "😂", "😍", "🥳", "😎", "🚀", "🔥", "✨", "❤️", "👍",
    "🙌", "💯", "👏", "🎉", "💡", "💻", "☕", "🍕", "🌈", "⭐",
    "⚡", "🤔", "👀", "🫡", "💪", "🤙", "🎯", "🏆", "💎", "🌟"
  ];

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  const handleSelectEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const uploadedUrl = await uploadMediaFile(file);
        setMediaUrl(uploadedUrl);
      } catch {
        try {
          const isVid = file.type.startsWith("video/");
          const mediaKey = `${isVid ? "video" : "image"}_post_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          const savedKey = await saveMediaFile(mediaKey, file);
          setMediaUrl(savedKey);
        } catch (err) {
          console.error("Gagal memproses media postingan:", err);
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !mediaUrl.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      addPost(content.trim(), mediaUrl.trim() || undefined);
      setContent("");
      setMediaUrl("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsSubmitting(false);
    }, 250);
  };

  return (
    <div className="border-b border-[#E2E8F0] dark:border-slate-800 p-4 bg-white dark:bg-slate-900">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <img
          src={currentUser.avatarUrl}
          alt={currentUser.name}
          className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-[#2563EB]/20 dark:ring-sky-400/20"
        />

        <div className="flex-1 min-w-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t.feedPlaceholder}
            rows={3}
            className="w-full resize-none bg-transparent text-sm sm:text-base text-[#0F172A] dark:text-slate-100 placeholder-[#64748B] dark:placeholder-slate-400 border-0 focus:outline-hidden focus:ring-0"
          />

          {/* Native Local Media Preview */}
          {mediaUrl && (
            <div className="relative mt-2 mb-3 rounded-2xl overflow-hidden border border-[#E2E8F0] dark:border-slate-700 max-h-72 bg-black/5 dark:bg-black/30">
              <MediaRenderer
                src={mediaUrl}
                alt="Pratinjau lampiran media"
                className="w-full h-auto object-cover max-h-72"
              />
              <button
                type="button"
                onClick={() => {
                  setMediaUrl("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                aria-label="Hapus media"
                className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Hidden Native File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Action Toolbar */}
          <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0] dark:border-slate-800">
            <div className="flex items-center gap-1 text-[#2563EB] dark:text-sky-400">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title={t.feedAttachPhoto}
                aria-label={t.feedAttachPhoto}
                className="p-2 rounded-xl hover:bg-[#2563EB]/10 dark:hover:bg-sky-400/10 transition-colors focus-visible:ring-2 focus-visible:ring-[#2563EB] dark:focus-visible:ring-sky-400"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              {/* Real Emoji Picker Popover */}
              <div className="relative" ref={emojiPickerRef}>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  aria-label="Sisipkan emoji"
                  title="Pilih Emoji"
                  className="p-2 rounded-xl hover:bg-[#2563EB]/10 dark:hover:bg-sky-400/10 transition-colors focus-visible:ring-2 focus-visible:ring-[#2563EB] dark:focus-visible:ring-sky-400"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {showEmojiPicker && (
                  <div className="absolute left-0 bottom-full mb-2 z-40 p-2.5 w-64 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 px-1">
                      Pilih Emoji
                    </div>
                    <div
                      className="grid grid-cols-6 gap-1 max-h-44 overflow-y-auto"
                      style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", sans-serif' }}
                    >
                      {EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleSelectEmoji(emoji)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-125 transition-transform text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Link
                href="/post/create"
                title="Buka Studio Postingan (Multi Foto/Video & Filter)"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-50 dark:bg-sky-400/10 text-blue-600 dark:text-sky-400 hover:bg-blue-100 dark:hover:bg-sky-400/20 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Studio Filter & Video</span>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-[#64748B] dark:text-slate-400">
                {280 - content.length}
              </span>
              <button
                type="submit"
                disabled={(!content.trim() && !mediaUrl.trim()) || isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-600 dark:bg-sky-500 dark:hover:bg-sky-600 text-white font-bold text-sm shadow-xs active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[#2563EB] dark:focus-visible:ring-sky-400"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? t.feedPosting : t.feedPostBtn}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
