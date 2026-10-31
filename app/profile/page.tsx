"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Settings,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Bookmark,
  Image as ImageIcon,
  Grid,
  Lock,
} from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useTranslation } from "@/lib/i18n/translations";
import { PostCard } from "@/components/feed/PostCard";
import { LinksModal } from "@/components/modals/LinksModal";
import { StoryViewer } from "@/components/stories/StoryViewer";
import { getMediaBlobUrl } from "@/lib/db/mediaStorage";
import { cn, formatJoinedDate } from "@/lib/utils";
import { canSeeOnlineStatus, getOnlineDotClass } from "@/lib/utils/onlineStatus";

// Helper to detect video banner
const isVideoUrl = (url?: string, type?: string) => {
  if (type === "video") return true;
  if (!url) return false;
  return (
    url.startsWith("idb:") ||
    url.startsWith("data:video/") ||
    url.endsWith(".mp4") ||
    url.endsWith(".webm") ||
    url.endsWith(".ogg") ||
    url.startsWith("blob:") ||
    url.includes("video")
  );
};

export default function ProfilePage() {
  const {
    currentUser,
    posts,
    stories,
    setEditProfileOpen,
    showOnlineStatus,
  } = useAppStore();

  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"posts" | "media" | "bookmarks">("posts");
  const [copied, setCopied] = useState(false);
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);
  const [viewStoryId, setViewStoryId] = useState<string | null>(null);
  const [resolvedBannerUrl, setResolvedBannerUrl] = useState<string | null>(null);

  const myActiveStories = stories.filter(
    (s) =>
      s.userId === currentUser.id ||
      s.user.username.toLowerCase() === currentUser.username.toLowerCase()
  );
  const hasMyActiveStory = myActiveStories.length > 0;
  const allMyStoriesViewed =
    hasMyActiveStory &&
    myActiveStories.every((s) => (s.viewsCount || 0) > 0 || (s.viewers && s.viewers.length > 0));

  // Muat banner video permanen dari IndexedDB jika tersimpan dengan prefix idb:
  useEffect(() => {
    let active = true;
    let objectUrlToRevoke: string | null = null;

    if (currentUser.bannerUrl?.startsWith("idb:")) {
      getMediaBlobUrl(currentUser.bannerUrl).then((url) => {
        if (active && url) {
          objectUrlToRevoke = url;
          setResolvedBannerUrl(url);
        }
      });
    } else {
      setResolvedBannerUrl(currentUser.bannerUrl || null);
    }

    return () => {
      active = false;
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
    };
  }, [currentUser.bannerUrl]);

  // Sync tab with URL search if accessed via ?tab=bookmarks
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "bookmarks" || tabParam === "media" || tabParam === "posts") {
        setActiveTab(tabParam as typeof activeTab);
      }
    }
  }, []);

  const handleShareProfile = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Filter posts for this user (Tab Media murni postingan media milik akun sendiri)
  const userPosts = posts.filter(
    (p) => p.author.username === currentUser.username || p.author.id === currentUser.id
  );
  const mediaPosts = userPosts.filter(
    (p) => Boolean(p.mediaUrl) || Boolean(p.mediaUrls && p.mediaUrls.length > 0)
  );
  const interactionPosts = posts.filter(
    (p) => (p.isLiked || p.isReposted) && p.author.id !== currentUser.id
  );
  const bookmarkedPosts = posts.filter((p) => p.isBookmarked);

  let displayedPosts = userPosts;
  if (activeTab === "media") displayedPosts = mediaPosts;
  if (activeTab === "bookmarks") displayedPosts = bookmarkedPosts;

  return (
    <div className="w-full min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Header with Title and Settings Link */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
            {currentUser.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {userPosts.length} {t.profilePosts}
          </p>
        </div>

        {/* Tombol ikon Pengaturan mengarahkan langsung ke rute /settings */}
        <Link
          href="/settings"
          aria-label="Buka Pengaturan Akun & Privasi"
          className="p-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 text-slate-900 dark:text-slate-100 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Settings className="w-4 h-4 text-blue-600 dark:text-sky-400" />
        </Link>
      </div>

      {/* Banner (Foto atau Video dengan Batas Tajam & Jernih) */}
      <div className="h-44 sm:h-56 w-full bg-slate-900 relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
        {resolvedBannerUrl || currentUser.bannerUrl ? (
          isVideoUrl(currentUser.bannerUrl, currentUser.bannerType) ? (
            <video
              src={resolvedBannerUrl || currentUser.bannerUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={resolvedBannerUrl || currentUser.bannerUrl}
              alt="Sampul profil"
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-900 to-indigo-950" />
        )}
      </div>

      {/* Profile Header Details */}
      <div className="px-4 pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
        <div className="flex items-end justify-between -mt-10 sm:-mt-12 mb-3">
          {/* Avatar (80px on desktop) with Story Ring Indicator & Online Status */}
          <div className="relative">
            <div
              onClick={() => {
                if (hasMyActiveStory) {
                  setViewStoryId(myActiveStories[0].id);
                }
              }}
              className={cn(
                "relative rounded-full transition-all select-none",
                hasMyActiveStory &&
                  (allMyStoriesViewed
                    ? "p-1 ring-3 ring-slate-300 dark:ring-slate-700 ring-offset-2 dark:ring-offset-slate-900 cursor-pointer hover:scale-105 active:scale-95 shadow-md group/avatar"
                    : "p-1 ring-3 ring-blue-600 dark:ring-sky-500 ring-offset-2 dark:ring-offset-slate-900 cursor-pointer hover:scale-105 active:scale-95 shadow-md group/avatar")
              )}
              title={hasMyActiveStory ? "Ketuk untuk melihat Cerita Anda" : undefined}
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className={cn(
                  "w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-md",
                  !hasMyActiveStory && "ring-4 ring-white dark:ring-slate-900"
                )}
              />
            </div>
            <div
              title={currentUser.isOnline && showOnlineStatus ? "Sedang online" : "Offline"}
              className={cn(
                "absolute bottom-1 right-1 w-4 h-4 rounded-full ring-3 ring-white dark:ring-slate-900 pointer-events-none",
                getOnlineDotClass(canSeeOnlineStatus(currentUser, currentUser, true))
              )}
            />
          </div>

          {/* Action buttons: Edit Profile, Share, & Settings */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareProfile}
              aria-label="Salin tautan profil"
              className="px-3 py-1.5 text-xs font-semibold rounded-full border border-[#E2E8F0] dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {copied ? "Tersalin!" : t.profileShareBtn}
            </button>
            <button
              type="button"
              onClick={() => setEditProfileOpen(true)}
              className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-full border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {t.profileEditBtn}
            </button>
          </div>
        </div>

        {/* User Identity */}
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
              {currentUser.name}
            </h2>
            {currentUser.isPrivate && (
              <span title="Akun Anda bersifat privat" className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                <Lock className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            @{currentUser.username}
          </p>
        </div>

        {/* Bio */}
        <p className="mt-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
          {currentUser.bio}
        </p>

        {/* Metadata info: Lokasi, Tautan Web, Bergabung */}
        <div className="flex items-center gap-3.5 flex-wrap mt-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
            <span>{currentUser.location || "Jakarta, Indonesia"}</span>
          </span>

          {/* Links: tampilkan maksimal 3 tautan, jika > 3 tampilkan pop up modal */}
          {(() => {
            const links = currentUser.links || [];
            if (links.length === 0) {
              return (
                <span className="flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-emerald-500" />
                  <span>connectreal.app/@{currentUser.username}</span>
                </span>
              );
            }

            if (links.length <= 3) {
              return links.map((link, idx) => {
                const formatted = link.startsWith("http") ? link : `https://${link}`;
                return (
                  <a
                    key={idx}
                    href={formatted}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 dark:text-sky-400 hover:underline font-semibold"
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>{link.replace(/^https?:\/\//, "").slice(0, 24)}</span>
                  </a>
                );
              });
            }

            // Lebih dari 3 tautan: tampilkan 2 tautan pertama + tombol pop up "+X tautan lainnya"
            return (
              <>
                {links.slice(0, 2).map((link, idx) => {
                  const formatted = link.startsWith("http") ? link : `https://${link}`;
                  return (
                    <a
                      key={idx}
                      href={formatted}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 dark:text-sky-400 hover:underline font-semibold"
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>{link.replace(/^https?:\/\//, "").slice(0, 20)}</span>
                    </a>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setIsLinksModalOpen(true)}
                  className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-sky-400/10 text-blue-600 dark:text-sky-400 hover:bg-blue-100 font-bold text-[11px] transition-colors cursor-pointer"
                >
                  +{links.length - 2} tautan lainnya
                </button>
              </>
            );
          })()}

          <span className="flex items-center gap-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
            <span>{formatJoinedDate(currentUser.createdAt)}</span>
          </span>
        </div>

        {/* Social Metrics */}
        <div className="flex items-center gap-5 mt-3.5 text-xs sm:text-sm">
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {currentUser.followingCount}
            </span>{" "}
            <span className="text-slate-500 dark:text-slate-400">{t.profileFollowing}</span>
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {currentUser.followersCount}
            </span>{" "}
            <span className="text-slate-500 dark:text-slate-400">{t.profileFollowers}</span>
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {userPosts.length}
            </span>{" "}
            <span className="text-slate-500 dark:text-slate-400">{t.profilePosts}</span>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="flex border-b border-[#E2E8F0] dark:border-slate-800">
        {[
          { id: "posts", label: t.profileTabPosts, count: userPosts.length, icon: Grid },
          { id: "media", label: t.profileTabMedia, count: mediaPosts.length, icon: ImageIcon },
          { id: "bookmarks", label: t.profileTabBookmarks, count: bookmarkedPosts.length, icon: Bookmark },
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
                  ? "text-slate-900 dark:text-slate-100"
                  : "text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className="text-[11px] px-1.5 py-0.5 bg-black/5 dark:bg-white/5 rounded-full font-semibold">
                {tab.count}
              </span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 dark:bg-sky-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Stream */}
      <div className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
        {displayedPosts.length > 0 ? (
          displayedPosts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <p className="text-base font-semibold">
              Tidak ada konten untuk ditampilkan di tab ini.
            </p>
            <p className="text-xs mt-1">
              Postingan yang Anda buat, sukai, atau simpan akan dikelompokkan di sini.
            </p>
          </div>
        )}
      </div>

      <LinksModal
        isOpen={isLinksModalOpen}
        onClose={() => setIsLinksModalOpen(false)}
        links={currentUser.links || []}
        title={`Tautan ${currentUser.name}`}
      />

      {/* Story Viewer Overlay */}
      {viewStoryId && (
        <StoryViewer
          initialStoryId={viewStoryId}
          onClose={() => setViewStoryId(null)}
        />
      )}
    </div>
  );
}
