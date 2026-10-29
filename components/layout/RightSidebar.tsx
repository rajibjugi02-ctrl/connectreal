"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, TrendingUp, UserPlus, Check, Activity, X, Hash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { UserProfile } from "@/lib/types";
import { extractTrendsFromPosts } from "@/lib/utils/hashtagParser";

export function RightSidebar() {
  const router = useRouter();
  const { posts, onlineUsers, registeredUsers, currentUser, toggleFollowUser, addRecentSearch } = useAppStore();
  const [searchVal, setSearchVal] = useState("");

  const dynamicTrends = useMemo(() => extractTrendsFromPosts(posts), [posts]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      addRecentSearch(searchVal.trim());
      router.push(`/explore?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const recommendUsers = useMemo(() => {
    const list: UserProfile[] = [];
    const seenUsernames = new Set<string>([currentUser.username.toLowerCase()]);

    registeredUsers.forEach((u) => {
      if (!seenUsernames.has(u.username.toLowerCase())) {
        seenUsernames.add(u.username.toLowerCase());
        const matchOnline = onlineUsers.find(
          (o) => o.id === u.id || o.username.toLowerCase() === u.username.toLowerCase()
        );
        list.push({
          id: u.id,
          name: u.name,
          username: u.username,
          email: u.email,
          avatarUrl: u.avatarUrl,
          bannerUrl: u.bannerUrl || "",
          bio: u.bio || "",
          isOnline: true,
          followersCount: u.followersCount || 0,
          followingCount: u.followingCount || 0,
          postsCount: u.postsCount || 0,
          isFollowing: matchOnline?.isFollowing ?? false,
        });
      }
    });

    onlineUsers.forEach((u) => {
      if (!seenUsernames.has(u.username.toLowerCase())) {
        seenUsernames.add(u.username.toLowerCase());
        list.push(u);
      }
    });

    return list.slice(0, 4);
  }, [registeredUsers, onlineUsers, currentUser.username]);

  return (
    <aside className="hidden lg:flex flex-col gap-4 w-80 xl:w-96 py-3.5 px-4 sticky top-0 h-screen overflow-y-auto no-scrollbar z-20 shrink-0 border-l border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#0B0F17]">
      {/* Quick Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
        <input
          type="text"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          placeholder="Cari topik atau pengguna..."
          className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-full border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/80 text-[#0F172A] dark:text-[#E2E8F0] placeholder-[#64748B] dark:placeholder-[#94A3B8] focus-visible:ring-2 focus-visible:ring-[#2563EB] dark:focus-visible:ring-[#38BDF8]"
        />
        {searchVal && (
          <button
            type="button"
            onClick={() => setSearchVal("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[#64748B] dark:text-[#94A3B8]"
            aria-label="Hapus kata kunci pencarian"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Widget 1: Topik Tren */}
      <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 p-3.5 shadow-2xs">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#2563EB] dark:text-[#38BDF8]" />
            <h3 className="font-bold text-sm text-[#0F172A] dark:text-[#E2E8F0]">
              Tren Saat Ini
            </h3>
          </div>
          <span className="text-[11px] text-[#2563EB] dark:text-[#38BDF8] font-semibold hover:underline cursor-pointer" onClick={() => router.push("/explore")}>
            Lihat Semua
          </span>
        </div>

        {dynamicTrends.length > 0 ? (
          <div className="space-y-1">
            {dynamicTrends.slice(0, 5).map((trend) => (
              <div
                key={trend.id}
                onClick={() => {
                  addRecentSearch(trend.hashtag);
                  router.push(`/explore?q=${encodeURIComponent(trend.hashtag)}`);
                }}
                className="p-2 -mx-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/[0.04] cursor-pointer transition-colors"
              >
                <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                  {trend.category}
                </div>
                <div className="font-semibold text-xs sm:text-sm text-[#0F172A] dark:text-[#E2E8F0]">
                  {trend.hashtag}
                </div>
                <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                  {trend.postsCount}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 px-3 text-center text-xs text-slate-500 dark:text-slate-400">
            <Hash className="w-5 h-5 mx-auto mb-1.5 opacity-40" />
            <p className="font-medium">Belum ada tagar yang tren saat ini</p>
          </div>
        )}
      </div>

      {/* Widget 2: Rekomendasi Siapa untuk Diikuti */}
      <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 p-3.5 shadow-2xs">
        <h3 className="font-bold text-sm text-[#0F172A] dark:text-[#E2E8F0] mb-2.5">
          Siapa untuk Diikuti
        </h3>

        {recommendUsers.length > 0 ? (
          <div className="space-y-2.5">
            {recommendUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-2">
                <Link
                  href={`/profile/${user.username}`}
                  className="flex items-center gap-2.5 min-w-0 group hover:opacity-90 transition-opacity"
                >
                  <div className="relative shrink-0">
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover shrink-0 group-hover:scale-105 transition-transform"
                    />
                    {user.isOnline && (
                      <div
                        title="Sedang online"
                        className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-800"
                      />
                    )}
                  </div>
                  <div className="truncate">
                    <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate group-hover:underline">
                      {user.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      @{user.username}
                    </div>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => toggleFollowUser(user.id)}
                  className={`shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full transition-all active:scale-95 ${
                    user.isFollowing
                      ? "border border-[#E2E8F0] dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-red-500 hover:text-red-500 bg-transparent"
                      : "border border-blue-600 text-blue-600 dark:border-sky-400 dark:text-sky-400 hover:bg-blue-50 dark:hover:bg-sky-400/10 bg-transparent"
                  }`}
                >
                  {user.isFollowing ? (
                    <span className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-500" /> Mengikuti
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <UserPlus className="w-3 h-3" /> Ikuti
                    </span>
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 px-2 text-center text-xs text-slate-500 dark:text-slate-400">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Belum ada rekomendasi</p>
            <p className="text-[11px] mt-0.5 text-slate-400 dark:text-slate-500">
              Pengguna lain yang mendaftar akan otomatis muncul di sini.
            </p>
          </div>
        )}
      </div>

      {/* Widget 2: Status Sistem & Jaringan */}
      <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <Activity className="w-3.5 h-3.5 text-[#10B981]" />
          <span className="text-[#64748B] dark:text-[#94A3B8] text-[11px]">
            Sistem: <strong className="text-[#10B981] font-semibold">Operasional (38ms)</strong>
          </span>
        </div>
        <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
          Jakarta IDC
        </span>
      </div>

      {/* Mini Footer Policy */}
      <div className="px-2 pb-2 text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
        <span>© 2026 ConnectReal • Privasi • Ketentuan • Aksesibilitas</span>
      </div>
    </aside>
  );
}
