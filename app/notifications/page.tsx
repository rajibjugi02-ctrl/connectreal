"use client";

export const dynamic = "force-dynamic";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  MessageCircle,
  Repeat2,
  UserPlus,
  CheckCheck,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { formatTimestamp, cn } from "@/lib/utils";
import type { NotificationItem } from "@/lib/types";

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    currentUser,
    registeredUsers,
    onlineUsers,
    posts,
    toggleFollowUser,
    getOrCreateConversation,
    setActiveConversationId,
    markAllNotificationsAsRead,
    markNotificationAsRead,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<"activity" | "followers">("activity");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [optimisticFollows, setOptimisticFollows] = useState<Record<string, boolean>>({});

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Follow back action
  const handleFollowBack = (item: NotificationItem, targetUser: any) => {
    if (!targetUser) return;
    const identifier = targetUser.id || targetUser.username;

    setOptimisticFollows((prev) => ({ ...prev, [item.id]: true, [identifier]: true }));
    toggleFollowUser(identifier);

    showToast(`Berhasil mengikuti balik @${targetUser.username}`);
  };

  // Open Chat action
  const handleOpenChat = (targetUser: any) => {
    if (!targetUser) return;
    const convId = getOrCreateConversation({
      id: targetUser.id || `u-${targetUser.username}`,
      name: targetUser.name,
      username: targetUser.username,
      email: targetUser.email || `${targetUser.username}@connectreal.app`,
      avatarUrl: targetUser.avatarUrl,
      bannerUrl: targetUser.bannerUrl || "",
      bio: targetUser.bio || "",
      followersCount: targetUser.followersCount || 0,
      followingCount: targetUser.followingCount || 0,
      postsCount: targetUser.postsCount || 0,
      isOnline: true,
    });
    setActiveConversationId(convId);
    router.push("/messages");
  };

  // 1. Filter notifications intended for currentUser
  const myNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const isForMe =
        Boolean(item.recipientId) &&
        (item.recipientId === currentUser.id ||
          (Boolean(currentUser.username) &&
            item.recipientId?.toLowerCase() === currentUser.username.toLowerCase()));
      return isForMe;
    });
  }, [notifications, currentUser]);

  // 2. Tab 1: Activity (Likes, Reposts, Comments, Replies)
  const activityList = useMemo(() => {
    return myNotifications.filter(
      (item) => item.type === "like" || item.type === "comment" || item.type === "repost" || item.type === "security_alert"
    );
  }, [myNotifications]);

  // 3. Tab 2: Followers with Anti-Spam protection (max 1 or 2 per unique actor)
  const followersList = useMemo(() => {
    const rawFollows = myNotifications.filter((item) => item.type === "follow");
    const actorCounts = new Map<string, number>();
    const deduplicatedFollows: NotificationItem[] = [];

    for (const item of rawFollows) {
      const actorKey = (item.actor?.username || item.actor?.id || item.actor?.name || "").toLowerCase();
      if (!actorKey) continue;
      const count = actorCounts.get(actorKey) || 0;
      // Anti-Spam: Batasi maksimal 1x notifikasi per akun pengikut agar tab bersih dari spam follow/unfollow
      if (count < 1) {
        actorCounts.set(actorKey, count + 1);
        deduplicatedFollows.push(item);
      }
    }

    return deduplicatedFollows;
  }, [myNotifications]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case "comment":
        return <MessageCircle className="w-4 h-4 text-sky-500 fill-sky-500" />;
      case "repost":
        return <Repeat2 className="w-4 h-4 text-emerald-500" />;
      default:
        return <Heart className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="w-full min-h-screen pb-16">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="font-bold text-lg text-slate-900 dark:text-slate-100">
            Notifikasi
          </h1>
          <button
            type="button"
            onClick={markAllNotificationsAsRead}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-blue-600 dark:text-sky-400 hover:bg-blue-50 dark:hover:bg-slate-800 active:scale-95 transition-all"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Tandai semua dibaca</span>
          </button>
        </div>

        {/* 2 Main Tabs: Activity & Followers */}
        <div className="flex border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("activity")}
            className={cn(
              "flex-1 py-3 text-sm font-bold text-center transition-colors relative flex items-center justify-center gap-2",
              activeTab === "activity"
                ? "text-blue-600 dark:text-sky-400"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40"
            )}
          >
            <span>Activity</span>
            {activityList.some((n) => !n.read) && (
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-sky-400" />
            )}
            {activeTab === "activity" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-sky-400 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("followers")}
            className={cn(
              "flex-1 py-3 text-sm font-bold text-center transition-colors relative flex items-center justify-center gap-2",
              activeTab === "followers"
                ? "text-blue-600 dark:text-sky-400"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40"
            )}
          >
            <span>Followers</span>
            {followersList.some((n) => !n.read) && (
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-sky-400" />
            )}
            {activeTab === "followers" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-sky-400 rounded-full" />
            )}
          </button>
        </div>
      </header>

      {/* Tab 1: Activity (Likes, Reposts, Comments, Replies) */}
      {activeTab === "activity" && (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {activityList.length > 0 ? (
            activityList.map((item) => {
              // Cari postingan terkait jika ada
              const relatedPostId =
                (item as any).postId ||
                posts.find((p) => p.author.id === currentUser.id)?.id;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    markNotificationAsRead(item.id);
                    if (relatedPostId) {
                      router.push(`/post/${relatedPostId}`);
                    }
                  }}
                  className={cn(
                    "flex items-start gap-3.5 p-4 cursor-pointer transition-colors relative group",
                    !item.read
                      ? "bg-blue-50/40 dark:bg-blue-950/20"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  )}
                >
                  {/* Badge Icon */}
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    {getActivityIcon(item.type)}
                  </div>

                  {/* Actor Avatar & Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {item.actor?.avatarUrl && (
                        <img
                          src={item.actor.avatarUrl}
                          alt={item.actor.name}
                          className="w-5 h-5 rounded-full object-cover shrink-0"
                        />
                      )}
                      <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-auto shrink-0">
                        {formatTimestamp(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                      {item.description}
                    </p>

                    {/* Tombol Balas (Reply) untuk Komentar */}
                    {item.type === "comment" && (
                      <div className="mt-2.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markNotificationAsRead(item.id);
                            if (relatedPostId) {
                              router.push(`/post/${relatedPostId}`);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-sky-400 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Balas (Reply)</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Unread dot */}
                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-sky-400 shrink-0 self-center" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <p className="text-sm font-semibold">Belum ada aktivitas interaksi.</p>
              <p className="text-xs mt-1 text-slate-400">
                Suka, komentar, balasan, dan repost dari pengguna lain akan tampil di sini.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Followers (Anti-Spam + Follow Back -> Chat Flow) */}
      {activeTab === "followers" && (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {followersList.length > 0 ? (
            followersList.map((item) => {
              const actorId = item.actor?.id;
              const actorUsername = item.actor?.username;
              const targetUser =
                (actorId && registeredUsers.find((u) => u.id === actorId)) ||
                (actorUsername && registeredUsers.find((u) => u.username === actorUsername)) ||
                (actorUsername && onlineUsers.find((u) => u.username === actorUsername)) ||
                (item.actor
                  ? {
                      id: item.actor.id || `u-${item.actor.username}`,
                      name: item.actor.name,
                      username: item.actor.username,
                      avatarUrl: item.actor.avatarUrl,
                      isFollowing: false,
                    }
                  : null);

              const isFollowingTarget = Boolean(
                optimisticFollows[item.id] ||
                  (targetUser?.id && optimisticFollows[targetUser.id]) ||
                  (targetUser?.username && optimisticFollows[targetUser.username]) ||
                  (targetUser && (targetUser as any).isFollowing)
              );

              return (
                <div
                  key={item.id}
                  onClick={() => markNotificationAsRead(item.id)}
                  className={cn(
                    "flex items-center gap-3.5 p-4 transition-colors",
                    !item.read
                      ? "bg-blue-50/40 dark:bg-blue-950/20"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  )}
                >
                  {/* User Avatar */}
                  <img
                    src={
                      item.actor?.avatarUrl ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80"
                    }
                    alt={item.actor?.name || "User"}
                    className="w-11 h-11 rounded-full object-cover shrink-0 cursor-pointer"
                    onClick={() => {
                      if (item.actor?.username) {
                        router.push(`/profile/${item.actor.username}`);
                      }
                    }}
                  />

                  {/* User Info */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      if (item.actor?.username) {
                        router.push(`/profile/${item.actor.username}`);
                      }
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {item.actor?.name || "Pengguna"}
                      </span>
                      <span className="text-xs text-slate-400 truncate">
                        @{item.actor?.username || "user"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Mulai mengikuti Anda • {formatTimestamp(item.createdAt)}
                    </p>
                  </div>

                  {/* Action Buttons: Follow Back & Chat Flow */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollowBack(item, targetUser);
                      }}
                      className={cn(
                        "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 shadow-xs",
                        isFollowingTarget
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      )}
                    >
                      {isFollowingTarget ? "Mengikuti" : "Follow Back"}
                    </button>

                    {/* Tombol Chat: Hanya aktif & muncul jika sudah Follow Back */}
                    {isFollowingTarget && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenChat(targetUser);
                        }}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-all active:scale-95 shadow-xs flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <UserPlus className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold">Belum ada pengikut baru.</p>
              <p className="text-xs mt-1 text-slate-400">
                Pengguna yang mulai mengikuti akun Anda akan muncul di sini.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 text-xs font-semibold shadow-xl border border-slate-700 dark:border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
