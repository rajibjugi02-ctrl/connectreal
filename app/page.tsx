"use client";

export const dynamic = "force-dynamic";

import React, { useState, useMemo } from "react";
import { StoriesBar } from "@/components/feed/StoriesBar";
import { CreatePostBox } from "@/components/feed/CreatePostBox";
import { PostCard } from "@/components/feed/PostCard";
import { useAppStore } from "@/lib/store/useAppStore";
import { useTranslation } from "@/lib/i18n/translations";
import { Sparkles } from "lucide-react";

export default function HomePage() {
  const { posts, currentUser, onlineUsers, registeredUsers } = useAppStore();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"forYou" | "following">("forYou");

  const displayedPosts = useMemo(() => {
    const clean = posts.filter((p) => {
      if (p.id === "p-1" || p.id === "p-2") return false;
      if (typeof p.content === "string" && p.content.includes("Pembaruan layout 3 kolom ConnectReal")) return false;

      // Filter out posts from private accounts if viewer is not following and not the author
      if (p.author.id !== currentUser.id) {
        const reg = registeredUsers.find(
          (u) => u.id === p.author.id || u.username.toLowerCase() === p.author.username.toLowerCase()
        );
        const online = onlineUsers.find(
          (u) => u.id === p.author.id || u.username.toLowerCase() === p.author.username.toLowerCase()
        );
        const isPrivate = reg?.isPrivate ?? online?.isPrivate ?? false;
        const isFollowing = reg?.isFollowing ?? online?.isFollowing ?? false;
        if (isPrivate && !isFollowing) {
          return false;
        }
      }

      return true;
    });

    if (activeTab === "forYou") return clean;
    return clean.filter((p) => {
      if (p.author.id === currentUser.id) return true;
      return (
        onlineUsers.some((u) => u.id === p.author.id && u.isFollowing) ||
        registeredUsers.some((u) => u.id === p.author.id && u.isFollowing)
      );
    });
  }, [activeTab, posts, currentUser.id, onlineUsers, registeredUsers]);

  return (
    <div className="w-full">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-[#E2E8F0] dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="font-bold text-lg text-[#0F172A] dark:text-slate-100">
            {t.feedHeader}
          </h1>
          <div className="p-1 rounded-lg text-[#64748B] dark:text-slate-400">
            <Sparkles className="w-4 h-4 text-[#2563EB] dark:text-sky-400" />
          </div>
        </div>

        {/* Feed Segment Tabs */}
        <div className="flex border-t border-[#E2E8F0] dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("forYou")}
            className={`flex-1 py-3 text-sm font-bold text-center transition-colors relative ${
              activeTab === "forYou"
                ? "text-[#0F172A] dark:text-slate-100"
                : "text-[#64748B] dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/[0.04]"
            }`}
          >
            Untuk Anda
            {activeTab === "forYou" && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#2563EB] dark:bg-sky-400 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("following")}
            className={`flex-1 py-3 text-sm font-bold text-center transition-colors relative ${
              activeTab === "following"
                ? "text-[#0F172A] dark:text-slate-100"
                : "text-[#64748B] dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/[0.04]"
            }`}
          >
            Mengikuti
            {activeTab === "following" && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#2563EB] dark:bg-sky-400 rounded-full" />
            )}
          </button>
        </div>
      </header>

      {/* Horizontal Online Stories Carousel */}
      <StoriesBar />

      {/* Box Buat Postingan Baru */}
      <CreatePostBox />

      {/* Daftar Postingan (Feed Timeline) */}
      <div className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
        {displayedPosts.length > 0 ? (
          displayedPosts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <div className="p-12 text-center text-[#64748B] dark:text-slate-400">
            <p className="text-base font-semibold">Belum ada postingan di tab ini.</p>
            <p className="text-xs mt-1">
              Bagikan pembaruan atau ide Anda melalui formulir di atas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
