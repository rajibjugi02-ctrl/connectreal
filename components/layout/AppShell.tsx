"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { RightSidebar } from "./RightSidebar";
import { LogoutModal } from "../modals/LogoutModal";
import { EditProfileModal } from "../modals/EditProfileModal";
import { AIAssistantModal } from "../bot/AIAssistantModal";
import { useAppStore } from "@/lib/store/useAppStore";
import { useServerSync } from "@/lib/sync/clientSync";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, isMobileChatOpen, isAuthenticated, isHydrated } = useAppStore();
  const [mounted, setMounted] = useState(false);

  // Real-Time LAN Server Synchronization (Laptop <-> HP)
  useServerSync();

  // Sync dark class on initial mount & pastikan hidrasi client selesai
  useEffect(() => {
    setMounted(true);

    // Tandai hidrasi store aktif di sisi client
    useAppStore.getState().setHydrated(true);

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Fail-safe timeout: pastikan status hidrasi tidak pernah macet
    const fallbackTimer = setTimeout(() => {
      if (!useAppStore.getState().isHydrated) {
        useAppStore.getState().setHydrated(true);
      }
    }, 400);

    return () => clearTimeout(fallbackTimer);
  }, [theme]);

  // Auth Protection: Jika sudah terhidrasi tapi belum login dan membuka halaman selain /auth, arahkan ke /auth
  useEffect(() => {
    if (mounted && isHydrated && !isAuthenticated && pathname !== "/auth") {
      router.replace("/auth");
    }
  }, [mounted, isHydrated, isAuthenticated, pathname, router]);

  // If on /auth, /stories/create, /post/create, or /call page, render plain without app shell sidebars
  const isAuthPage = pathname === "/auth";
  const isStoryStudio = pathname === "/stories/create";
  const isPostCreate = pathname === "/post/create";
  const isCallPage = pathname === "/call";

  if (isAuthPage || isStoryStudio || isPostCreate || isCallPage) {
    return (
      <main className="min-h-screen bg-white dark:bg-[#0B0F17] text-[#0F172A] dark:text-slate-100">
        {children}
      </main>
    );
  }

  // Tampilkan loading screen bersih saat belum selesai hidrasi atau saat redirect
  if (!mounted || !isHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-[#0B0F17]">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  // On /messages and /settings pages on desktop, right sidebar widget is suppressed so content gets full width
  const isMessagesPage = pathname?.startsWith("/messages");
  const isSettingsPage = pathname?.startsWith("/settings");

  return (
    <div className="h-full h-[100dvh] max-h-[100dvh] w-full flex-1 bg-white dark:bg-[#0B0F17] text-[#0F172A] dark:text-slate-100 flex overflow-hidden">
      {/* Left Sticky Sidebar (Desktop & Tablet: Flush far-left, locked identical position) */}
      <Sidebar />

      {/* Center Main Content Area: Flexibly fills viewport space edge-to-edge */}
      <main
        className={cn(
          "flex-1 min-w-0 h-full max-h-full border-r border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#0B0F17]",
          isMessagesPage
            ? isMobileChatOpen
              ? "overflow-hidden pb-0"
              : "overflow-hidden pb-16 md:pb-0"
            : isSettingsPage
              ? "overflow-hidden pb-16 md:pb-0"
              : "overflow-y-auto pb-20 md:pb-0"
        )}
      >
        {children}
      </main>

      {/* Right Sticky Sidebar (Desktop Only, hidden on /messages and /settings): Flush far-right */}
      {!isMessagesPage && !isSettingsPage && <RightSidebar />}

      {/* Thumb-friendly Bottom Navigation for Mobile */}
      <BottomNav />

      {/* Global Modals */}
      <LogoutModal />
      <EditProfileModal />

      {/* AI Assistant Chatbot (Selalu hadir di semua halaman) */}
      <AIAssistantModal />
    </div>
  );
}
