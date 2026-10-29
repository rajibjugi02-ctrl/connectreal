"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  Bell,
  Mail,
  User,
  Bookmark,
  Feather,
  MoreHorizontal,
  Sun,
  Moon,
  LogOut,
  Settings,
} from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useTranslation } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const {
    currentUser,
    notifications,
    conversations,
    theme,
    toggleTheme,
    setLogoutModalOpen,
  } = useAppStore();

  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const unreadNotifs = notifications.filter(
    (n) => !n.read && n.recipientId === currentUser.id && !["notif-1", "notif-2", "notif-3", "n-1", "n-2", "n-3"].includes(n.id)
  ).length;
  const validConversations = conversations.filter(
    (c) => !["c-1", "c-2", "c-3", "conv-1", "conv-2"].includes(c.id)
  );
  const unreadMessages = validConversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const navLinks = [
    {
      label: t.navHome,
      href: "/",
      icon: Home,
    },
    {
      label: t.navExplore,
      href: "/explore",
      icon: Compass,
    },
    {
      label: t.navNotifications,
      href: "/notifications",
      icon: Bell,
      badge: unreadNotifs,
    },
    {
      label: t.navMessages,
      href: "/messages",
      icon: Mail,
      badge: unreadMessages,
    },
    {
      label: t.navBookmarks,
      href: "/bookmarks",
      icon: Bookmark,
    },
    {
      label: t.navProfile,
      href: "/profile",
      icon: User,
    },
    {
      label: t.navSettings,
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col justify-between w-20 lg:w-64 xl:w-72 h-screen sticky top-0 px-2.5 lg:px-3 py-3.5 border-r border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#0B0F17] select-none z-30 shrink-0">
      <div className="flex flex-col gap-4">
        {/* Logo Brand */}
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/[0.04] transition-colors group focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-600 dark:bg-sky-500 text-white flex items-center justify-center font-black text-lg shadow-xs group-hover:scale-105 transition-transform shrink-0">
            CR
          </div>
          <span className="hidden lg:inline text-lg font-bold tracking-tight text-[#0F172A] dark:text-slate-100">
            Connect<span className="text-blue-600 dark:text-sky-400">Real</span>
          </span>
        </Link>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1" aria-label="Navigasi Utama">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-98 focus-visible:ring-2 focus-visible:ring-blue-500",
                  isActive
                    ? "bg-blue-50 text-blue-600 dark:bg-sky-400/10 dark:text-sky-400 font-bold"
                    : "text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-slate-100 hover:bg-black/5 dark:hover:bg-white/[0.04]"
                )}
              >
                <div className="relative shrink-0">
                  <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className="absolute -top-1.5 -right-2 min-w-4.5 h-4.5 px-1 bg-blue-600 dark:bg-sky-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Quick Theme Switcher Pill in Navigation */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Alihkan mode tema terang dan gelap"
          className="hidden lg:flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-slate-100 hover:bg-black/5 dark:hover:bg-white/[0.04] transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <span className="flex items-center gap-2.5">
            {theme === "dark" ? (
              <Moon className="w-4 h-4 text-sky-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
            <span>{theme === "dark" ? t.navDarkTheme : t.navLightTheme}</span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-slate-800 text-[#64748B] dark:text-slate-400">
            {theme === "dark" ? "Dark" : "Light"}
          </span>
        </button>

        {/* Action Trigger: Buat Postingan Baru */}
        <Link
          href="/post/create"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white font-bold text-sm shadow-xs hover:shadow-sm active:scale-98 transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Feather className="w-4.5 h-4.5 shrink-0" />
          <span className="hidden lg:inline">{t.navPostStatus}</span>
        </Link>
      </div>

      {/* Footer Profile & Theme Toggle */}
      <div className="relative flex flex-col gap-2">
        {/* Dropdown Options Menu */}
        {isMenuOpen && (
          <div className="absolute bottom-16 left-0 w-60 bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-2xl p-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <button
              onClick={() => {
                toggleTheme();
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium hover:bg-black/5 dark:hover:bg-white/[0.04] text-[#0F172A] dark:text-slate-100 transition-colors"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t.navLightTheme}</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-sky-400" />
                  <span>{t.navDarkTheme}</span>
                </>
              )}
            </button>
            <Link
              href="/settings"
              onClick={() => setIsMenuOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium hover:bg-black/5 dark:hover:bg-white/[0.04] text-[#0F172A] dark:text-slate-100 transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.navSettings}</span>
            </Link>
            <div className="my-1 border-t border-[#E2E8F0] dark:border-slate-700" />
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setLogoutModalOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.navLogout}</span>
            </button>
          </div>
        )}

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center justify-between w-full p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/[0.04] transition-colors group focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-haspopup="true"
          aria-expanded={isMenuOpen}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/20 dark:ring-sky-400/20 shrink-0"
            />
            <div className="hidden lg:flex flex-col text-left truncate min-w-0">
              <span className="font-bold text-xs text-[#0F172A] dark:text-slate-100 truncate">
                {currentUser.name}
              </span>
              <span className="text-[11px] text-[#64748B] dark:text-slate-400 truncate">
                @{currentUser.username}
              </span>
            </div>
          </div>
          <MoreHorizontal className="hidden lg:inline w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 shrink-0" />
        </button>
      </div>
    </aside>
  );
}
