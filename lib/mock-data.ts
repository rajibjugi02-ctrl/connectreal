import { UserProfile, PostItem, ConversationItem, MessageItem, NotificationItem, TrendTopic, StoryItem } from "./types";

export const currentUser: UserProfile = {
  id: "user-current",
  name: "Pengguna Baru",
  username: "user_baru",
  email: "user@connectreal.app",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80",
  bannerUrl: "",
  bio: "",
  isOnline: true,
  followersCount: 0,
  followingCount: 0,
  postsCount: 0,
  phone: "",
};

// State Awal Bersih (Clean State) murni tanpa akun palsu atau interaksi bohongan
export const initialOnlineUsers: UserProfile[] = [];

export const initialPosts: PostItem[] = [];

export const initialConversations: ConversationItem[] = [];

export const initialMessages: Record<string, MessageItem[]> = {};

export const initialNotifications: NotificationItem[] = [];

export const initialStories: StoryItem[] = [];

export const initialTrends: TrendTopic[] = [];
