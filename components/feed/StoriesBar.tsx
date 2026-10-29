"use client";

import React, { useRef, useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { StoryViewer } from "@/components/stories/StoryViewer";
import { UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { canSeeOnlineStatus, getOnlineDotClass } from "@/lib/utils/onlineStatus";

export function StoriesBar() {
  const { currentUser, onlineUsers, registeredUsers, stories } = useAppStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [activeStoryViewerId, setActiveStoryViewerId] = useState<string | null>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -200 : 200;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  // Find user's story if any (diurutkan kronologis: lama ke baru)
  const myStories = useMemo(
    () =>
      stories
        .filter((s) => s.userId === currentUser.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [stories, currentUser.id]
  );
  const hasMyStory = myStories.length > 0;

  // Group all other users who have active stories
  const otherStoryUsers = useMemo(() => {
    const list: UserProfile[] = [];
    const seen = new Set<string>([currentUser.id]);

    stories.forEach((s) => {
      if (!seen.has(s.userId)) {
        seen.add(s.userId);
        const reg = registeredUsers.find((u) => u.id === s.userId);
        const online = onlineUsers.find((u) => u.id === s.userId);
        const isPrivate = reg?.isPrivate ?? online?.isPrivate ?? false;
        const isFollowing = reg?.isFollowing ?? online?.isFollowing ?? false;

        // Jangan tampilkan cerita dari akun privat yang belum di-follow
        if (isPrivate && !isFollowing) {
          return;
        }

        const profile: UserProfile = online || (reg ? {
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
          isFollowing,
          isPrivate,
          showOnlineStatus: reg.showOnlineStatus ?? true,
          onlineVisibility: reg.onlineVisibility ?? "everyone",
        } : {
          id: s.userId,
          name: s.user.name,
          username: s.user.username,
          email: `${s.user.username}@connectreal.app`,
          avatarUrl: s.user.avatarUrl,
          bannerUrl: "",
          bio: "",
          isOnline: true,
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          isFollowing: false,
          isPrivate: false,
        });
        list.push(profile);
      }
    });

    return list;
  }, [stories, currentUser.id, registeredUsers, onlineUsers]);

  return (
    <div className="relative border-b border-[#E2E8F0] dark:border-slate-800 py-3.5 px-4 bg-white dark:bg-slate-900 select-none">
      {/* Scroll controls for desktop */}
      <button
        onClick={() => handleScroll("left")}
        aria-label="Gulir cerita ke kiri"
        className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 shadow-md items-center justify-center text-slate-800 dark:text-slate-100 hover:scale-105 active:scale-95 transition-all"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div
        ref={scrollRef}
        className="flex items-center gap-4 overflow-x-auto no-scrollbar scroll-smooth px-1 touch-pan-x"
      >
        {/* Cerita Anda (Create or View) */}
        <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (hasMyStory) {
                  setActiveStoryViewerId(myStories[0].id);
                }
              }}
              aria-label={hasMyStory ? "Lihat Cerita Anda" : "Buat Cerita Baru"}
              className="block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95 transition-transform"
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className={cn(
                  "w-14 h-14 rounded-full object-cover p-0.5 transition-all duration-200",
                  hasMyStory
                    ? "p-[2px] bg-gradient-to-tr from-blue-600 via-sky-400 to-indigo-500 story-ring-animated group-hover:scale-105 shadow-xs"
                    : "border-2 border-dashed border-blue-500/50 dark:border-sky-400/50 group-hover:border-blue-600 dark:group-hover:border-sky-400"
                )}
              />
            </button>

            {/* Direct Link to /stories/create */}
            <Link
              href="/stories/create"
              aria-label="Buat Cerita Baru"
              title="Buat Cerita Baru"
              className="absolute bottom-0 right-0 w-4.5 h-4.5 rounded-full bg-blue-600 dark:bg-sky-500 hover:bg-blue-700 dark:hover:bg-sky-400 text-white flex items-center justify-center ring-2 ring-white dark:ring-slate-900 transition-all hover:scale-115 active:scale-90 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-200" />
            </Link>
          </div>
          <Link
            href={hasMyStory ? "#" : "/stories/create"}
            onClick={(e) => {
              if (hasMyStory) {
                e.preventDefault();
                setActiveStoryViewerId(myStories[0].id);
              }
            }}
            className="text-[11px] font-medium text-slate-900 dark:text-slate-100 truncate max-w-16 hover:underline"
          >
            Cerita Anda
          </Link>
        </div>

        {/* Other Users With Stories */}
        {otherStoryUsers.map((user) => {
          const userStories = stories
            .filter((s) => s.userId === user.id)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          const hasStory = userStories.length > 0;

          // Apakah semua cerita user ini sudah pernah dilihat oleh currentUser
          const allStoriesViewed =
            hasStory &&
            userStories.every((s) =>
              Boolean(
                s.isViewed ||
                  s.viewers?.some(
                    (v) =>
                      v.userId === currentUser.id ||
                      (v.username &&
                        currentUser.username &&
                        v.username.toLowerCase() === currentUser.username.toLowerCase())
                  )
              )
            );

          return (
            <div
              key={user.id}
              onClick={() => {
                if (hasStory) {
                  setActiveStoryViewerId(userStories[0].id);
                }
              }}
              className={cn(
                "flex flex-col items-center gap-1.5 shrink-0 transition-transform",
                hasStory ? "cursor-pointer group active:scale-95" : "cursor-default opacity-85"
              )}
            >
              <div className="relative">
                <div
                  className={cn(
                    "w-14 h-14 rounded-full p-[2px] transition-transform duration-200 group-hover:scale-105 shadow-xs",
                    hasStory
                      ? allStoriesViewed
                        ? "bg-slate-300 dark:bg-slate-700"
                        : "bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 dark:from-blue-600 dark:via-sky-400 dark:to-indigo-500 story-ring-animated"
                      : "bg-slate-300 dark:bg-slate-700"
                  )}
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900"
                  />
                </div>
                {(() => {
                  const isVisible = canSeeOnlineStatus(user, currentUser, user.isFollowing);
                  return (
                    <div
                      title={isVisible ? "Sedang online" : "Offline"}
                      className={cn(
                        "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-slate-900",
                        getOnlineDotClass(isVisible)
                      )}
                    />
                  );
                })()}
              </div>
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 truncate max-w-16 text-center">
                {user.name.split(" ")[0]}
              </span>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => handleScroll("right")}
        aria-label="Gulir cerita ke kanan"
        className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 shadow-md items-center justify-center text-slate-800 dark:text-slate-100 hover:scale-105 active:scale-95 transition-all"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Full-Screen Story Viewer Overlay */}
      {activeStoryViewerId && (
        <StoryViewer
          initialStoryId={activeStoryViewerId}
          onClose={() => setActiveStoryViewerId(null)}
        />
      )}
    </div>
  );
}
