"use client";

import React, { useState } from "react";
import { X, Trash2, Heart, Eye, MessageCircle, AlertCircle } from "lucide-react";
import { StoryItem, MessageItem } from "@/lib/types";
import { formatTimestamp, cn } from "@/lib/utils";

interface StoryViewersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stories: StoryItem[];
  activeStoryId: string;
  onSelectStory: (storyId: string) => void;
  onDeleteStory: (storyId: string) => void;
  allMessages?: Record<string, MessageItem[]>;
}

export function StoryViewersDrawer({
  isOpen,
  onClose,
  stories,
  activeStoryId,
  onSelectStory,
  onDeleteStory,
  allMessages = {},
}: StoryViewersDrawerProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeStory = stories.find((s) => s.id === activeStoryId) || stories[0];
  if (!activeStory) return null;

  // Cari balasan pesan (story replies) untuk story aktif
  const storyReplies: MessageItem[] = [];
  Object.values(allMessages).forEach((convMsgs) => {
    convMsgs.forEach((msg) => {
      if (msg.storyReply?.storyId === activeStory.id) {
        storyReplies.push(msg);
      }
    });
  });

  const viewers = activeStory.viewers || [];
  const viewersCount = viewers.length || activeStory.viewsCount || 0;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg mx-auto bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-250 text-white overflow-hidden"
      >
        {/* Grab Handle */}
        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mt-3 mb-1 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-sm tracking-wide">Aktivitas Cerita</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* Top Gallery Carousel: Cerita Saya Hari Ini */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-slate-400">Cerita Anda ({stories.length})</span>
              {deleteConfirmId === activeStory.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-red-400 font-medium">Hapus cerita ini?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteStory(activeStory.id);
                      setDeleteConfirmId(null);
                    }}
                    className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-red-600 hover:bg-red-700 text-white"
                  >
                    Ya
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(null)}
                    className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(activeStory.id)}
                  title="Hapus cerita aktif"
                  className="flex items-center gap-1 text-[11px] font-semibold text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 no-scrollbar">
              {stories.map((story) => {
                const isSelected = story.id === activeStory.id;
                return (
                  <button
                    key={story.id}
                    type="button"
                    onClick={() => onSelectStory(story.id)}
                    className={cn(
                      "relative w-20 h-28 rounded-2xl overflow-hidden shrink-0 transition-all border-2 group",
                      isSelected
                        ? "border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.5)] scale-105"
                        : "border-slate-800 opacity-60 hover:opacity-90"
                    )}
                  >
                    {story.mediaType === "video" ? (
                      <video
                        src={story.mediaUrl}
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <img
                        src={story.mediaUrl}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-1 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between text-[10px] text-white">
                      <div className="flex items-center gap-0.5">
                        <Eye className="w-2.5 h-2.5 text-sky-400" />
                        <span>{story.viewers?.length || story.viewsCount || 0}</span>
                      </div>
                      <span>{formatTimestamp(story.createdAt)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 1: Balasan Cerita (Story Replies) */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Balasan Cerita ({storyReplies.length})</span>
            </div>

            {storyReplies.length > 0 ? (
              <div className="space-y-2">
                {storyReplies.map((reply) => (
                  <div
                    key={reply.id}
                    className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white shrink-0">
                      {reply.senderId.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">
                          {reply.storyReply?.authorUsername ? `@${reply.storyReply.authorUsername}` : "Pengguna"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatTimestamp(reply.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 mt-1">{reply.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-800 text-center text-xs text-slate-500">
                Belum ada balasan untuk cerita ini
              </div>
            )}
          </div>

          {/* Section 2: Penonton Cerita (Story Viewers List) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-sky-400" />
                <span>Dilihat oleh {viewersCount} orang</span>
              </div>
            </div>

            {viewers.length > 0 ? (
              <div className="divide-y divide-slate-800 rounded-2xl bg-slate-800/40 border border-slate-800 overflow-hidden">
                {viewers.map((viewer) => (
                  <div
                    key={viewer.id || viewer.userId || viewer.username}
                    className="flex items-center justify-between p-3 hover:bg-slate-800/70 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={viewer.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                        alt={viewer.name}
                        className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-slate-700"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-white truncate">
                          {viewer.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          @{viewer.username}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-[10px] text-slate-400">
                        {viewer.viewedAt ? formatTimestamp(viewer.viewedAt) : "Baru saja"}
                      </span>
                      {viewer.hasLiked && (
                        <div title="Menyukai cerita ini">
                          <Heart className="w-4 h-4 fill-red-500 text-red-500 animate-pulse" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-800 text-center text-xs text-slate-500">
                Belum ada pengguna yang melihat cerita ini
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
