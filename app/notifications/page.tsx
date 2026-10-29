"use client";

export const dynamic = "force-dynamic";

import React, { useState, useMemo } from "react";
import {
  Heart,
  MessageCircle,
  UserPlus,
  ShieldAlert,
  CheckCheck,
} from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useTranslation } from "@/lib/i18n/translations";
import { formatTimestamp, cn } from "@/lib/utils";
import type { NotificationItem } from "@/lib/types";

export default function NotificationsPage() {
  const {
    notifications,
    currentUser,
    registeredUsers,
    onlineUsers,
    toggleFollowUser,
    getOrCreateConversation,
    markAllNotificationsAsRead,
    markNotificationAsRead,
  } = useAppStore();
  const { t } = useTranslation();

  const [filter, setFilter] = useState<"all" | "interaction" | "system">("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [optimisticFollows, setOptimisticFollows] = useState<Record<string, boolean>>({});

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleFollowBack = (item: NotificationItem, targetUser: any) => {
    if (!targetUser) return;
    const identifier = targetUser.id || targetUser.username;

    // Respon optimis langsung agar tombol tidak terasa lag
    setOptimisticFollows((prev) => ({ ...prev, [item.id]: true, [identifier]: true }));
    toggleFollowUser(identifier);

    // Otomatis buat percakapan langsung sehingga kontak langsung ada di tab Pesan
    getOrCreateConversation({
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

    showToast(`Berhasil mengikuti balik @${targetUser.username}`);
  };

  const uniqueUserNotifs = useMemo(() => {
    const seen = new Set<string>();
    return notifications.filter((item) => {
      const isForMe =
        Boolean(item.recipientId) &&
        (item.recipientId === currentUser.id ||
          (Boolean(currentUser.username) &&
            item.recipientId?.toLowerCase() === currentUser.username.toLowerCase()));
      if (!isForMe) return false;

      // Unikkan notifikasi berdasarkan tipe dan aktor agar tidak numpuk
      const actorKey = (item.actor?.username || item.actor?.name || "").toLowerCase();
      const dedupeKey = `${item.type}_${actorKey}_${item.category || ""}`;
      if (seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);
      return true;
    });
  }, [notifications, currentUser]);

  const filteredNotifs = useMemo(() => {
    return uniqueUserNotifs.filter((item) => {
      if (filter === "all") return true;
      return item.category === filter;
    });
  }, [uniqueUserNotifs, filter]);

  const getIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="w-5 h-5 text-[#EF4444] fill-current" />;
      case "comment":
        return <MessageCircle className="w-5 h-5 text-sky-500 fill-current" />;
      case "follow":
        return <UserPlus className="w-5 h-5 text-teal-400" />;
      case "security_alert":
        return <ShieldAlert className="w-5 h-5 text-amber-500" />;
      default:
        return <Heart className="w-5 h-5 text-sky-400" />;
    }
  };

  return (
    <div className="w-full min-h-screen">
      {/* Sticky Header with Mark all as read */}
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-[#E2E8F0] dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="font-bold text-lg text-[#0F172A] dark:text-slate-100">
            {t.navNotifications}
          </h1>
          <button
            type="button"
            onClick={markAllNotificationsAsRead}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Tandai semua telah dibaca</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-t border-[#E2E8F0] dark:border-slate-800">
          {[
            { id: "all", label: "Semua" },
            { id: "interaction", label: "Interaksi" },
            { id: "system", label: "Sistem" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as typeof filter)}
              className={cn(
                "flex-1 py-3 text-sm font-bold text-center transition-colors relative",
                filter === tab.id
                  ? "text-[#0F172A] dark:text-slate-100"
                  : "text-[#64748B] dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/[0.04]"
              )}
            >
              {tab.label}
              {filter === tab.id && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#2563EB] dark:bg-sky-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Notifications List */}
      <div className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
        {filteredNotifs.length > 0 ? (
          filteredNotifs.map((item) => {
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
                  "flex items-start gap-4 p-4 cursor-pointer transition-colors relative",
                  !item.read
                    ? "bg-sky-500/5 hover:bg-sky-500/10"
                    : "bg-transparent hover:bg-[#F8FAFC] dark:hover:bg-slate-800/40"
                )}
              >
                {/* Status Type Icon */}
                <div className="mt-0.5 shrink-0">{getIcon(item.type)}</div>

                {/* Notification Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {item.actor ? (
                      <img
                        src={item.actor.avatarUrl}
                        alt={item.actor.name}
                        className="w-6 h-6 rounded-full object-cover shrink-0"
                      />
                    ) : null}
                    <span className="font-semibold text-sm text-[#0F172A] dark:text-slate-100 truncate">
                      {item.title}
                    </span>
                    <span className="text-xs text-[#64748B] dark:text-slate-400 ml-auto shrink-0">
                      {formatTimestamp(item.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Tombol Follow Back untuk notifikasi Follow */}
                {item.type === "follow" && targetUser && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFollowBack(item, targetUser);
                    }}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all active:scale-95 shadow-xs",
                      isFollowingTarget
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    )}
                  >
                    {isFollowingTarget ? "Mengikuti" : "Ikuti Balik"}
                  </button>
                )}

                {/* Unread indicator dot */}
                {!item.read && (
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0 self-center" />
                )}
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-[#64748B] dark:text-slate-400">
            <p className="text-base font-semibold">Tidak ada notifikasi di tab ini.</p>
            <p className="text-xs mt-1">
              Setiap like, komentar, pesan, atau pembaruan keamanan akan muncul di sini.
            </p>
          </div>
        )}
      </div>

      {/* Toast Alert Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 text-xs font-semibold shadow-xl border border-slate-700 dark:border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
