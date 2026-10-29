export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl: string;
  bannerUrl?: string;
  bannerType?: "image" | "video";
  bio: string;
  isOnline: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing?: boolean;
  location?: string;
  links?: string[];
  phone?: string;
  createdAt?: string;
  isPrivate?: boolean;
  showOnlineStatus?: boolean;
  onlineVisibility?: "everyone" | "followers" | "contacts" | "nobody";
}

export interface RegisteredUser {
  id: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  avatarUrl: string;
  bannerUrl?: string;
  bannerType?: "image" | "video";
  bio?: string;
  location?: string;
  links?: string[];
  phone?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  updatedAt?: number;
  createdAt?: string;
  isPrivate?: boolean;
  showOnlineStatus?: boolean;
  onlineVisibility?: "everyone" | "followers" | "contacts" | "nobody";
  isOnline?: boolean;
  isFollowing?: boolean;
}

export interface LyricLine {
  time: number; // Detik saat lirik dinyanyikan
  text: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl: string;
  duration: number; // Detik
  genre?: string;
  lyrics?: LyricLine[];
}

export interface PostItem {
  id: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string;
    isOnline?: boolean;
  };
  content: string;
  mediaUrl?: string;
  mediaUrls?: string[];
  filter?: string;
  taggedUsers?: string[];
  musicTrack?: MusicTrack;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  likedBy?: string[];
  repostedBy?: string[];
  isLiked: boolean;
  isReposted: boolean;
  isBookmarked: boolean;
  comments?: PostComment[];
}

export interface PostComment {
  id: string;
  author: {
    id?: string;
    name: string;
    username: string;
    avatarUrl: string;
  };
  content: string;
  createdAt: string;
  likesCount?: number;
  isLiked?: boolean;
  replyTo?: {
    commentId: string;
    username: string;
  };
  replies?: PostComment[];
}

export type SupportedLanguage =
  | "id"
  | "en-US"
  | "en-GB"
  | "ar"
  | "ja"
  | "ko"
  | "es"
  | "fr"
  | "de"
  | "zh";

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
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
  createdAt: string;
  isRead: boolean;
  isEdited?: boolean;
  editedAt?: number;
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
    type?: string;
  };
  reactions?: Array<{
    emoji: string;
    count: number;
    users: string[];
  }>;
  storyReply?: {
    storyId: string;
    mediaUrl: string;
    mediaType: "image" | "video";
    authorUsername: string;
  };
  deletedForUsers?: string[];
}

export interface TextOverlay {
  id: string;
  text: string;
  color: string;
  bgColor?: string;
  position: { x: number; y: number };
  fontSize?: number;
  fontFamily?: string;
}

export interface StickerOverlay {
  id: string;
  emoji: string;
  position: { x: number; y: number };
  size?: number;
}

export interface StoryMusic {
  title: string;
  artist?: string;
  audioUrl: string;
}

export interface StoryViewerUser {
  id?: string;
  userId: string;
  username: string;
  name: string;
  avatarUrl: string;
  viewedAt: string;
  hasLiked?: boolean;
}

export interface StoryItem {
  id: string;
  userId: string;
  user: {
    name: string;
    username: string;
    avatarUrl: string;
  };
  mediaUrl: string;
  mediaType: "image" | "video";
  videoDuration?: number;
  quality?: "low" | "medium" | "high";
  textOverlays?: TextOverlay[];
  stickers?: StickerOverlay[];
  music?: StoryMusic;
  musicTrack?: MusicTrack;
  createdAt: string;
  isViewed?: boolean;
  viewsCount?: number;
  likesCount?: number;
  isLiked?: boolean;
  commentsCount?: number;
  taggedUsers?: string[];
  tagPositions?: Record<string, { x: number; y: number }>;
  viewers?: StoryViewerUser[];
  visualFilter?: string;
  effectOverlay?: string;
}

export interface ConversationItem {
  id: string;
  participant: UserProfile;
  participants?: UserProfile[];
  participantIds?: string[];
  creatorId?: string;
  adminIds?: string[];
  avatarUrl?: string;
  isGroup: boolean;
  groupName?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export interface CallSignalItem {
  id: string;
  from: string;
  fromUsername?: string;
  to: string;
  toUsername?: string;
  targetUsername?: string;
  convId?: string;
  type: "offer" | "answer" | "candidate" | "ring" | "ringing" | "accept" | "decline" | "end";
  callType?: "voice" | "video";
  callerName?: string;
  callerAvatar?: string;
  payload?: any;
  createdAt: number;
}

export interface NotificationItem {
  id: string;
  recipientId?: string;
  type: "like" | "comment" | "repost" | "follow" | "security_alert" | "story_reply";
  title: string;
  description: string;
  actor?: {
    id?: string;
    name: string;
    username: string;
    avatarUrl: string;
  };
  read: boolean;
  createdAt: string;
  category: "interaction" | "system";
}

export interface TrendTopic {
  id: string;
  category: string;
  hashtag: string;
  postsCount: string;
}

export type ClearedConversationsMap = Record<string, Record<string, number>>;

