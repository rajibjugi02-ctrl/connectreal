"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useTranslation } from "@/lib/i18n/translations";
import { PostCard } from "@/components/feed/PostCard";

export default function BookmarksPage() {
  const { posts } = useAppStore();
  const { t } = useTranslation();

  const bookmarkedPosts = posts.filter((p) => p.isBookmarked);

  return (
    <div className="w-full min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Kembali ke Beranda"
            className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-base sm:text-lg">{t.bookmarksTitle}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {bookmarkedPosts.length} {t.bookmarksSubtitle}
            </p>
          </div>
        </div>
      </header>

      {/* Bookmarked Stream */}
      <div className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
        {bookmarkedPosts.length > 0 ? (
          bookmarkedPosts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <div className="py-24 px-6 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 dark:bg-sky-400/10 text-blue-600 dark:text-sky-400 mx-auto flex items-center justify-center shadow-xs">
              <Bookmark className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t.bookmarksEmptyTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                {t.bookmarksEmptyDesc}
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white shadow-xs active:scale-95 transition-all"
            >
              Jelajahi Linimasa
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
