"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MessageCircle,
  Calendar,
  MapPin,
  Link as LinkIcon,
  UserCheck,
  UserPlus,
  Share2,
  Grid,
  Image as ImageIcon,
  Lock,
} from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useTranslation } from "@/lib/i18n/translations";
import { PostCard } from "@/components/feed/PostCard";
import { LinksModal } from "@/components/modals/LinksModal";
import { StoryViewer } from "@/components/stories/StoryViewer";
import { getMediaBlobUrl } from "@/lib/db/mediaStorage";
import { UserProfile } from "@/lib/types";
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

export default function OtherUserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const rawUsername = params.username as string;
  const username = decodeURIComponent(rawUsername).replace(/^@/, "");

  const {
    currentUser,
    onlineUsers,
    registeredUsers,
    posts,
    conversations,
    setActiveConversationId,
    setIsMobileChatOpen,
    getOrCreateConversation,
    toggleFollowUser,
    stories,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<"posts" | "media">("posts");
  const [copied, setCopied] = useState(false);
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);
  const [viewStoryId, setViewStoryId] = useState<string | null>(null);

  // If viewing self, redirect to /profile (aman di dalam useEffect)
  React.useEffect(() => {
    if (currentUser.username.toLowerCase() === username.toLowerCase()) {
      router.replace("/profile");
    }
  }, [currentUser.username, username, router]);

  // Ambil data profil terbaru dari server sync seketika saat halaman profil dibuka
  React.useEffect(() => {
    fetch("/api/sync")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success && Array.isArray(json.data?.registeredUsers)) {
          const serverList: any[] = json.data.registeredUsers;
          const currentList = useAppStore.getState().registeredUsers;
          const localMap = new Map(currentList.map((u) => [u.id, u]));
          let changed = false;

          for (const sUser of serverList) {
            const existing =
              localMap.get(sUser.id) ||
              Array.from(localMap.values()).find(
                (u) => u.username.toLowerCase() === sUser.username?.toLowerCase()
              );

            if (!existing) {
              localMap.set(sUser.id, sUser);
              changed = true;
            } else if (
              existing.name !== sUser.name ||
              existing.avatarUrl !== sUser.avatarUrl ||
              existing.bannerUrl !== sUser.bannerUrl ||
              existing.bio !== sUser.bio ||
              existing.location !== sUser.location ||
              JSON.stringify(existing.links || []) !== JSON.stringify(sUser.links || [])
            ) {
              localMap.set(existing.id, { ...existing, ...sUser });
              changed = true;
            }
          }

          if (changed) {
            useAppStore.setState({ registeredUsers: Array.from(localMap.values()) });
          }
        }
      })
      .catch(() => { });
  }, [username]);

  // Find user in registeredUsers FIRST, then onlineUsers, then posts authors
  let user: UserProfile | undefined = undefined;

  const foundReg = registeredUsers.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
  if (foundReg) {
    const isFoll = onlineUsers.find((o) => o.username.toLowerCase() === username.toLowerCase())?.isFollowing ?? foundReg.isFollowing ?? false;
    user = {
      id: foundReg.id,
      name: foundReg.name,
      username: foundReg.username,
      email: foundReg.email,
      avatarUrl: foundReg.avatarUrl,
      bannerUrl: foundReg.bannerUrl || "",
      bannerType: foundReg.bannerType || "image",
      bio: foundReg.bio || "",
      location: foundReg.location || "",
      links: foundReg.links || [],
      isOnline: Boolean(onlineUsers.some((o) => (o.id === foundReg.id || o.username === foundReg.username) && o.isOnline !== false)),
      followersCount: foundReg.followersCount || 0,
      followingCount: foundReg.followingCount || 0,
      postsCount: foundReg.postsCount || 0,
      isFollowing: isFoll,
      createdAt: foundReg.createdAt,
      isPrivate: foundReg.isPrivate ?? false,
      showOnlineStatus: foundReg.showOnlineStatus ?? true,
      onlineVisibility: foundReg.onlineVisibility ?? "everyone",
    };
  }

  if (!user) {
    const foundOnline = onlineUsers.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );
    if (foundOnline) {
      user = {
        ...foundOnline,
        isPrivate: foundOnline.isPrivate ?? false,
        showOnlineStatus: foundOnline.showOnlineStatus ?? true,
        onlineVisibility: foundOnline.onlineVisibility ?? "everyone",
      };
    }
  }

  if (!user) {
    const postWithAuthor = posts.find(
      (p) => p.author.username.toLowerCase() === username.toLowerCase()
    );
    if (postWithAuthor) {
      user = {
        id: postWithAuthor.author.id,
        name: postWithAuthor.author.name,
        username: postWithAuthor.author.username,
        email: `${postWithAuthor.author.username}@connectreal.app`,
        avatarUrl: postWithAuthor.author.avatarUrl,
        bannerUrl: "",
        bannerType: "image",
        bio: "",
        location: "",
        links: [],
        isOnline: Boolean(postWithAuthor.author.isOnline),
        followersCount: 0,
        followingCount: 0,
        postsCount: 1,
        isFollowing: false,
        isPrivate: false,
        showOnlineStatus: true,
        onlineVisibility: "everyone",
      };
    }
  }

  const isTargetFollowing = Boolean(user?.isFollowing);
  const isOnlineVisible = canSeeOnlineStatus(user, currentUser, isTargetFollowing);
  const isAccountLocked = Boolean(user?.isPrivate && !isTargetFollowing);

  const [resolvedBanner, setResolvedBanner] = useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    let urlToRevoke: string | null = null;
    if (user?.bannerUrl?.startsWith("idb:")) {
      getMediaBlobUrl(user.bannerUrl).then((u) => {
        if (active && u) {
          urlToRevoke = u;
          setResolvedBanner(u);
        }
      });
    } else {
      setResolvedBanner(user?.bannerUrl || null);
    }
    return () => {
      active = false;
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
    };
  }, [user?.bannerUrl]);

  if (!user) {
    return (
      <div className="w-full min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6">
        <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-[#E2E8F0] dark:border-slate-800 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Kembali"
            className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-base sm:text-lg">Profil Pengguna</h1>
        </header>
        <div className="py-20 text-center text-slate-500 dark:text-slate-400">
          <p className="text-base font-semibold">Pengguna tidak ditemukan.</p>
          <p className="text-xs mt-1">Akun @{username} mungkin tidak terdaftar atau telah dinonaktifkan.</p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  const userPosts = posts.filter(
    (p) => p.author.username.toLowerCase() === user!.username.toLowerCase()
  );
  const mediaPosts = userPosts.filter((p) => Boolean(p.mediaUrl));
  const displayedPosts = activeTab === "posts" ? userPosts : mediaPosts;

  const userActiveStories = stories.filter(
    (s) =>
      (user?.id && s.userId === user.id) ||
      (user?.username && s.user.username.toLowerCase() === user.username.toLowerCase())
  );
  const hasUserActiveStory = userActiveStories.length > 0;
  const allStoriesViewedByMe =
    hasUserActiveStory &&
    userActiveStories.every((s) =>
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

  const handleSendMessage = () => {
    if (!user) return;
    const convId = getOrCreateConversation(user);
    setActiveConversationId(convId);
    setIsMobileChatOpen(true);
    router.push("/messages");
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Kembali"
            className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-base sm:text-lg leading-tight">{user.name}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {userPosts.length} {t.profilePosts}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="Bagikan profil"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </header>

      {/* Banner (Foto atau Video ala TikTok) */}
      <div className="h-40 sm:h-52 w-full bg-slate-900 relative overflow-hidden">
        {resolvedBanner || user.bannerUrl ? (
          isVideoUrl(user.bannerUrl, user.bannerType) ? (
            <video
              src={resolvedBanner || user.bannerUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={resolvedBanner || user.bannerUrl}
              alt="Sampul profil"
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="w-full h-full bg-linear-to-r from-blue-900 to-indigo-950" />
        )}
      </div>

      {/* Profile Info */}
      <div className="px-4 pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
        <div className="flex items-end justify-between -mt-10 sm:-mt-12 mb-3">
          {/* Avatar with Story Ring Indicator & Online Status */}
          <div className="relative">
            <div
              onClick={() => {
                if (hasUserActiveStory) {
                  setViewStoryId(userActiveStories[0].id);
                }
              }}
              className={cn(
                "relative rounded-full transition-all select-none",
                hasUserActiveStory &&
                  (allStoriesViewedByMe
                    ? "p-1 ring-3 ring-slate-300 dark:ring-slate-700 ring-offset-2 dark:ring-offset-slate-900 cursor-pointer hover:scale-105 active:scale-95 shadow-md group/avatar"
                    : "p-1 ring-3 ring-pink-500 dark:ring-rose-500 ring-offset-2 dark:ring-offset-slate-900 cursor-pointer hover:scale-105 active:scale-95 shadow-md group/avatar")
              )}
              title={hasUserActiveStory ? `Ketuk untuk melihat Cerita @${user.username}` : undefined}
            >
              <img
                src={user.avatarUrl}
                alt={user.name}
                className={cn(
                  "w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-md",
                  !hasUserActiveStory && "ring-4 ring-white dark:ring-slate-900"
                )}
              />
            </div>
            <div
              title={isOnlineVisible ? "Online" : "Offline"}
              className={cn(
                "absolute bottom-1 right-1 w-4 h-4 rounded-full ring-3 ring-white dark:ring-slate-900 pointer-events-none",
                getOnlineDotClass(isOnlineVisible)
              )}
            />
          </div>

          {/* Action Buttons: Follow/Unfollow & Send Message */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendMessage}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-full border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all text-slate-900 dark:text-slate-100 shadow-xs"
            >
              <MessageCircle className="w-4 h-4 text-blue-600 dark:text-sky-400" />
              <span>{t.profileMessageBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => toggleFollowUser(user.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 text-xs sm:text-sm font-bold rounded-full transition-all active:scale-95 shadow-xs",
                user.isFollowing
                  ? "border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-red-500 hover:text-red-500"
                  : "bg-blue-600 hover:bg-blue-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white"
              )}
            >
              {user.isFollowing ? (
                <>
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  <span>{t.profileFollowingBtn}</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>{t.profileFollowBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Identity */}
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
              {user.name}
            </h2>
            {user.isPrivate && (
              <span title="Akun Privat" className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                <Lock className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            @{user.username}
          </p>
        </div>

        {/* Bio */}
        <p className="mt-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
          {user.bio}
        </p>

        {/* Metadata info: Lokasi, Tautan Web, Bergabung */}
        <div className="flex items-center gap-3.5 flex-wrap mt-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
            <span>{user.location || "Jakarta, Indonesia"}</span>
          </span>

          {/* Links: tampilkan maksimal 3 tautan, jika > 3 tampilkan pop up modal */}
          {(() => {
            const links = user.links || [];
            if (links.length === 0) {
              return (
                <span className="flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-emerald-500" />
                  <span>connectreal.app/@{user.username}</span>
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
            <span>{formatJoinedDate(user.createdAt)}</span>
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-5 mt-3.5 text-xs sm:text-sm">
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {user.followingCount}
            </span>{" "}
            <span className="text-slate-500 dark:text-slate-400">{t.profileFollowing}</span>
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {user.followersCount}
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

      {/* Content: Jika akun privat dan belum di-follow, kunci tampilan ala Instagram */}
      {isAccountLocked ? (
        <div className="py-20 px-6 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-200">
          <div className="w-20 h-20 rounded-full border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-sm">
            <Lock className="w-9 h-9 stroke-[1.75]" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Akun Ini Bersifat Privat
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Ikuti akun ini untuk melihat foto, video, dan postingan status mereka.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex border-b border-[#E2E8F0] dark:border-slate-800">
            {[
              { id: "posts" as const, label: t.profileTabPosts, count: userPosts.length, icon: Grid },
              { id: "media" as const, label: t.profileTabMedia, count: mediaPosts.length, icon: ImageIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
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

          {/* Posts Stream */}
          <div className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
            {displayedPosts.length > 0 ? (
              displayedPosts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="py-16 px-4 text-center text-slate-500 dark:text-slate-400">
                <p className="text-sm font-semibold">Belum ada kiriman dari @{user.username}.</p>
              </div>
            )}
          </div>
        </>
      )}

      <LinksModal
        isOpen={isLinksModalOpen}
        onClose={() => setIsLinksModalOpen(false)}
        links={user?.links || []}
        title={`Tautan ${user?.name}`}
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
