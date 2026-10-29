"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Bell, Mail, Bookmark, User } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useTranslation } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const { notifications, conversations, currentUser, isMobileChatOpen, setIsMobileChatOpen } = useAppStore();
  const { t } = useTranslation();

  // Sembunyikan bottom navigation bar HANYA saat panggilan berlangsung (/call)
  // ATAU saat pengguna sedang membuka ruang obrolan tertentu di layar HP (isMobileChatOpen).
  // Pada daftar percakapan (/messages), bottom navigation bar TETAP MUNCUL penuh!
  if (!pathname || pathname.startsWith("/call") || (pathname.startsWith("/messages") && isMobileChatOpen)) {
    return null;
  }

  const unreadNotifs = notifications.filter(
    (n) => !n.read && n.recipientId === currentUser.id && !["notif-1", "notif-2", "notif-3", "n-1", "n-2", "n-3"].includes(n.id)
  ).length;
  const validConversations = conversations.filter(
    (c) => !["c-1", "c-2", "c-3", "conv-1", "conv-2"].includes(c.id)
  );
  const unreadMessages = validConversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const items = [
    { href: "/", label: t.navHome, icon: Home },
    { href: "/explore", label: t.navExplore, icon: Compass },
    {
      href: "/notifications",
      label: t.navNotifications,
      icon: Bell,
      badge: unreadNotifs,
    },
    {
      href: "/messages",
      label: t.navMessages,
      icon: Mail,
      badge: unreadMessages,
    },
    {
      href: "/bookmarks",
      label: t.navBookmarks,
      icon: Bookmark,
    },
    { href: "/profile", label: t.navProfile, icon: User },
  ];

  return (
    <nav
      aria-label="Navigasi Bawah Seluler"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-[#E2E8F0] dark:border-slate-800 px-2 py-1 safe-area-bottom shadow-lg"
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (item.href === "/messages") {
                  setIsMobileChatOpen(false);
                }
              }}
              className={cn(
                "relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500",
                isActive
                  ? "text-blue-600 dark:text-sky-400 font-bold"
                  : "text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-slate-100"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="absolute -top-1 -right-2.5 min-w-4 h-4 px-1 bg-blue-600 dark:bg-sky-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-medium mt-0.5 truncate max-w-14 text-center">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
