import { ConversationItem, UserProfile, RegisteredUser, MessageItem } from "@/lib/types";

/**
 * Menemukan lawan bicara yang sebenarnya dalam percakapan 1-on-1 (ala Instagram DM).
 * Memastikan nama dan foto yang tampil di header dan daftar chat BUKAN nama diri sendiri.
 */
export function getChatPartner(
  conv: ConversationItem | undefined,
  currentUser: UserProfile,
  registeredUsers: RegisteredUser[] = [],
  onlineUsers: UserProfile[] = [],
  messages: MessageItem[] = []
): UserProfile {
  if (!conv) {
    return {
      id: "unknown",
      name: "Pengguna",
      username: "user",
      email: "user@connectreal.app",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80",
      bannerUrl: "",
      bio: "",
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      isOnline: false,
    };
  }

  // Jika percakapan bertipe Grup, kembalikan profil entitas grup
  if (conv.isGroup) {
    const memberCount = conv.participantIds?.length || conv.participants?.length || 1;
    const groupTitle = conv.groupName || conv.participant?.name || "Grup Obrolan";
    return {
      id: conv.id,
      name: groupTitle,
      username: `group_${conv.id.slice(-4)}`,
      email: "",
      avatarUrl:
        conv.avatarUrl ||
        conv.participant?.avatarUrl ||
        `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(groupTitle)}`,
      bannerUrl: "",
      bio: `Grup Komunitas • ${memberCount} Anggota`,
      followersCount: memberCount,
      followingCount: 0,
      postsCount: 0,
      isOnline: true,
    };
  }

  const myId = currentUser?.id || "";
  const myUsername = (currentUser?.username || "").toLowerCase();

  // 1. Cek apakah conv.participant sudah merupakan lawan bicara (bukan diri sendiri)
  const isSelf =
    (conv.participant?.id && conv.participant.id === myId) ||
    (conv.participant?.username && conv.participant.username.toLowerCase() === myUsername);

  if (!isSelf && conv.participant && conv.participant.username) {
    // Sinkronkan data terbaru dari registeredUsers jika ada update avatar/nama
    const latest = registeredUsers.find(
      (u) =>
        (u.id && conv.participant?.id && u.id === conv.participant.id) ||
        (u.username && conv.participant?.username && u.username.toLowerCase() === conv.participant.username.toLowerCase())
    );
    if (latest) {
      return {
        ...conv.participant,
        name: latest.name || conv.participant.name || latest.username,
        avatarUrl: latest.avatarUrl || conv.participant.avatarUrl,
        bio: latest.bio ?? conv.participant.bio,
        location: latest.location ?? conv.participant.location,
      };
    }
    return conv.participant || {
    id: "user-fallback",
    name: "Pengguna",
    username: "user",
    email: "user@connectreal.app",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80",
    bannerUrl: "",
    bio: "",
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    isOnline: false,
  };
  }

  // 2. Jika conv.participant adalah diri kita sendiri (karena percakapan dibuat oleh pihak lawan dan dikirim ke server):
  // Temukan siapa lawan bicaranya:

  // a) Dari creatorId jika ada
  if (conv.creatorId && conv.creatorId !== myId) {
    const creator =
      registeredUsers.find((u) => u.id === conv.creatorId) ||
      onlineUsers.find((u) => u.id === conv.creatorId);
    if (creator) {
      return {
        id: creator.id,
        name: creator.name,
        username: creator.username,
        email: (creator as any).email || `${creator.username}@connectreal.app`,
        avatarUrl: creator.avatarUrl,
        bio: creator.bio || "",
        followersCount: creator.followersCount || 0,
        followingCount: creator.followingCount || 0,
        postsCount: creator.postsCount || 0,
        isOnline: (creator as any).isOnline ?? true,
      };
    }
  }

  // b) Dari riwayat pesan (siapa yang mengirim pesan selain diri kita)
  const otherMessage = messages.find(
    (m) => m.senderId && m.senderId !== myId
  );
  if (otherMessage) {
    const sender =
      registeredUsers.find((u) => u.id === otherMessage.senderId) ||
      onlineUsers.find((u) => u.id === otherMessage.senderId);
    if (sender) {
      return {
        id: sender.id,
        name: sender.name,
        username: sender.username,
        email: (sender as any).email || `${sender.username}@connectreal.app`,
        avatarUrl: sender.avatarUrl,
        bio: sender.bio || "",
        followersCount: sender.followersCount || 0,
        followingCount: sender.followingCount || 0,
        postsCount: sender.postsCount || 0,
        isOnline: (sender as any).isOnline ?? true,
      };
    }
  }

  // c) Dari ID percakapan jika berformat conv-[id/username]
  const targetId = conv.id.replace(/^conv-/, "");
  if (targetId && targetId !== myId && targetId.toLowerCase() !== myUsername) {
    const target =
      registeredUsers.find(
        (u) => u.id === targetId || u.username.toLowerCase() === targetId.toLowerCase()
      ) ||
      onlineUsers.find(
        (u) => u.id === targetId || u.username.toLowerCase() === targetId.toLowerCase()
      );
    if (target) {
      return {
        id: target.id,
        name: target.name,
        username: target.username,
        email: (target as any).email || `${target.username}@connectreal.app`,
        avatarUrl: target.avatarUrl,
        bio: target.bio || "",
        followersCount: target.followersCount || 0,
        followingCount: target.followingCount || 0,
        postsCount: target.postsCount || 0,
        isOnline: (target as any).isOnline ?? true,
      };
    }
  }

  return conv.participant || {
    id: "user-fallback",
    name: "Pengguna",
    username: "user",
    email: "user@connectreal.app",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80",
    bannerUrl: "",
    bio: "",
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    isOnline: false,
  };
}
