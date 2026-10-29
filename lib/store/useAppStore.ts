import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useState, useEffect } from "react";
import {
  UserProfile,
  RegisteredUser,
  PostItem,
  ConversationItem,
  MessageItem,
  NotificationItem,
  TrendTopic,
  SupportedLanguage,
  StoryItem,
  MusicTrack,
  PostComment,
  CallSignalItem,
} from "../types";

export type { RegisteredUser };
import {
  currentUser as initialCurrentUser,
  initialOnlineUsers,
  initialPosts,
  initialConversations,
  initialMessages,
  initialNotifications,
  initialTrends,
  initialStories,
} from "../mock-data";
import { generateBotReply } from "../bot/connectBot";
import { pushToServer } from "../sync/clientSync";

export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

export function getRealCurrentSession(): ActiveSession {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      id: "sess-current",
      device: "Desktop PC",
      browser: "Web Browser",
      location: "Jakarta, Indonesia",
      ip: "182.253.110.14",
      lastActive: "Sedang aktif sekarang",
      isCurrent: true,
    };
  }

  const ua = navigator.userAgent;
  let device = "Desktop PC";
  if (/iPad/.test(ua)) device = "Apple iPad";
  else if (/iPhone/.test(ua)) device = "Apple iPhone";
  else if (/Android/.test(ua)) device = "Smartphone Android";
  else if (/Macintosh|Mac OS X/.test(ua)) device = "Apple Mac (macOS)";
  else if (/Windows NT 10.0/.test(ua)) device = "PC Windows 10/11";
  else if (/Windows/.test(ua)) device = "PC Windows";
  else if (/Linux/.test(ua)) device = "Linux PC";

  let browser = "Web Browser";
  if (/Edg\//.test(ua)) browser = "Microsoft Edge";
  else if (/Chrome\//.test(ua)) browser = "Google Chrome";
  else if (/Safari\//.test(ua)) browser = "Apple Safari";
  else if (/Firefox\//.test(ua)) browser = "Mozilla Firefox";

  return {
    id: "sess-current",
    device,
    browser,
    location: "Perangkat Ini (Sesi Sekarang)",
    ip: "192.168.1.1 (Sesi Aktif)",
    lastActive: "Sedang aktif sekarang",
    isCurrent: true,
  };
}

interface AppState {
  // Theme & Language
  theme: "light" | "dark";
  language: SupportedLanguage;
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
  setLanguage: (lang: SupportedLanguage) => void;

  // Auth & Profile
  isAuthenticated: boolean;
  currentUser: UserProfile;
  registeredUsers: RegisteredUser[];
  setAuthenticated: (status: boolean) => void;
  updateCurrentUser: (updates: Partial<UserProfile>) => void;
  registerUser: (userData: { name: string; username: string; email: string; password?: string }) => { success: boolean; message: string };
  loginUser: (identifier: string, password?: string) => { success: boolean; message: string };
  loginOAuthUser: (userData: { name: string; email: string; avatarUrl?: string; provider?: string }) => { success: boolean; user: UserProfile };
  logout: () => void;

  // Social Feed & Archive
  posts: PostItem[];
  archivedPosts: PostItem[];
  onlineUsers: UserProfile[];
  trends: TrendTopic[];
  addPost: (
    content: string,
    mediaUrl?: string,
    mediaUrls?: string[],
    filter?: string,
    taggedUsers?: string[],
    musicTrack?: MusicTrack
  ) => void;
  editPost: (postId: string, newContent: string) => void;
  deletePost: (postId: string) => void;
  archivePost: (postId: string) => void;
  unarchivePost: (postId: string) => void;
  toggleLike: (postId: string) => void;
  toggleRepost: (postId: string) => void;
  toggleBookmark: (postId: string) => void;
  userBookmarks: Record<string, string[]>;
  addComment: (
    postId: string,
    content: string,
    replyTo?: { commentId: string; username: string }
  ) => void;
  toggleCommentLike: (postId: string, commentId: string) => void;
  toggleFollowUser: (userId: string) => void;

  // Stories
  stories: StoryItem[];
  archivedStories: StoryItem[];
  storyUploadQuality: "low" | "medium" | "high";
  setStoryUploadQuality: (q: "low" | "medium" | "high") => void;
  addStory: (story: Omit<StoryItem, "id" | "createdAt">) => void;
  deleteStory: (storyId: string) => void;
  archiveStory: (storyId: string) => void;
  unarchiveStory: (storyId: string) => void;
  markStoryViewed: (storyId: string) => void;
  toggleStoryLike: (storyId: string) => void;

  // Messaging
  conversations: ConversationItem[];
  activeConversationId: string;
  messages: Record<string, MessageItem[]>;
  typingStatus: Record<string, Record<string, number>>;
  setTypingStatus: (status: Record<string, Record<string, number>>) => void;
  incomingCall: CallSignalItem | null;
  setIncomingCall: (call: CallSignalItem | null) => void;
  activeCallSignal: CallSignalItem | null;
  setActiveCallSignal: (sig: CallSignalItem | null) => void;
  isMobileChatOpen: boolean;
  setIsMobileChatOpen: (open: boolean) => void;
  setActiveConversationId: (id: string) => void;
  getOrCreateConversation: (participant: UserProfile) => string;
  createGroupConversation: (groupName: string, participantUserIds: string[]) => string;
  updateGroupConversation: (conversationId: string, updates: Partial<ConversationItem>) => void;
  leaveGroupConversation: (conversationId: string) => void;
  makeGroupAdmin: (conversationId: string, userId: string) => void;
  removeGroupAdmin: (conversationId: string, userId: string) => void;
  updateGroupAvatar: (conversationId: string, avatarUrl: string) => void;
  sendMessage: (
    conversationId: string,
    content: string,
    extra?: {
      type?: "text" | "image" | "audio" | "file" | "call_log" | "system";
      mediaUrl?: string;
      mediaUrls?: string[];
      fileName?: string;
      fileSize?: string;
      audioDuration?: number;
      callLog?: {
        callType: "voice" | "video";
        status: "completed" | "missed" | "declined";
        duration?: number;
      };
      replyTo?: {
        id: string;
        senderName: string;
        text: string;
        type?: string;
      };
      storyReply?: {
        storyId: string;
        mediaUrl: string;
        mediaType: "image" | "video";
        authorUsername: string;
      };
    }
  ) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  deleteMessageForEveryone: (conversationId: string, messageId: string) => void;
  deleteMessageForMe: (conversationId: string, messageId: string) => void;
  editMessage: (conversationId: string, messageId: string, newContent: string) => void;
  clearConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  clearedConversations: Record<string, Record<string, number>>;
  addReaction: (conversationId: string, messageId: string, emoji: string) => void;
  forwardMessage: (targetConversationId: string, message: MessageItem) => void;

  // Notifications
  notifications: NotificationItem[];
  addNotification: (notification: Omit<NotificationItem, "id" | "createdAt">) => void;
  markAllNotificationsAsRead: () => void;
  markNotificationAsRead: (id: string) => void;

  // Explore & Search
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  removeRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;

  // Security & Privacy Settings
  twoFactorEnabled: boolean;
  readReceiptsEnabled: boolean;
  showOnlineStatus: boolean;
  isPrivateAccount: boolean;
  onlineVisibility: "everyone" | "followers" | "contacts" | "nobody";
  notificationPrefs: {
    messages: boolean;
    interactions: boolean;
    sounds: boolean;
  };
  blockedUsers: Array<{
    id: string;
    name: string;
    username: string;
    avatarUrl: string;
  }>;
  phoneNumber: string;
  activeSessions: ActiveSession[];
  chatCustomization: {
    bubbleColor: string;
    wallpaper: string;
  };
  setChatCustomization: (settings: Partial<{ bubbleColor: string; wallpaper: string }>) => void;
  toggle2FA: () => void;
  toggleReadReceipts: () => void;
  toggleShowOnlineStatus: () => void;
  togglePrivateAccount: () => void;
  setOnlineVisibility: (val: "everyone" | "followers" | "contacts" | "nobody") => void;
  toggleNotificationPref: (key: "messages" | "interactions" | "sounds") => void;
  blockUser: (user: { id: string; name: string; username: string; avatarUrl: string }) => void;
  unblockUser: (id: string) => void;
  deleteContact: (conversationId: string, participantId: string) => void;
  updatePhoneNumber: (phone: string) => void;
  terminateSession: (sessionId: string) => void;
  clearAppCache: () => void;

  // Modal Dialogs
  isLogoutModalOpen: boolean;
  isEditProfileOpen: boolean;
  setLogoutModalOpen: (open: boolean) => void;
  setEditProfileOpen: (open: boolean) => void;
}

export function sanitizePersistedStore(state: any) {
  if (!state) return state;

  // 1. Bersihkan nomor telepon mock hardcoded bawaan lama
  if (state.phoneNumber === "+62 812-8921-9988") {
    state.phoneNumber = "";
  }
  if (state.currentUser && state.currentUser.phone === "+62 812-8921-9988") {
    state.currentUser.phone = "";
  }
  if (Array.isArray(state.registeredUsers)) {
    state.registeredUsers = state.registeredUsers.map((u: any) =>
      u.phone === "+62 812-8921-9988" ? { ...u, phone: "" } : u
    );
  }

  // 2. Bersihkan postingan mock dummy lama
  if (Array.isArray(state.posts)) {
    state.posts = state.posts.filter((p: any) => {
      if (p.id === "p-1" || p.id === "p-2") return false;
      if (typeof p.content === "string") {
        if (p.content.includes("Pembaruan layout 3 kolom ConnectReal")) return false;
        if (p.content.includes("Desain Antarmuka")) return false;
      }
      return true;
    });
  }

  // 3. Bersihkan notifikasi mock dummy lama (notifikasi valid wajib memiliki recipientId)
  if (Array.isArray(state.notifications)) {
    state.notifications = state.notifications.filter((n: any) => {
      if (n.id === "notif-1" || n.id === "notif-2" || n.id === "notif-3") return false;
      if (n.id === "n-1" || n.id === "n-2" || n.id === "n-3") return false;
      if (!n.recipientId) return false;
      return true;
    });
  }

  // 4. Bersihkan percakapan dan pesan mock dummy lama
  if (Array.isArray(state.conversations)) {
    const dummyConvIds = new Set(["c-1", "c-2", "c-3", "conv-1", "conv-2"]);
    state.conversations = state.conversations.filter((c: any) => !dummyConvIds.has(c.id));
    if (state.messages && typeof state.messages === "object") {
      for (const id of Array.from(dummyConvIds)) {
        delete state.messages[id];
      }
    }
  }

  // 5. Bersihkan story mock dummy lama
  if (Array.isArray(state.stories)) {
    state.stories = state.stories.filter((s: any) => {
      if (s.id === "story-1" || s.id === "story-2" || s.id === "story-3") return false;
      return true;
    });
  }

  // 6. Bersihkan onlineUsers mock dummy lama
  if (Array.isArray(state.onlineUsers)) {
    state.onlineUsers = state.onlineUsers.filter((u: any) => {
      if (u.id === "u-1" || u.id === "u-2" || u.id === "u-3" || u.id === "u-4") return false;
      return true;
    });
  }

  // 7. Bersihkan data base64 raksasa (> 50KB) dari penyimpanan lokal agar tidak memicu QuotaExceededError
  if (state.messages && typeof state.messages === "object") {
    for (const convId of Object.keys(state.messages)) {
      if (Array.isArray(state.messages[convId])) {
        state.messages[convId] = state.messages[convId].map((m: any) => {
          if (!m) return m;
          const cleaned = { ...m };
          if (typeof cleaned.mediaUrl === "string" && cleaned.mediaUrl.startsWith("data:") && cleaned.mediaUrl.length > 50000) {
            cleaned.mediaUrl = "";
          }
          if (Array.isArray(cleaned.mediaUrls)) {
            cleaned.mediaUrls = cleaned.mediaUrls.map((u: any) =>
              typeof u === "string" && u.startsWith("data:") && u.length > 50000 ? "" : u
            );
          }
          return cleaned;
        });
      }
    }
  }

  return state;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme defaults to dark mode per desktop-first modern dev profile
      theme: "dark",
      language: "id",
      toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        if (typeof document !== "undefined") {
          if (next === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
        set({ theme: next });
      },
      setTheme: (theme) => {
        if (typeof document !== "undefined") {
          if (theme === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
        set({ theme });
      },
      setLanguage: (language) => {
        set({ language });
      },

      // Auth & Profile
      isAuthenticated: false,
      currentUser: initialCurrentUser,
      registeredUsers: [],
      setAuthenticated: (status) => set({ isAuthenticated: status }),
      updateCurrentUser: (updates) =>
        set((state) => {
          const updatedCurrent = { ...state.currentUser, ...updates };
          // Siarkan pembaruan profil ke server LAN agar semua device langsung menerima update
          pushToServer("UPDATE_USER", updatedCurrent);

          const foundInReg = state.registeredUsers.some(
            (u) =>
              u.id === updatedCurrent.id ||
              u.username.toLowerCase() === updatedCurrent.username.toLowerCase()
          );
          const nextRegisteredUsers = foundInReg
            ? state.registeredUsers.map((u) =>
                u.id === updatedCurrent.id ||
                u.username.toLowerCase() === updatedCurrent.username.toLowerCase()
                  ? { ...u, ...updates }
                  : u
              )
            : [...state.registeredUsers, { ...updatedCurrent, ...updates } as any];

          const foundInOnline = state.onlineUsers.some(
            (u) =>
              u.id === updatedCurrent.id ||
              u.username.toLowerCase() === updatedCurrent.username.toLowerCase()
          );
          const nextOnlineUsers = foundInOnline
            ? state.onlineUsers.map((u) =>
                u.id === updatedCurrent.id ||
                u.username.toLowerCase() === updatedCurrent.username.toLowerCase()
                  ? { ...u, ...updates }
                  : u
              )
            : [...state.onlineUsers, updatedCurrent];

          return {
            currentUser: updatedCurrent,
            registeredUsers: nextRegisteredUsers,
            onlineUsers: nextOnlineUsers,
          };
        }),
      registerUser: ({ name, username, email, password }) => {
        const cleanUser = username.toLowerCase().replace(/[^a-z0-9_]/g, "");
        const cleanEmail = email.toLowerCase().trim();

        const exists = get().registeredUsers.some(
          (u) => u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanEmail
        );
        if (exists) {
          return { success: false, message: "Username atau email tersebut sudah terdaftar." };
        }

        // Setiap akun baru memiliki pengikut dan postingan 0
        const newUser: RegisteredUser = {
          id: `user-${Date.now()}`,
          name: name.trim(),
          username: cleanUser || `user_${Date.now().toString().slice(-4)}`,
          email: cleanEmail,
          password: password || "password123",
          avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80`,
          bannerUrl: "",
          bannerType: "image",
          bio: "",
          location: "",
          links: [],
          phone: "",
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          isPrivate: false,
          showOnlineStatus: true,
          onlineVisibility: "everyone",
          createdAt: new Date().toISOString(),
        };

        // Simpan ke registeredUsers dan masukkan ke onlineUsers agar langsung muncul di pencarian eksplorasi
        set((state) => ({
          registeredUsers: [...state.registeredUsers, newUser],
          userBookmarks: {
            ...state.userBookmarks,
            [newUser.id]: [],
          },
          onlineUsers: [
            ...state.onlineUsers.filter((u) => u.username.toLowerCase() !== newUser.username.toLowerCase()),
            {
              id: newUser.id,
              name: newUser.name,
              username: newUser.username,
              email: newUser.email,
              avatarUrl: newUser.avatarUrl,
              bannerUrl: "",
              bannerType: "image",
              bio: "",
              location: "",
              links: [],
              isOnline: true,
              followersCount: 0,
              followingCount: 0,
              postsCount: 0,
              createdAt: newUser.createdAt,
            },
          ],
        }));

        // Sinkronkan akun baru ke server LAN agar langsung terdeteksi di HP & Laptop lain
        pushToServer("REGISTER_USER", newUser);

        return { success: true, message: "Pendaftaran berhasil! Akun siap digunakan." };
      },
      loginUser: (identifier, password) => {
        const cleanId = identifier.toLowerCase().trim();
        const users = get().registeredUsers;

        // Simpan terlebih dahulu akun yang sedang aktif sebelum beralih
        const currentActive = get().currentUser;
        if (currentActive && currentActive.id) {
          set((state) => ({
            registeredUsers: state.registeredUsers.map((u) =>
              u.id === currentActive.id || u.username.toLowerCase() === currentActive.username.toLowerCase()
                ? {
                    ...u,
                    name: currentActive.name,
                    avatarUrl: currentActive.avatarUrl,
                    bannerUrl: currentActive.bannerUrl,
                    bannerType: currentActive.bannerType,
                    bio: currentActive.bio,
                    location: currentActive.location,
                    links: currentActive.links,
                    phone: currentActive.phone,
                    followersCount: currentActive.followersCount,
                    followingCount: currentActive.followingCount,
                    postsCount: currentActive.postsCount,
                  }
                : u
            ),
          }));
        }

        const found = get().registeredUsers.find(
          (u) => u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
        );

        if (!found) {
          // Cek fallback ke akun bawaan jika identik
          if (
            cleanId === get().currentUser.email.toLowerCase() ||
            cleanId === get().currentUser.username.toLowerCase()
          ) {
            set({ isAuthenticated: true });
            return { success: true, message: "Berhasil masuk!" };
          }
          return {
            success: false,
            message: "Akun belum terdaftar. Silakan buat akun baru terlebih dahulu.",
          };
        }

        if (password && found.password && found.password !== password) {
          return {
            success: false,
            message: "Kata sandi yang Anda masukkan tidak sesuai.",
          };
        }

        const userBookmarks = get().userBookmarks?.[found.id] || [];

        // Beralih ke akun yang ditemukan dengan data bersih milik akun tersebut
        set((state) => ({
          isAuthenticated: true,
          isPrivateAccount: Boolean(found.isPrivate),
          showOnlineStatus: found.showOnlineStatus !== false,
          onlineVisibility: found.onlineVisibility || "everyone",
          currentUser: {
            id: found.id,
            name: found.name,
            username: found.username,
            email: found.email,
            avatarUrl: found.avatarUrl,
            bannerUrl: found.bannerUrl || "",
            bannerType: found.bannerType || "image",
            bio: found.bio || "",
            location: found.location || "",
            links: found.links || [],
            phone: found.phone || "",
            isOnline: true,
            isPrivate: Boolean(found.isPrivate),
            showOnlineStatus: found.showOnlineStatus !== false,
            onlineVisibility: found.onlineVisibility || "everyone",
            followersCount: found.followersCount || 0,
            followingCount: found.followingCount || 0,
            postsCount: found.postsCount || 0,
            createdAt: found.createdAt || new Date().toISOString(),
          },
          conversations: state.conversations.filter(
            (c) =>
              c.participant?.id === found.id ||
              c.participantIds?.includes(found.id) ||
              c.creatorId === found.id
          ),
          notifications: state.notifications.filter((n) => n.recipientId === found.id),
          stories: state.stories.filter((s) => s.userId === found.id),
          posts: state.posts.map((p) => ({
            ...p,
            isBookmarked: userBookmarks.includes(p.id),
          })),
        }));

        return { success: true, message: "Berhasil masuk!" };
      },
      loginOAuthUser: ({ name, email, avatarUrl, provider = "Google" }) => {
        const cleanEmail = email.toLowerCase().trim();
        let existingUser = get().registeredUsers.find(
          (u) => u.email.toLowerCase() === cleanEmail
        );
        const isNewUser = !existingUser;

        if (!existingUser) {
          const cleanUsername =
            cleanEmail.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "") ||
            `user_${Date.now().toString().slice(-4)}`;

          const newUser: RegisteredUser = {
            id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: name.trim() || "Pengguna Google",
            username: cleanUsername,
            email: cleanEmail,
            avatarUrl:
              avatarUrl ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
            bio: "",
            location: "",
            links: [],
            phone: "",
            followersCount: 0,
            followingCount: 0,
            postsCount: 0,
            isPrivate: false,
            showOnlineStatus: true,
            onlineVisibility: "everyone",
            createdAt: new Date().toISOString(),
          };

          set((state) => ({
            registeredUsers: [...state.registeredUsers, newUser],
            onlineUsers: [
              ...state.onlineUsers.filter((u) => u.username.toLowerCase() !== newUser.username.toLowerCase()),
              {
                id: newUser.id,
                name: newUser.name,
                username: newUser.username,
                email: newUser.email,
                avatarUrl: newUser.avatarUrl,
                bannerUrl: "",
                bannerType: "image",
                bio: newUser.bio || "",
                location: newUser.location || "",
                links: newUser.links || [],
                isOnline: true,
                followersCount: 0,
                followingCount: 0,
                postsCount: 0,
                createdAt: newUser.createdAt,
              },
            ],
          }));

          pushToServer("REGISTER_USER", newUser);
          existingUser = newUser;
        } else if (avatarUrl && (!existingUser.avatarUrl || existingUser.avatarUrl.includes("unsplash"))) {
          existingUser = { ...existingUser, avatarUrl, name: name.trim() || existingUser.name };
          set((state) => ({
            registeredUsers: state.registeredUsers.map((u) => u.id === existingUser!.id ? existingUser! : u),
          }));
        }

        const userBookmarks = get().userBookmarks?.[existingUser.id] || [];

        const activeProfile: UserProfile = {
          id: existingUser.id,
          name: existingUser.name,
          username: existingUser.username,
          email: existingUser.email,
          avatarUrl: existingUser.avatarUrl,
          bannerUrl: existingUser.bannerUrl || "",
          bannerType: existingUser.bannerType || "image",
          bio: existingUser.bio || "",
          location: existingUser.location || "",
          links: existingUser.links || [],
          phone: existingUser.phone || "",
          isOnline: true,
          isPrivate: Boolean(existingUser.isPrivate),
          showOnlineStatus: existingUser.showOnlineStatus !== false,
          onlineVisibility: existingUser.onlineVisibility || "everyone",
          followersCount: existingUser.followersCount || 0,
          followingCount: existingUser.followingCount || 0,
          postsCount: existingUser.postsCount || 0,
          createdAt: existingUser.createdAt || new Date().toISOString(),
        };

        set((state) => ({
          isAuthenticated: true,
          currentUser: activeProfile,
          conversations: isNewUser
            ? []
            : state.conversations.filter(
                (c) =>
                  c.participant?.id === existingUser!.id ||
                  c.participantIds?.includes(existingUser!.id) ||
                  c.creatorId === existingUser!.id
              ),
          messages: isNewUser ? {} : state.messages,
          notifications: isNewUser
            ? []
            : state.notifications.filter((n) => n.recipientId === existingUser!.id),
          stories: isNewUser ? [] : state.stories.filter((s) => s.userId === existingUser!.id),
          posts: isNewUser
            ? []
            : state.posts.map((p) => ({
                ...p,
                isBookmarked: userBookmarks.includes(p.id),
              })),
        }));

        pushToServer("USER_STATUS", { userId: activeProfile.id, isOnline: true });

        return { success: true, user: activeProfile };
      },
      logout: () => {
        set(() => ({
          isAuthenticated: false,
          isLogoutModalOpen: false,
          currentUser: {
            id: `usr_${Date.now()}`,
            name: "Pengguna",
            username: "user",
            email: "",
            avatarUrl: "",
            bannerUrl: "",
            bannerType: "image",
            bio: "",
            location: "",
            links: [],
            isOnline: false,
            followersCount: 0,
            followingCount: 0,
            postsCount: 0,
            phone: "",
          },
          conversations: [],
          messages: {},
          notifications: [],
          stories: [],
          posts: [],
          activeConversationId: undefined,
        }));
      },

      // Social Feed
      posts: initialPosts,
      archivedPosts: [],
      userBookmarks: {},
      onlineUsers: initialOnlineUsers,
      trends: initialTrends,

      addPost: (content, mediaUrl, mediaUrls, filter, taggedUsers, musicTrack) => {
        const user = get().currentUser;
        const resolvedMediaUrls = mediaUrls && mediaUrls.length > 0 
          ? mediaUrls 
          : mediaUrl ? [mediaUrl] : [];

        const newPost: PostItem = {
          id: `post-${Date.now()}`,
          author: {
            id: user.id,
            name: user.name,
            username: user.username,
            avatarUrl: user.avatarUrl,
            isOnline: true,
          },
          content,
          mediaUrl: mediaUrl || (resolvedMediaUrls.length > 0 ? resolvedMediaUrls[0] : undefined),
          mediaUrls: resolvedMediaUrls,
          filter: filter || "normal",
          taggedUsers: taggedUsers || [],
          musicTrack,
          createdAt: new Date().toISOString(),
          likesCount: 0,
          commentsCount: 0,
          repostsCount: 0,
          isLiked: false,
          isReposted: false,
          isBookmarked: false,
          comments: [],
        };

        set((state) => ({
          posts: [newPost, ...state.posts],
          currentUser: {
            ...state.currentUser,
            postsCount: state.currentUser.postsCount + 1,
          },
        }));

        pushToServer("CREATE_POST", newPost);
      },

      editPost: (postId, newContent) => {
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId ? { ...p, content: newContent } : p
          ),
          archivedPosts: state.archivedPosts.map((p) =>
            p.id === postId ? { ...p, content: newContent } : p
          ),
        }));
      },

      deletePost: (postId) => {
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== postId),
          archivedPosts: state.archivedPosts.filter((p) => p.id !== postId),
          currentUser: {
            ...state.currentUser,
            postsCount: Math.max(0, state.currentUser.postsCount - 1),
          },
        }));
      },

      archivePost: (postId) => {
        const target = get().posts.find((p) => p.id === postId);
        if (!target) return;
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== postId),
          archivedPosts: [target, ...state.archivedPosts],
        }));
      },

      unarchivePost: (postId) => {
        const target = get().archivedPosts.find((p) => p.id === postId);
        if (!target) return;
        set((state) => ({
          archivedPosts: state.archivedPosts.filter((p) => p.id !== postId),
          posts: [target, ...state.posts],
        }));
      },

      toggleLike: (postId) => {
        const currentUser = get().currentUser;
        let isNowLiked = false;
        let postAuthorId = "";

        set((state) => ({
          posts: state.posts.map((post) => {
            if (post.id === postId) {
              const prevLikedBy = Array.isArray(post.likedBy) ? post.likedBy : [];
              const isLiked = !post.isLiked;
              isNowLiked = isLiked;
              postAuthorId = post.author.id;

              const nextLikedBy = isLiked
                ? [...new Set([...prevLikedBy, currentUser.id])]
                : prevLikedBy.filter((id) => id !== currentUser.id);

              return {
                ...post,
                isLiked,
                likedBy: nextLikedBy,
                likesCount: nextLikedBy.length,
              };
            }
            return post;
          }),
        }));

        pushToServer("TOGGLE_LIKE", {
          postId,
          userId: currentUser.id,
          username: currentUser.username,
          isLiked: isNowLiked,
        });

        if (isNowLiked && postAuthorId && postAuthorId !== currentUser.id) {
          const newNotif: NotificationItem = {
            id: `notif-like-${Date.now()}`,
            recipientId: postAuthorId,
            type: "like",
            title: "Menyukai postingan Anda",
            description: `${currentUser.name} menyukai postingan Anda.`,
            actor: {
              name: currentUser.name,
              username: currentUser.username,
              avatarUrl: currentUser.avatarUrl,
            },
            read: false,
            createdAt: new Date().toISOString(),
            category: "interaction",
          };
          pushToServer("ADD_NOTIFICATION", newNotif);
        }
      },

      toggleRepost: (postId) => {
        const currentUser = get().currentUser;
        let isNowReposted = false;
        let postAuthorId = "";

        set((state) => ({
          posts: state.posts.map((post) => {
            if (post.id === postId) {
              const prevRepostedBy = Array.isArray(post.repostedBy) ? post.repostedBy : [];
              const isReposted = !post.isReposted;
              isNowReposted = isReposted;
              postAuthorId = post.author.id;

              const nextRepostedBy = isReposted
                ? [...new Set([...prevRepostedBy, currentUser.id])]
                : prevRepostedBy.filter((id) => id !== currentUser.id);

              return {
                ...post,
                isReposted,
                repostedBy: nextRepostedBy,
                repostsCount: nextRepostedBy.length,
              };
            }
            return post;
          }),
        }));

        pushToServer("TOGGLE_REPOST", {
          postId,
          userId: currentUser.id,
          username: currentUser.username,
          isReposted: isNowReposted,
        });

        if (isNowReposted && postAuthorId && postAuthorId !== currentUser.id) {
          const newNotif: NotificationItem = {
            id: `notif-repost-${Date.now()}`,
            recipientId: postAuthorId,
            type: "repost",
            title: "Memposting ulang kiriman Anda",
            description: `${currentUser.name} membagikan ulang kiriman Anda.`,
            actor: {
              name: currentUser.name,
              username: currentUser.username,
              avatarUrl: currentUser.avatarUrl,
            },
            read: false,
            createdAt: new Date().toISOString(),
            category: "interaction",
          };
          pushToServer("ADD_NOTIFICATION", newNotif);
        }
      },

      toggleBookmark: (postId) => {
        const currentUserId = get().currentUser.id;
        const currentBookmarks = get().userBookmarks?.[currentUserId] || [];
        const isBookmarked = currentBookmarks.includes(postId);
        const nextBookmarks = isBookmarked
          ? currentBookmarks.filter((id) => id !== postId)
          : [...currentBookmarks, postId];

        set((state) => ({
          userBookmarks: {
            ...state.userBookmarks,
            [currentUserId]: nextBookmarks,
          },
          posts: state.posts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                isBookmarked: !isBookmarked,
              };
            }
            return post;
          }),
        }));
      },

      addComment: (postId, content, replyTo) => {
        const user = get().currentUser;
        const newComment: PostComment = {
          id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          author: {
            id: user.id,
            name: user.name,
            username: user.username,
            avatarUrl: user.avatarUrl,
          },
          content,
          createdAt: new Date().toISOString(),
          likesCount: 0,
          isLiked: false,
          replyTo,
        };

        set((state) => {
          const targetPost = state.posts.find((p) => p.id === postId);

          if (targetPost && targetPost.author.id !== user.id) {
            const newNotif: NotificationItem = {
              id: `notif-cmt-${Date.now()}`,
              recipientId: targetPost.author.id,
              type: "comment",
              title: "Mengomentari postingan Anda",
              description: `${user.name}: "${content.slice(0, 60)}${content.length > 60 ? "..." : ""}"`,
              actor: {
                name: user.name,
                username: user.username,
                avatarUrl: user.avatarUrl,
              },
              read: false,
              createdAt: new Date().toISOString(),
              category: "interaction",
            };

            // Kirim notifikasi ke pemilik postingan lewat server
            pushToServer("ADD_NOTIFICATION", newNotif);
          }

          return {
            posts: state.posts.map((post) => {
              if (post.id === postId) {
                return {
                  ...post,
                  commentsCount: post.commentsCount + 1,
                  comments: [...(post.comments || []), newComment],
                };
              }
              return post;
            }),
          };
        });

        // Sinkronkan komentar baru ke server agar muncul di semua perangkat/akun lain
        pushToServer("ADD_COMMENT", { postId, comment: newComment });
      },

      toggleCommentLike: (postId, commentId) => {
        set((state) => ({
          posts: state.posts.map((post) => {
            if (post.id === postId && post.comments) {
              return {
                ...post,
                comments: post.comments.map((c) => {
                  if (c.id === commentId) {
                    const isLiked = !c.isLiked;
                    return {
                      ...c,
                      isLiked,
                      likesCount: isLiked
                        ? (c.likesCount || 0) + 1
                        : Math.max(0, (c.likesCount || 1) - 1),
                    };
                  }
                  return c;
                }),
              };
            }
            return post;
          }),
        }));
      },

      toggleFollowUser: (userId) => {
        const state = get();
        const targetOnline = state.onlineUsers.find(
          (u) => u.id === userId || u.username.toLowerCase() === userId.toLowerCase()
        );
        const targetReg = state.registeredUsers.find(
          (u) => u.id === userId || u.username.toLowerCase() === userId.toLowerCase()
        );
        let target: any = targetOnline || targetReg;

        // Jika user belum ada di state lokal (misal dari notifikasi akun baru di device lain)
        if (!target) {
          const notif = state.notifications.find(
            (n) =>
              n.actor?.id === userId ||
              (n.actor?.username && n.actor.username.toLowerCase() === userId.toLowerCase())
          );
          if (notif?.actor) {
            target = {
              id: notif.actor.id || userId,
              name: notif.actor.name,
              username: notif.actor.username,
              email: `${notif.actor.username}@connectreal.app`,
              avatarUrl: notif.actor.avatarUrl,
              bio: "",
              isOnline: true,
              followersCount: 0,
              followingCount: 0,
              postsCount: 0,
              isFollowing: false,
            };
          }
        }
        if (!target) return;

        const isCurrentlyFollowing = Boolean(
          target.isFollowing ?? targetOnline?.isFollowing ?? targetReg?.isFollowing ?? false
        );
        const nextFollowing = !isCurrentlyFollowing;

        set((s) => {
          const updatedOnline = s.onlineUsers.map((u) =>
            u.id === target.id || u.username.toLowerCase() === target.username.toLowerCase()
              ? {
                  ...u,
                  isFollowing: nextFollowing,
                  followersCount: nextFollowing
                    ? (u.followersCount || 0) + 1
                    : Math.max(0, (u.followersCount || 1) - 1),
                }
              : u
          );

          let finalOnline = updatedOnline;
          if (!s.onlineUsers.some((u) => u.id === target.id || u.username.toLowerCase() === target.username.toLowerCase()) && targetReg) {
            finalOnline = [
              ...finalOnline,
              {
                id: targetReg.id,
                name: targetReg.name,
                username: targetReg.username,
                email: targetReg.email,
                avatarUrl: targetReg.avatarUrl,
                bannerUrl: targetReg.bannerUrl || "",
                bannerType: targetReg.bannerType || "image",
                bio: targetReg.bio || "",
                location: targetReg.location || "",
                links: targetReg.links || [],
                isOnline: true,
                followersCount: nextFollowing
                  ? (targetReg.followersCount || 0) + 1
                  : Math.max(0, (targetReg.followersCount || 1) - 1),
                followingCount: targetReg.followingCount || 0,
                postsCount: targetReg.postsCount || 0,
                isFollowing: nextFollowing,
              },
            ];
          }

          const hasInReg = s.registeredUsers.some(
            (u) => u.id === target.id || u.username.toLowerCase() === target.username.toLowerCase()
          );

          let updatedRegistered = s.registeredUsers.map((u) =>
            u.id === target.id || u.username.toLowerCase() === target.username.toLowerCase()
              ? {
                  ...u,
                  isFollowing: nextFollowing,
                  followersCount: nextFollowing
                    ? (u.followersCount || 0) + 1
                    : Math.max(0, (u.followersCount || 1) - 1),
                }
              : u
          );

          if (!hasInReg) {
            updatedRegistered = [
              ...updatedRegistered,
              {
                id: target.id,
                name: target.name,
                username: target.username,
                email: target.email || `${target.username}@connectreal.app`,
                avatarUrl: target.avatarUrl,
                isFollowing: nextFollowing,
                followersCount: nextFollowing ? 1 : 0,
                followingCount: 0,
                postsCount: 0,
              },
            ];
          }

          const updatedCurrentUser = {
            ...s.currentUser,
            followingCount: nextFollowing
              ? s.currentUser.followingCount + 1
              : Math.max(0, s.currentUser.followingCount - 1),
          };

          let newNotif: NotificationItem | null = null;
          if (nextFollowing && target.id !== s.currentUser.id) {
            newNotif = {
              id: `notif-follow-${Date.now()}`,
              recipientId: target.id,
              type: "follow",
              title: "Mulai mengikuti Anda",
              description: `${s.currentUser.name} sekarang mengikuti Anda.`,
              actor: {
                id: s.currentUser.id,
                name: s.currentUser.name,
                username: s.currentUser.username,
                avatarUrl: s.currentUser.avatarUrl,
              },
              read: false,
              createdAt: new Date().toISOString(),
              category: "interaction",
            };
            // Siarkan notifikasi ke server agar akun target menerima notifikasi secara real-time
            pushToServer("ADD_NOTIFICATION", newNotif);
            pushToServer("UPDATE_USER", {
              id: target.id,
              followersCount: (target.followersCount || 0) + 1,
            });
            pushToServer("UPDATE_USER", updatedCurrentUser);
          } else if (!nextFollowing && target.id !== s.currentUser.id) {
            pushToServer("UPDATE_USER", {
              id: target.id,
              followersCount: Math.max(0, (target.followersCount || 1) - 1),
            });
            pushToServer("UPDATE_USER", updatedCurrentUser);
          }

          return {
            onlineUsers: finalOnline,
            registeredUsers: updatedRegistered,
            currentUser: updatedCurrentUser,
            // Notifikasi follow hanya masuk ke inbox penerima, bukan akun yang menekan tombol follow
            notifications: s.notifications,
          };
        });
      },

      // Stories
      stories: initialStories,
      archivedStories: [],
      storyUploadQuality: "high",
      setStoryUploadQuality: (q) => set({ storyUploadQuality: q }),

      addStory: (story) => {
        const quality = story.quality || get().storyUploadQuality;
        const newStory: StoryItem = {
          ...story,
          id: `story-${Date.now()}`,
          quality,
          createdAt: new Date().toISOString(),
          isViewed: false,
          likesCount: 0,
          isLiked: false,
          commentsCount: 0,
        };
        set((state) => ({
          stories: [newStory, ...state.stories],
        }));
        pushToServer("CREATE_STORY", newStory);
      },

      deleteStory: (storyId) => {
        set((state) => ({
          stories: state.stories.filter((s) => s.id !== storyId),
          archivedStories: state.archivedStories.filter((s) => s.id !== storyId),
        }));
        pushToServer("DELETE_STORY", { storyId });
      },

      archiveStory: (storyId) => {
        const target = get().stories.find((s) => s.id === storyId);
        if (!target) return;
        set((state) => ({
          stories: state.stories.filter((s) => s.id !== storyId),
          archivedStories: [target, ...state.archivedStories],
        }));
      },

      unarchiveStory: (storyId) => {
        const target = get().archivedStories.find((s) => s.id === storyId);
        if (!target) return;
        set((state) => ({
          archivedStories: state.archivedStories.filter((s) => s.id !== storyId),
          stories: [target, ...state.stories],
        }));
      },

      markStoryViewed: (storyId) => {
        const stories = get().stories;
        const target = stories.find((s) => s.id === storyId);
        const currentUser = get().currentUser;
        if (!target) return;

        // Catat penonton story (unik per user)
        const existingViewers = target.viewers || [];
        const alreadyViewed = existingViewers.some((v) => v.userId === currentUser.id);
        const nextViewers = alreadyViewed
          ? existingViewers
          : [
              ...existingViewers,
              {
                userId: currentUser.id,
                username: currentUser.username,
                name: currentUser.name,
                avatarUrl: currentUser.avatarUrl,
                viewedAt: new Date().toISOString(),
                hasLiked: target.isLiked,
              },
            ];

        set((state) => ({
          stories: state.stories.map((s) =>
            s.id === storyId
              ? {
                  ...s,
                  isViewed: true,
                  viewsCount: Math.max(s.viewsCount || 0, nextViewers.length),
                  viewers: nextViewers,
                }
              : s
          ),
        }));

        if (!alreadyViewed) {
          pushToServer("STORY_VIEW", {
            storyId,
            viewer: {
              userId: currentUser.id,
              username: currentUser.username,
              name: currentUser.name,
              avatarUrl: currentUser.avatarUrl,
              viewedAt: new Date().toISOString(),
            },
          });
        }
      },

      toggleStoryLike: (storyId) => {
        const currentUser = get().currentUser;
        set((state) => {
          let newNotif: NotificationItem | null = null;
          const updatedStories = state.stories.map((s) => {
            if (s.id === storyId) {
              const isLiked = !s.isLiked;
              const count = s.likesCount || 0;

              if (isLiked && s.userId !== currentUser.id) {
                newNotif = {
                  id: `notif-story-like-${Date.now()}`,
                  recipientId: s.userId,
                  type: "like",
                  title: "Menyukai cerita Anda",
                  description: `${currentUser.name} menyukai cerita yang Anda bagikan.`,
                  actor: {
                    name: currentUser.name,
                    username: currentUser.username,
                    avatarUrl: currentUser.avatarUrl,
                  },
                  read: false,
                  createdAt: new Date().toISOString(),
                  category: "interaction",
                };
              }

              // Update status like di daftar penonton
              const updatedViewers = (s.viewers || []).map((v) =>
                v.userId === currentUser.id ? { ...v, hasLiked: isLiked } : v
              );

              return {
                ...s,
                isLiked,
                likesCount: isLiked ? count + 1 : Math.max(0, count - 1),
                viewers: updatedViewers,
              };
            }
            return s;
          });

          return {
            stories: updatedStories,
            notifications: newNotif ? [newNotif, ...state.notifications] : state.notifications,
          };
        });
      },

      // Messaging
      conversations: initialConversations,
      activeConversationId: "conv-bot",
      messages: initialMessages,
      clearedConversations: {},
      typingStatus: {},
      setTypingStatus: (status) => set({ typingStatus: status }),
      incomingCall: null,
      setIncomingCall: (call) => set({ incomingCall: call }),
      activeCallSignal: null,
      setActiveCallSignal: (sig) => set({ activeCallSignal: sig }),
      isMobileChatOpen: false,
      setIsMobileChatOpen: (open) => set({ isMobileChatOpen: open }),

      setActiveConversationId: (id) => {
        set((state) => ({
          activeConversationId: id,
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, unreadCount: 0 } : c
          ),
        }));
      },

      getOrCreateConversation: (participant) => {
        const state = get();
        const myUsername = (state.currentUser.username || "").toLowerCase();
        const targetUsername = (participant.username || "").toLowerCase();

        // 1. Cek apakah percakapan dengan lawan bicara ini sudah ada
        const existing = state.conversations.find((c) => {
          if (c.participant.id === participant.id) return true;
          if (c.participant.username && c.participant.username.toLowerCase() === targetUsername) return true;
          if (c.creatorId === participant.id) return true;
          if (c.id === `dm_${[myUsername, targetUsername].sort().join("_")}`) return true;
          return false;
        });

        if (existing) {
          set({ activeConversationId: existing.id });
          return existing.id;
        }

        // 2. Gunakan ID percakapan deterministik (alfabetis username kedua pihak)
        // Sehingga Laptop dan iPhone otomatis menggunakan conversation ID yang persis sama
        const sortedUsernames = [myUsername, targetUsername].sort();
        const newConvId = `dm_${sortedUsernames.join("_")}`;

        const newConv: ConversationItem = {
          id: newConvId,
          creatorId: state.currentUser.id,
          participantIds: [state.currentUser.id, participant.id],
          participant: {
            id: participant.id,
            name: participant.name,
            username: participant.username,
            email: participant.email || `${participant.username}@connectreal.app`,
            avatarUrl: participant.avatarUrl,
            bannerUrl: participant.bannerUrl || "",
            bio: participant.bio || "",
            location: participant.location,
            links: participant.links,
            isOnline: Boolean(participant.isOnline),
            followersCount: participant.followersCount || 0,
            followingCount: participant.followingCount || 0,
            postsCount: participant.postsCount || 0,
          },
          isGroup: false,
          lastMessage: "Mulai percakapan baru",
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0,
        };

        set((s) => ({
          conversations: [newConv, ...s.conversations],
          activeConversationId: newConvId,
          messages: {
            ...s.messages,
            [newConvId]: s.messages[newConvId] || [],
          },
        }));

        return newConvId;
      },

      createGroupConversation: (groupName, participantUserIds) => {
        const state = get();
        const currentUserId = state.currentUser.id;
        const allParticipantIds = Array.from(new Set([currentUserId, ...participantUserIds]));

        const participantsList = allParticipantIds.map((id) => {
          if (id === currentUserId) return state.currentUser;
          const found =
            state.registeredUsers.find((u) => u.id === id) ||
            state.onlineUsers.find((u) => u.id === id);
          if (found) {
            return {
              id: found.id,
              name: found.name,
              username: found.username,
              email: found.email || "",
              avatarUrl: found.avatarUrl,
              isOnline: Boolean(found.isOnline),
            } as UserProfile;
          }
          return {
            id,
            name: "Pengguna",
            username: `user_${id.slice(-4)}`,
            email: "",
            avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${id}`,
            isOnline: false,
          } as UserProfile;
        });

        const newConvId = `conv-group-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const groupAvatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(groupName.trim())}`;

        const newConv: ConversationItem = {
          id: newConvId,
          creatorId: currentUserId,
          adminIds: [currentUserId],
          avatarUrl: groupAvatar,
          isGroup: true,
          groupName: groupName.trim(),
          participantIds: allParticipantIds,
          participants: participantsList,
          participant: {
            id: `group-${Date.now()}`,
            name: groupName.trim(),
            username: `group_${groupName.trim().toLowerCase().replace(/\s+/g, "_")}`,
            email: "",
            bio: `Grup Komunitas • ${allParticipantIds.length} Anggota`,
            avatarUrl: groupAvatar,
            followersCount: allParticipantIds.length,
            followingCount: 0,
            postsCount: 0,
            isOnline: true,
          },
          unreadCount: 0,
          lastMessage: `${state.currentUser.name} membuat grup "${groupName.trim()}"`,
          lastMessageAt: new Date().toISOString(),
        };

        const initialMsg: MessageItem = {
          id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          conversationId: newConvId,
          senderId: currentUserId,
          content: `${state.currentUser.name} membuat grup "${groupName.trim()}"`,
          type: "system",
          createdAt: new Date().toISOString(),
          isRead: true,
        };

        set((s) => ({
          conversations: [newConv, ...s.conversations],
          activeConversationId: newConvId,
          messages: {
            ...s.messages,
            [newConvId]: [initialMsg],
          },
        }));

        pushToServer("CREATE_CONVERSATION", { conversation: newConv });
        pushToServer("SEND_MESSAGE", { message: initialMsg, conversation: newConv });
        return newConvId;
      },

      updateGroupConversation: (conversationId, updates) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId ? { ...c, ...updates } : c
          ),
        }));
        pushToServer("UPDATE_CONVERSATION", { conversationId, updates });
      },

      leaveGroupConversation: (conversationId) => {
        const currentUserId = get().currentUser.id;
        set((s) => {
          const conv = s.conversations.find((c) => c.id === conversationId);
          if (!conv) return s;
          const updatedParticipantIds = (conv.participantIds || []).filter((id) => id !== currentUserId);
          const updatedParticipants = (conv.participants || []).filter((p) => p.id !== currentUserId);
          return {
            conversations: s.conversations.map((c) =>
              c.id === conversationId
                ? { ...c, participantIds: updatedParticipantIds, participants: updatedParticipants }
                : c
            ),
            activeConversationId: s.activeConversationId === conversationId ? "" : s.activeConversationId,
          };
        });
        pushToServer("UPDATE_CONVERSATION", {
          conversationId,
          updates: {
            removeParticipantId: currentUserId,
          },
        });
      },

      makeGroupAdmin: (conversationId, userId) => {
        const user =
          get().registeredUsers.find((u) => u.id === userId || u.username === userId) ||
          get().onlineUsers.find((u) => u.id === userId || u.username === userId);
        const identifiers = [userId];
        if (user?.id) identifiers.push(user.id);
        if (user?.username) identifiers.push(user.username);

        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id === conversationId) {
              const currentAdmins = c.adminIds || (c.creatorId ? [c.creatorId] : []);
              const nextAdmins = Array.from(new Set([...currentAdmins, ...identifiers]));
              return { ...c, adminIds: nextAdmins };
            }
            return c;
          }),
        }));
        const conv = get().conversations.find((c) => c.id === conversationId);
        if (conv) {
          pushToServer("UPDATE_CONVERSATION", {
            conversationId,
            updates: { adminIds: conv.adminIds },
          });
        }
      },

      removeGroupAdmin: (conversationId, userId) => {
        const user =
          get().registeredUsers.find((u) => u.id === userId || u.username === userId) ||
          get().onlineUsers.find((u) => u.id === userId || u.username === userId);
        const removeSet = new Set([userId, user?.id, user?.username].filter(Boolean));

        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id === conversationId) {
              const currentAdmins = c.adminIds || (c.creatorId ? [c.creatorId] : []);
              const nextAdmins = currentAdmins.filter((id) => !removeSet.has(id));
              return { ...c, adminIds: nextAdmins };
            }
            return c;
          }),
        }));
        const conv = get().conversations.find((c) => c.id === conversationId);
        if (conv) {
          pushToServer("UPDATE_CONVERSATION", {
            conversationId,
            updates: { adminIds: conv.adminIds },
          });
        }
      },

      updateGroupAvatar: (conversationId, avatarUrl) => {
        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id === conversationId) {
              return {
                ...c,
                avatarUrl,
                participant: {
                  ...c.participant,
                  avatarUrl,
                },
              };
            }
            return c;
          }),
        }));
        pushToServer("UPDATE_CONVERSATION", {
          conversationId,
          updates: {
            avatarUrl,
            participant: { avatarUrl },
          },
        });
      },

      sendMessage: (conversationId, content, extra) => {
        const textContent = content.trim();
        if (!textContent && !extra?.mediaUrl && !extra?.fileName && extra?.type !== "call_log") return;

        const currentUserId = get().currentUser.id;
        const msgType = extra?.type || (extra?.mediaUrl ? "image" : "text");
        const defaultContent =
          msgType === "call_log"
            ? extra?.callLog?.status === "completed"
              ? "Panggilan Selesai"
              : extra?.callLog?.status === "missed"
              ? "Panggilan Tak Terjawab"
              : "Panggilan Ditolak"
            : msgType === "audio"
            ? "Pesan Suara"
            : msgType === "file"
            ? extra?.fileName || "Berkas"
            : msgType === "system"
            ? textContent || "Pemberitahuan Sistem"
            : "Foto";

        const newMessage: MessageItem = {
          id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          conversationId,
          senderId: currentUserId,
          content: textContent || defaultContent,
          type: msgType,
          mediaUrl: extra?.mediaUrl,
          mediaUrls: extra?.mediaUrls,
          fileName: extra?.fileName,
          fileSize: extra?.fileSize,
          audioDuration: extra?.audioDuration,
          callLog: extra?.callLog,
          replyTo: extra?.replyTo,
          storyReply: extra?.storyReply,
          createdAt: new Date().toISOString(),
          isRead: false,
        };

        const lastPreview =
          msgType === "system"
            ? textContent
            : extra?.storyReply
            ? `Membalas cerita: ${textContent || "Merespons cerita"}`
            : textContent ||
              (msgType === "audio"
                ? "🎤 Pesan Suara"
                : msgType === "file"
                ? `📎 ${extra?.fileName || "Berkas"}`
                : "📷 Foto");

        set((state) => {
          const currentMsgs = state.messages[conversationId] || [];
          const convExists = state.conversations.some((c) => c.id === conversationId);

          let updatedConversations = state.conversations;
          if (convExists) {
            updatedConversations = state.conversations.map((c) =>
              c.id === conversationId
                ? {
                    ...c,
                    lastMessage: lastPreview,
                    lastMessageAt: new Date().toISOString(),
                  }
                : c
            );
          } else {
            const targetId = conversationId.replace(/^conv-/, "");
            const targetUser =
              state.registeredUsers.find((u) => u.id === targetId || u.username === targetId) ||
              state.onlineUsers.find((u) => u.id === targetId || u.username === targetId);

            if (targetUser) {
              const newConv: ConversationItem = {
                id: conversationId,
                participant: {
                  id: targetUser.id,
                  name: targetUser.name,
                  username: targetUser.username,
                  email: targetUser.email,
                  avatarUrl: targetUser.avatarUrl,
                  bannerUrl: targetUser.bannerUrl || "",
                  bio: targetUser.bio || "",
                  location: targetUser.location,
                  links: targetUser.links,
                  isOnline: true,
                  followersCount: targetUser.followersCount || 0,
                  followingCount: targetUser.followingCount || 0,
                  postsCount: targetUser.postsCount || 0,
                },
                isGroup: false,
                lastMessage: lastPreview,
                lastMessageAt: new Date().toISOString(),
                unreadCount: 0,
              };
              updatedConversations = [newConv, ...state.conversations];
            }
          }

          return {
            messages: {
              ...state.messages,
              [conversationId]: [...currentMsgs, newMessage],
            },
            conversations: updatedConversations,
          };
        });

        // Sinkronkan pesan dan percakapan ke server LAN untuk multi-device (Laptop <-> HP)
        const activeConv = get().conversations.find((c) => c.id === conversationId);
        pushToServer("SEND_MESSAGE", {
          message: newMessage,
          conversation: activeConv,
        });

        // Respons cerdas otomatis untuk ConnectBot AI
        if (conversationId === "conv-bot") {
          setTimeout(() => {
            const botReplyText = generateBotReply(textContent || extra?.fileName || "Halo");
            const botMsg: MessageItem = {
              id: `m-bot-${Date.now()}`,
              conversationId: "conv-bot",
              senderId: "user-bot",
              content: botReplyText,
              type: "text",
              createdAt: new Date().toISOString(),
              isRead: true,
            };

            set((state) => ({
              messages: {
                ...state.messages,
                "conv-bot": [...(state.messages["conv-bot"] || []), botMsg],
              },
              conversations: state.conversations.map((c) =>
                c.id === "conv-bot"
                  ? {
                      ...c,
                      lastMessage: botReplyText.slice(0, 48) + "...",
                      lastMessageAt: new Date().toISOString(),
                    }
                  : c
              ),
            }));
          }, 600);
        }
      },

      deleteMessage: (conversationId, messageId) => {
        get().deleteMessageForEveryone(conversationId, messageId);
      },

      deleteMessageForEveryone: (conversationId, messageId) => {
        set((state) => {
          const msgs = (state.messages[conversationId] || []).filter(
            (m) => m.id !== messageId
          );
          const lastMsg = msgs[msgs.length - 1];
          return {
            messages: {
              ...state.messages,
              [conversationId]: msgs,
            },
            conversations: state.conversations.map((c) =>
              c.id === conversationId
                ? {
                    ...c,
                    lastMessage: lastMsg?.content || "",
                    lastMessageAt: lastMsg?.createdAt || c.lastMessageAt,
                  }
                : c
            ),
          };
        });
        pushToServer("DELETE_MESSAGE", { conversationId, messageId, forEveryone: true });
      },

      deleteMessageForMe: (conversationId, messageId) => {
        const currentUserId = get().currentUser?.id;
        set((state) => {
          const currentMsgs = state.messages[conversationId] || [];
          const updatedMsgs = currentMsgs
            .map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    deletedForUsers: [...(m.deletedForUsers || []), currentUserId],
                  }
                : m
            )
            .filter((m) => !(m.deletedForUsers || []).includes(currentUserId));

          const lastMsg = updatedMsgs[updatedMsgs.length - 1];
          return {
            messages: {
              ...state.messages,
              [conversationId]: updatedMsgs,
            },
            conversations: state.conversations.map((c) =>
              c.id === conversationId
                ? {
                    ...c,
                    lastMessage: lastMsg?.content || "",
                    lastMessageAt: lastMsg?.createdAt || c.lastMessageAt,
                  }
                : c
            ),
          };
        });
        pushToServer("DELETE_MESSAGE_FOR_ME", { conversationId, messageId, userId: currentUserId });
      },

      editMessage: (conversationId, messageId, newContent) => {
        const editedAt = Date.now();
        set((state) => {
          const msgs = (state.messages[conversationId] || []).map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  content: newContent,
                  isEdited: true,
                  editedAt,
                }
              : m
          );
          const lastMsg = msgs[msgs.length - 1];
          return {
            messages: {
              ...state.messages,
              [conversationId]: msgs,
            },
            conversations: state.conversations.map((c) =>
              c.id === conversationId
                ? {
                    ...c,
                    lastMessage: lastMsg?.id === messageId ? newContent : c.lastMessage,
                  }
                : c
            ),
          };
        });
        pushToServer("EDIT_MESSAGE", { conversationId, messageId, newContent, editedAt });
      },

      clearConversation: (conversationId) => {
        const currentUserId = get().currentUser.id;
        const now = Date.now();
        set((state) => {
          const userCleared = { ...(state.clearedConversations[currentUserId] || {}) };
          userCleared[conversationId] = now;

          return {
            messages: {
              ...state.messages,
              [conversationId]: [],
            },
            conversations: state.conversations.map((c) =>
              c.id === conversationId
                ? {
                    ...c,
                    lastMessage: "",
                    unreadCount: 0,
                  }
                : c
            ),
            clearedConversations: {
              ...state.clearedConversations,
              [currentUserId]: userCleared,
            },
          };
        });
        pushToServer("CLEAR_CHAT", { conversationId, userId: currentUserId });
      },

      deleteConversation: (conversationId) => {
        const currentUserId = get().currentUser.id;
        const now = Date.now();
        set((state) => {
          const newMessages = { ...state.messages };
          delete newMessages[conversationId];

          const userCleared = { ...(state.clearedConversations[currentUserId] || {}) };
          userCleared[conversationId] = now;

          return {
            conversations: state.conversations.filter((c) => c.id !== conversationId),
            messages: newMessages,
            activeConversationId:
              state.activeConversationId === conversationId ? "" : state.activeConversationId,
            isMobileChatOpen:
              state.activeConversationId === conversationId ? false : state.isMobileChatOpen,
            clearedConversations: {
              ...state.clearedConversations,
              [currentUserId]: userCleared,
            },
          };
        });
        pushToServer("DELETE_CONVERSATION", { conversationId, userId: currentUserId });
      },

      addReaction: (conversationId, messageId, emoji) => {
        const currentUserId = get().currentUser.id;
        set((state) => {
          const msgs = (state.messages[conversationId] || []).map((m) => {
            if (m.id !== messageId) return m;
            const existingReactions = m.reactions || [];
            const reactionIndex = existingReactions.findIndex((r) => r.emoji === emoji);
            const newReactions = [...existingReactions];

            if (reactionIndex > -1) {
              const r = newReactions[reactionIndex];
              const hasUserReacted = r.users.includes(currentUserId);
              if (hasUserReacted) {
                const filteredUsers = r.users.filter((u) => u !== currentUserId);
                if (filteredUsers.length === 0) {
                  newReactions.splice(reactionIndex, 1);
                } else {
                  newReactions[reactionIndex] = {
                    ...r,
                    count: r.count - 1,
                    users: filteredUsers,
                  };
                }
              } else {
                newReactions[reactionIndex] = {
                  ...r,
                  count: r.count + 1,
                  users: [...r.users, currentUserId],
                };
              }
            } else {
              newReactions.push({
                emoji,
                count: 1,
                users: [currentUserId],
              });
            }

            return {
              ...m,
              reactions: newReactions,
            };
          });

          return {
            messages: {
              ...state.messages,
              [conversationId]: msgs,
            },
          };
        });
        pushToServer("ADD_REACTION", {
          conversationId,
          messageId,
          emoji,
          userId: currentUserId,
        });
      },

      forwardMessage: (targetConversationId, message) => {
        get().sendMessage(targetConversationId, message.content, {
          type: message.type,
          mediaUrl: message.mediaUrl,
          fileName: message.fileName,
          fileSize: message.fileSize,
          audioDuration: message.audioDuration,
        });
      },

      // Notifications
      notifications: initialNotifications,
      addNotification: (notification) => {
        const newNotif: NotificationItem = {
          ...notification,
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => {
          const filtered = state.notifications.filter((n) => {
            if (
              n.type === newNotif.type &&
              n.recipientId === newNotif.recipientId &&
              (n.actor?.id === newNotif.actor?.id ||
                (n.actor?.username && n.actor.username.toLowerCase() === newNotif.actor?.username?.toLowerCase()))
            ) {
              return false;
            }
            return true;
          });
          return {
            notifications: [newNotif, ...filtered],
          };
        });
      },
      markAllNotificationsAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },
      markNotificationAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      // Explore & Search
      recentSearches: ["Next.js 16", "TypeScript", "Nadia Putri", "Tailwind CSS"],
      addRecentSearch: (query) => {
        if (!query.trim()) return;
        set((state) => {
          const filtered = state.recentSearches.filter(
            (item) => item.toLowerCase() !== query.toLowerCase()
          );
          return { recentSearches: [query, ...filtered].slice(0, 8) };
        });
      },
      removeRecentSearch: (query) => {
        set((state) => ({
          recentSearches: state.recentSearches.filter((item) => item !== query),
        }));
      },
      clearRecentSearches: () => set({ recentSearches: [] }),

      // Security & Privacy Settings
      twoFactorEnabled: false,
      readReceiptsEnabled: true,
      showOnlineStatus: true,
      isPrivateAccount: false,
      onlineVisibility: "everyone",
      notificationPrefs: {
        messages: true,
        interactions: true,
        sounds: false,
      },
      blockedUsers: [],
      phoneNumber: "",
      activeSessions: [getRealCurrentSession()],
      chatCustomization: {
        bubbleColor: "blue",
        wallpaper: "default",
      },
      setChatCustomization: (settings) =>
        set((state) => ({
          chatCustomization: {
            ...state.chatCustomization,
            ...settings,
          },
        })),
      toggle2FA: () =>
        set((state) => ({ twoFactorEnabled: !state.twoFactorEnabled })),
      toggleReadReceipts: () =>
        set((state) => ({ readReceiptsEnabled: !state.readReceiptsEnabled })),
      toggleShowOnlineStatus: () =>
        set((state) => {
          const nextVal = !state.showOnlineStatus;
          const updatedCurrent = {
            ...state.currentUser,
            showOnlineStatus: nextVal,
          };
          pushToServer("UPDATE_USER", updatedCurrent);
          return {
            showOnlineStatus: nextVal,
            currentUser: updatedCurrent,
            registeredUsers: state.registeredUsers.map((u) =>
              u.id === state.currentUser.id ? { ...u, showOnlineStatus: nextVal } : u
            ),
          };
        }),
      togglePrivateAccount: () =>
        set((state) => {
          const nextVal = !state.isPrivateAccount;
          const updatedCurrent = {
            ...state.currentUser,
            isPrivate: nextVal,
          };
          pushToServer("UPDATE_USER", updatedCurrent);
          return {
            isPrivateAccount: nextVal,
            currentUser: updatedCurrent,
            registeredUsers: state.registeredUsers.map((u) =>
              u.id === state.currentUser.id ? { ...u, isPrivate: nextVal } : u
            ),
          };
        }),
      setOnlineVisibility: (val) =>
        set((state) => {
          const updatedCurrent = {
            ...state.currentUser,
            onlineVisibility: val,
          };
          pushToServer("UPDATE_USER", updatedCurrent);
          return {
            onlineVisibility: val,
            currentUser: updatedCurrent,
            registeredUsers: state.registeredUsers.map((u) =>
              u.id === state.currentUser.id ? { ...u, onlineVisibility: val } : u
            ),
          };
        }),
      toggleNotificationPref: (key) =>
        set((state) => ({
          notificationPrefs: {
            ...state.notificationPrefs,
            [key]: !state.notificationPrefs[key],
          },
        })),
      blockUser: (user) =>
        set((state) => {
          const exists = state.blockedUsers.some(
            (u) => u.id === user.id || u.username === user.username
          );
          if (exists) return state;
          return {
            blockedUsers: [user, ...state.blockedUsers],
          };
        }),
      unblockUser: (id) =>
        set((state) => ({
          blockedUsers: state.blockedUsers.filter((u) => u.id !== id),
        })),
      deleteContact: (conversationId, participantId) => {
        get().deleteConversation(conversationId);
        set((state) => ({
          onlineUsers: state.onlineUsers.filter((u) => u.id !== participantId),
        }));
      },
      updatePhoneNumber: (phoneNumber) =>
        set((state) => ({
          phoneNumber,
          currentUser: {
            ...state.currentUser,
            phone: phoneNumber,
          },
          registeredUsers: state.registeredUsers.map((u) =>
            u.id === state.currentUser.id ? { ...u, phone: phoneNumber } : u
          ),
        })),
      terminateSession: (sessionId) => {
        set((state) => ({
          activeSessions: state.activeSessions.filter((s) => s.id !== sessionId),
        }));
      },
      clearAppCache: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("connectreal-storage");
          sessionStorage.clear();
          window.location.reload();
        }
      },

      // Modal Dialogs
      isLogoutModalOpen: false,
      isEditProfileOpen: false,
      setLogoutModalOpen: (open) => set({ isLogoutModalOpen: open }),
      setEditProfileOpen: (open) => set({ isEditProfileOpen: open }),
    }),
    {
      name: "connectreal-storage",
      version: 6,
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            return str ? JSON.parse(str) : null;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            if (value && (value as any).state) {
              const s = (value as any).state;
              sanitizePersistedStore(s);
            }
            localStorage.setItem(name, JSON.stringify(value));
          } catch {
            // Tangani QuotaExceededError dengan tenang dan simpan data esensial saja tanpa crash
            try {
              if (value && (value as any).state) {
                const minimalState = {
                  state: {
                    theme: (value as any).state.theme,
                    currentUser: (value as any).state.currentUser,
                    isAuthenticated: (value as any).state.isAuthenticated,
                    language: (value as any).state.language,
                  },
                  version: (value as any).version,
                };
                localStorage.setItem(name, JSON.stringify(minimalState));
              }
            } catch {}
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch {}
        },
      },
      migrate: (persistedState: any) => {
        return sanitizePersistedStore(persistedState);
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          sanitizePersistedStore(state);
        }
      },
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        isAuthenticated: state.isAuthenticated,
        currentUser: state.currentUser,
        registeredUsers: state.registeredUsers,
        posts: state.posts,
        archivedPosts: state.archivedPosts,
        userBookmarks: state.userBookmarks,
        onlineUsers: state.onlineUsers,
        stories: state.stories,
        archivedStories: state.archivedStories,
        storyUploadQuality: state.storyUploadQuality,
        conversations: state.conversations,
        messages: state.messages,
        notifications: state.notifications,
        recentSearches: state.recentSearches,
        twoFactorEnabled: state.twoFactorEnabled,
        readReceiptsEnabled: state.readReceiptsEnabled,
        showOnlineStatus: state.showOnlineStatus,
        isPrivateAccount: state.isPrivateAccount,
        onlineVisibility: state.onlineVisibility,
        notificationPrefs: state.notificationPrefs,
        blockedUsers: state.blockedUsers,
        phoneNumber: state.phoneNumber,
        activeSessions: state.activeSessions,
        chatCustomization: state.chatCustomization,
        clearedConversations: state.clearedConversations,
      }),
    }
  )
);

export function useHasHydrated() {
  const [hasHydrated, setHasHydrated] = useState(false);
  useEffect(() => {
    setHasHydrated(true);
  }, []);
  return hasHydrated;
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "connectreal-storage") {
      useAppStore.persist.rehydrate();
    }
  });
}

