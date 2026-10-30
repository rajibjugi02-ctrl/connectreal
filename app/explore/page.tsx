"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  X,
  History,
  TrendingUp,
  UserPlus,
  Check,
  MessageSquare,
  Newspaper,
  Flame,
  FileText,
  ExternalLink,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useTranslation } from "@/lib/i18n/translations";
import { cn, formatTimestamp } from "@/lib/utils";
import { MediaRenderer } from "@/components/media/MediaRenderer";
import { extractTrendsFromPosts } from "@/lib/utils/hashtagParser";

const isVideoMedia = (url?: string) => {
  if (!url) return false;
  return (
    url.startsWith("data:video/") ||
    url.endsWith(".mp4") ||
    url.endsWith(".webm") ||
    url.endsWith(".ogg") ||
    url.includes("blob:") ||
    url.includes("video")
  );
};

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const { t } = useTranslation();

  const {
    onlineUsers,
    registeredUsers,
    currentUser,
    posts,
    trends,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    toggleFollowUser,
    setActiveConversationId,
    setIsMobileChatOpen,
    getOrCreateConversation,
  } = useAppStore();

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<"all" | "users" | "news" | "posts">("all");

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      if (query.trim()) {
        addRecentSearch(query.trim());
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query, addRecentSearch]);

  // Sync with URL query parameter
  useEffect(() => {
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery);
      setDebouncedQuery(initialQuery);
    }
  }, [initialQuery]);

  const q = debouncedQuery.toLowerCase().trim();

  // Gabungkan seluruh pengguna online dan akun terdaftar agar selalu dapat dicari
  const allUsers = useMemo(() => {
    const list: typeof onlineUsers = [...onlineUsers];
    registeredUsers.forEach((reg) => {
      if (!list.some((u) => u.username.toLowerCase() === reg.username.toLowerCase())) {
        list.push({
          id: reg.id,
          name: reg.name,
          username: reg.username,
          email: reg.email,
          avatarUrl: reg.avatarUrl,
          bannerUrl: reg.bannerUrl || "",
          bio: reg.bio || "",
          isOnline: true,
          followersCount: reg.followersCount || 0,
          followingCount: reg.followingCount || 0,
          postsCount: reg.postsCount || 0,
        });
      }
    });
    return list.filter((u) => u.username.toLowerCase() !== currentUser.username.toLowerCase());
  }, [onlineUsers, registeredUsers, currentUser.username]);

  // Filter Users
  const filteredUsers = useMemo(() => {
    if (!q) return allUsers;
    return allUsers.filter((u) => {
      return (
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.bio && u.bio.toLowerCase().includes(q))
      );
    });
  }, [allUsers, q]);

  // Dynamic Trends from User Posts (Murni dari postingan pengguna, tanpa dummy)
  const allTrends = useMemo(() => extractTrendsFromPosts(posts), [posts]);
  const filteredTrends = useMemo(() => {
    if (!q) return allTrends;
    return allTrends.filter((item) => {
      return (
        item.hashtag.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [allTrends, q]);

  // Filter Posts
  const filteredPosts = useMemo(() => {
    if (!q) return posts.slice(0, 5);
    return posts.filter((p) => {
      return (
        p.content.toLowerCase().includes(q) ||
        p.author.name.toLowerCase().includes(q) ||
        p.author.username.toLowerCase().includes(q)
      );
    });
  }, [posts, q]);

  const handleStartChat = (username: string) => {
    const target = filteredUsers.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );
    if (target) {
      const convId = getOrCreateConversation(target);
      setActiveConversationId(convId);
      setIsMobileChatOpen(true);
    }
    router.push("/messages");
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 pb-20 transition-colors duration-200">
      {/* Sticky Search Header */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-3 sm:p-4 space-y-3">
        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari kontak, berita, topik tren, atau postingan..."
            className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111827] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-blue-600 outline-none transition-all shadow-2xs"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setDebouncedQuery("");
              }}
              aria-label="Bersihkan pencarian"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
          {[
            { id: "all", label: "Semua Hasil" },
            { id: "users", label: `Pengguna (${filteredUsers.length})` },
            { id: "news", label: `Tren Tagar (${filteredTrends.length})` },
            { id: "posts", label: `Postingan (${filteredPosts.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all shrink-0 active:scale-95",
                activeTab === tab.id
                  ? "bg-blue-600 dark:bg-blue-500 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 sm:p-5 space-y-6 w-full">
        {/* Recent Search Chips (if no query) */}
        {!query && recentSearches.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                Pencarian Terakhir
              </span>
              <button
                type="button"
                onClick={clearRecentSearches}
                className="hover:text-red-500 transition-colors"
              >
                Hapus
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((item) => (
                <div
                  key={item}
                  onClick={() => setQuery(item)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-all active:scale-95"
                >
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecentSearch(item);
                    }}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 1. SEKSI PENGGUNA & KONTAK */}
        {(activeTab === "all" || activeTab === "users") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Pengguna & Kontak</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                  {filteredUsers.length}
                </span>
              </h3>
            </div>

            {filteredUsers.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">Tidak ada pengguna yang cocok.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    <Link
                      href={`/profile/${user.username}`}
                      className="flex items-center gap-3 min-w-0 group"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-11 h-11 rounded-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {user.isOnline && (
                          <div
                            title="Online"
                            className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate group-hover:underline">
                          {user.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          @{user.username}
                        </div>
                        {user.bio && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate mt-0.5 max-w-[170px]">
                            {user.bio}
                          </p>
                        )}
                      </div>
                    </Link>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => toggleFollowUser(user.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95",
                          user.isFollowing
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-red-500 border border-slate-200 dark:border-slate-700"
                            : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                        )}
                      >
                        {user.isFollowing ? "Batal Ikuti" : "Ikuti"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartChat(user.username)}
                        aria-label="Kirim pesan"
                        title="Kirim pesan"
                        className="p-1.5 rounded-xl text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. SEKSI TOPIK TREN PENGGUNA (#HASHTAG) */}
        {(activeTab === "all" || activeTab === "news") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Tren Tagar Terkini</span>
                {filteredTrends.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                    {filteredTrends.length}
                  </span>
                )}
              </h3>
            </div>

            {filteredTrends.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredTrends.map((trend) => (
                  <div
                    key={trend.id}
                    onClick={() => {
                      addRecentSearch(trend.hashtag);
                      setQuery(trend.hashtag);
                    }}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs hover:border-blue-500/50 cursor-pointer transition-all space-y-1.5 group active:scale-[0.99]"
                  >
                    <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      {trend.category}
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {trend.hashtag}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {trend.postsCount}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 px-4 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
                <TrendingUp className="w-7 h-7 text-slate-400 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Belum ada tagar yang tren saat ini
                </p>
              </div>
            )}
          </div>
        )}

        {/* 3. SEKSI POSTINGAN FEED */}
        {(activeTab === "all" || activeTab === "posts") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                <span>Postingan Terkait</span>
              </h3>
            </div>

            {filteredPosts.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">Tidak ada postingan yang sesuai.</p>
            ) : (
              <div className="space-y-3">
                {filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/profile/${post.author.username}`}
                        className="flex items-center gap-2.5 group"
                      >
                        <img
                          src={post.author.avatarUrl}
                          alt={post.author.name}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:underline">
                            {post.author.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            @{post.author.username}
                          </div>
                        </div>
                      </Link>
                      <span className="text-[10px] text-slate-400">
                        {formatTimestamp(post.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                      {post.content}
                    </p>

                    {(() => {
                      const mediaSrc = post.mediaUrls?.[0] || post.mediaUrl;
                      if (!mediaSrc || typeof mediaSrc !== "string" || !mediaSrc.trim() || mediaSrc === "undefined" || mediaSrc === "null") {
                        return null;
                      }

                      return (
                        <div className="rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800/80 bg-slate-900/5 dark:bg-black/60 flex items-center justify-center max-h-[520px]">
                          <MediaRenderer
                            src={mediaSrc}
                            alt="Media postingan"
                            className="w-full max-h-[520px] object-contain rounded-2xl"
                          />
                        </div>
                      );
                    })()}

                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <span>❤️ {post.likesCount} suka</span>
                      <span>💬 {post.commentsCount} komentar</span>
                      <Link
                        href={`/post/${post.id}`}
                        className="ml-auto text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                      >
                        Lihat Diskusi <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-[#0B0F17]" />}>
      <ExploreContent />
    </Suspense>
  );
}
