import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "sync_store.json");

interface ServerSyncStore {
  registeredUsers: any[];
  conversations: any[];
  messages: Record<string, any[]>;
  notifications: any[];
  posts: any[];
  stories: any[];
  typingStatus?: Record<string, Record<string, number>>;
  callSignals?: any[];
  clearedConversations?: Record<string, Record<string, number>>;
  lastUpdated: number;
}

const defaultStore: ServerSyncStore = {
  registeredUsers: [],
  conversations: [],
  messages: {},
  notifications: [],
  posts: [],
  stories: [],
  typingStatus: {},
  callSignals: [],
  clearedConversations: {},
  lastUpdated: Date.now(),
};

// Cache di memori Node.js agar respon GET / POST < 1ms tanpa terhambat I/O disk Windows
let memoryStore: ServerSyncStore | null = null;
let saveDebounceTimer: NodeJS.Timeout | null = null;

async function getStore(): Promise<ServerSyncStore> {
  if (memoryStore) return memoryStore;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    memoryStore = JSON.parse(raw);
    return memoryStore!;
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    memoryStore = { ...defaultStore, lastUpdated: Date.now() };
    await fs.writeFile(DATA_FILE, JSON.stringify(memoryStore, null, 2), "utf-8");
    return memoryStore;
  }
}

function saveStore(store: ServerSyncStore) {
  store.lastUpdated = Date.now();
  memoryStore = store;

  // Tulis ke disk di latar belakang tanpa memblokir respons HTTP (0ms latency)
  if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(async () => {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
    } catch (e) {
      console.warn("Async disk save error:", e);
    }
  }, 250);
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const since = Number(url.searchParams.get("since") || 0);
    const store = await getStore();

    // Optimasi Hosting: Jika data tidak berubah sejak 'since', kembalikan respon ultra-ringan
    // untuk mencegah lonjakan CPU server, lag transmisi JSON, dan penggunaan bandwidth berlebih
    if (since > 0 && store.lastUpdated <= since) {
      return NextResponse.json({
        success: true,
        notModified: true,
        lastUpdated: store.lastUpdated,
        typingStatus: store.typingStatus,
        callSignals: store.callSignals,
      });
    }

    return NextResponse.json({
      success: true,
      data: store,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to read sync store" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;
    const store = await getStore();

    switch (action) {
      case "UPDATE_USER":
      case "REGISTER_USER": {
        const user = payload;
        if (user && (user.id || user.username)) {
          const now = Date.now();
          const userWithTimestamp = {
            ...user,
            updatedAt: now,
            createdAt: user.createdAt || new Date().toISOString(),
          };
          const idx = store.registeredUsers.findIndex(
            (u) =>
              (user.id && u.id === user.id) ||
              (user.username && u.username.toLowerCase() === user.username.toLowerCase())
          );
          if (idx >= 0) {
            store.registeredUsers[idx] = { ...store.registeredUsers[idx], ...userWithTimestamp };
          } else {
            store.registeredUsers.push(userWithTimestamp);
          }

          // Perbarui avatar dan nama penulis di semua postingan yang dibuat pengguna ini
          if (Array.isArray(store.posts)) {
            for (let i = 0; i < store.posts.length; i++) {
              const p = store.posts[i];
              if (
                (user.id && p.author.id === user.id) ||
                (user.username && p.author.username.toLowerCase() === user.username.toLowerCase())
              ) {
                store.posts[i] = {
                  ...p,
                  author: {
                    ...p.author,
                    name: user.name || p.author.name,
                    avatarUrl: user.avatarUrl || p.author.avatarUrl,
                  },
                };
              }
            }
          }

          // Perbarui percakapan yang melibatkan pengguna ini
          if (Array.isArray(store.conversations)) {
            for (let i = 0; i < store.conversations.length; i++) {
              const c = store.conversations[i];
              if (
                c.participant &&
                ((user.id && c.participant.id === user.id) ||
                  (user.username && c.participant.username.toLowerCase() === user.username.toLowerCase()))
              ) {
                store.conversations[i] = {
                  ...c,
                  participant: {
                    ...c.participant,
                    name: user.name || c.participant.name,
                    avatarUrl: user.avatarUrl || c.participant.avatarUrl,
                  },
                };
              }
            }
          }
        }
        break;
      }

      case "SEND_MESSAGE": {
        const { message, conversation } = payload;
        if (message && message.conversationId) {
          const convId = message.conversationId;
          if (!store.messages[convId]) {
            store.messages[convId] = [];
          }
          // Cek duplikasi message ID
          const msgIdx = store.messages[convId].findIndex((m) => m.id === message.id);
          if (msgIdx === -1) {
            store.messages[convId].push(message);
          } else {
            store.messages[convId][msgIdx] = message;
          }

          // Perbarui atau tambahkan percakapan
          if (conversation) {
            const convIdx = store.conversations.findIndex((c) => c.id === conversation.id);
            if (convIdx >= 0) {
              store.conversations[convIdx] = {
                ...store.conversations[convIdx],
                ...conversation,
                lastMessage: message.content,
                lastMessageAt: message.createdAt,
              };
            } else {
              store.conversations.unshift(conversation);
            }
          }
        }
        break;
      }

      case "EDIT_MESSAGE": {
        const { conversationId, messageId, newContent, editedAt } = payload || {};
        if (conversationId && messageId && store.messages[conversationId]) {
          const msgIdx = store.messages[conversationId].findIndex((m) => m.id === messageId);
          if (msgIdx >= 0) {
            store.messages[conversationId][msgIdx] = {
              ...store.messages[conversationId][msgIdx],
              content: newContent,
              isEdited: true,
              editedAt: editedAt || Date.now(),
            };
          }
          const msgs = store.messages[conversationId];
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg?.id === messageId) {
            const conv = store.conversations.find((c) => c.id === conversationId);
            if (conv) conv.lastMessage = newContent;
          }
        }
        break;
      }

      case "DELETE_MESSAGE": {
        const { conversationId, messageId } = payload || {};
        if (conversationId && messageId && store.messages[conversationId]) {
          store.messages[conversationId] = store.messages[conversationId].filter((m) => m.id !== messageId);
          const msgs = store.messages[conversationId];
          const lastMsg = msgs[msgs.length - 1];
          const conv = store.conversations.find((c) => c.id === conversationId);
          if (conv) {
            conv.lastMessage = lastMsg?.content || "";
            conv.lastMessageAt = lastMsg?.createdAt || conv.lastMessageAt;
          }
        }
        break;
      }

      case "DELETE_MESSAGE_FOR_ME": {
        const { conversationId, messageId, userId } = payload || {};
        if (conversationId && messageId && store.messages[conversationId] && userId) {
          const msg = store.messages[conversationId].find((m) => m.id === messageId);
          if (msg) {
            if (!Array.isArray(msg.deletedForUsers)) msg.deletedForUsers = [];
            if (!msg.deletedForUsers.includes(userId)) msg.deletedForUsers.push(userId);
          }
        }
        break;
      }

      case "DELETE_CONVERSATION": {
        const { conversationId, userId } = payload || {};
        if (conversationId) {
          store.conversations = store.conversations.filter((c) => c.id !== conversationId);
          delete store.messages[conversationId];
          if (!store.clearedConversations) store.clearedConversations = {};
          if (userId) {
            if (!store.clearedConversations[userId]) store.clearedConversations[userId] = {};
            store.clearedConversations[userId][conversationId] = Date.now();
          }
        }
        break;
      }

      case "CLEAR_CHAT": {
        const { conversationId, userId } = payload || {};
        if (conversationId) {
          store.messages[conversationId] = [];
          if (!store.clearedConversations) store.clearedConversations = {};
          if (userId) {
            if (!store.clearedConversations[userId]) store.clearedConversations[userId] = {};
            store.clearedConversations[userId][conversationId] = Date.now();
          }
        }
        break;
      }

      case "CREATE_CONVERSATION": {
        const { conversation } = payload || {};
        if (conversation && conversation.id) {
          const idx = store.conversations.findIndex((c) => c.id === conversation.id);
          if (idx >= 0) {
            store.conversations[idx] = { ...store.conversations[idx], ...conversation };
          } else {
            store.conversations.unshift(conversation);
          }
        }
        break;
      }

      case "UPDATE_CONVERSATION": {
        const { conversationId, updates } = payload || {};
        if (conversationId && updates) {
          const idx = store.conversations.findIndex((c) => c.id === conversationId);
          if (idx >= 0) {
            const current = store.conversations[idx];
            // Jika ada aksi removeParticipantId
            let updatedParticipantIds = current.participantIds || [];
            if (updates.removeParticipantId) {
              updatedParticipantIds = updatedParticipantIds.filter((id: string) => id !== updates.removeParticipantId);
              delete updates.removeParticipantId;
            }
            const currentParticipant = current.participant || {};
            const nextParticipant = {
              ...currentParticipant,
              ...(updates.participant || {}),
              name: updates.groupName || updates.participant?.name || currentParticipant.name,
              avatarUrl: updates.avatarUrl || updates.participant?.avatarUrl || currentParticipant.avatarUrl,
            };

            store.conversations[idx] = {
              ...current,
              ...updates,
              participantIds: updates.participantIds || updatedParticipantIds,
              participant: nextParticipant,
            };
          }
        }
        break;
      }

      case "ADD_REACTION": {
        const { conversationId, messageId, emoji, userId } = payload || {};
        if (conversationId && messageId && store.messages[conversationId] && emoji && userId) {
          const msg = store.messages[conversationId].find((m) => m.id === messageId);
          if (msg) {
            if (!Array.isArray(msg.reactions)) msg.reactions = [];
            const reactionIdx = msg.reactions.findIndex((r: any) => r.emoji === emoji);
            if (reactionIdx > -1) {
              const r = msg.reactions[reactionIdx];
              if (r.users.includes(userId)) {
                r.users = r.users.filter((u: string) => u !== userId);
                r.count = r.users.length;
                if (r.count <= 0) {
                  msg.reactions.splice(reactionIdx, 1);
                }
              } else {
                r.users.push(userId);
                r.count = r.users.length;
              }
            } else {
              msg.reactions.push({
                emoji,
                count: 1,
                users: [userId],
              });
            }
          }
        }
        break;
      }

      case "ADD_NOTIFICATION": {
        const notification = payload;
        if (notification && notification.id) {
          // Cegah duplikasi notifikasi (misal aksi follow berkali-kali)
          const notifIdx = store.notifications.findIndex((n) => {
            if (n.id === notification.id) return true;
            if (
              n.type === notification.type &&
              n.recipientId === notification.recipientId &&
              (n.actor?.id === notification.actor?.id ||
                (n.actor?.username && n.actor.username.toLowerCase() === notification.actor?.username?.toLowerCase()))
            ) {
              return true;
            }
            return false;
          });

          if (notifIdx >= 0) {
            // Perbarui waktu notifikasi lama dan letakkan di posisi teratas
            const existing = store.notifications[notifIdx];
            store.notifications.splice(notifIdx, 1);
            store.notifications.unshift({
              ...existing,
              ...notification,
              read: false,
              createdAt: notification.createdAt || new Date().toISOString(),
            });
          } else {
            store.notifications.unshift(notification);
          }
        }
        break;
      }

      case "CREATE_POST": {
        const post = payload;
        if (post && post.id) {
          const postIdx = store.posts.findIndex((p) => p.id === post.id);
          if (postIdx === -1) {
            store.posts.unshift(post);
          }
        }
        break;
      }

      case "ADD_COMMENT": {
        const { postId, comment } = payload;
        if (postId && comment && comment.id) {
          const targetPost = store.posts.find((p) => p.id === postId);
          if (targetPost) {
            if (!Array.isArray(targetPost.comments)) {
              targetPost.comments = [];
            }
            const cIdx = targetPost.comments.findIndex((c: any) => c.id === comment.id);
            if (cIdx === -1) {
              targetPost.comments.push(comment);
              targetPost.commentsCount = (targetPost.commentsCount || 0) + 1;
            } else {
              targetPost.comments[cIdx] = comment;
            }
          }
        }
        break;
      }

      case "CREATE_STORY": {
        const story = payload;
        if (story && story.id) {
          const storyIdx = store.stories.findIndex((s) => s.id === story.id);
          if (storyIdx === -1) {
            store.stories.unshift(story);
          }
        }
        break;
      }

      case "DELETE_STORY": {
        const { storyId } = payload || {};
        if (storyId && Array.isArray(store.stories)) {
          store.stories = store.stories.filter((s) => s.id !== storyId);
        }
        break;
      }

      case "STORY_VIEW": {
        const { storyId, viewer } = payload || {};
        if (storyId && viewer && Array.isArray(store.stories)) {
          const story = store.stories.find((s) => s.id === storyId);
          if (story) {
            if (!Array.isArray(story.viewers)) story.viewers = [];
            const exists = story.viewers.some((v: any) => v.userId === viewer.userId);
            if (!exists) {
              story.viewers.push(viewer);
              story.viewsCount = story.viewers.length;
            }
          }
        }
        break;
      }

      case "TOGGLE_LIKE": {
        const { postId, userId, isLiked } = payload || {};
        if (postId && Array.isArray(store.posts)) {
          const p = store.posts.find((x) => x.id === postId);
          if (p) {
            if (!Array.isArray(p.likedBy)) p.likedBy = [];
            if (userId) {
              if (isLiked) {
                if (!p.likedBy.includes(userId)) p.likedBy.push(userId);
              } else {
                p.likedBy = p.likedBy.filter((id: string) => id !== userId);
              }
            }
            p.likesCount = p.likedBy.length;
          }
        }
        break;
      }

      case "TOGGLE_REPOST": {
        const { postId, userId, isReposted } = payload || {};
        if (postId && Array.isArray(store.posts)) {
          const p = store.posts.find((x) => x.id === postId);
          if (p) {
            if (!Array.isArray(p.repostedBy)) p.repostedBy = [];
            if (userId) {
              if (isReposted) {
                if (!p.repostedBy.includes(userId)) p.repostedBy.push(userId);
              } else {
                p.repostedBy = p.repostedBy.filter((id: string) => id !== userId);
              }
            }
            p.repostsCount = p.repostedBy.length;
          }
        }
        break;
      }

      case "TYPING_STATUS": {
        const { conversationId, userId, username, isTyping } = payload;
        if (conversationId && (userId || username)) {
          if (!store.typingStatus) store.typingStatus = {};
          if (!store.typingStatus[conversationId]) store.typingStatus[conversationId] = {};
          const now = Date.now();
          if (userId) store.typingStatus[conversationId][userId] = isTyping ? now : 0;
          if (username) store.typingStatus[conversationId][username] = isTyping ? now : 0;
        }
        break;
      }

      case "CALL_SIGNAL": {
        const signal = payload;
        if (
          signal &&
          (signal.from || signal.fromUsername) &&
          (signal.to || signal.toUsername || signal.targetUsername || signal.convId)
        ) {
          if (!store.callSignals) store.callSignals = [];
          const now = Date.now();

          // 1. Hapus sinyal usang (> 25 detik)
          store.callSignals = store.callSignals.filter((s: any) => now - (s.createdAt || 0) < 25000);

          const matchesPair = (s: any) => {
            if (signal.convId && s.convId && signal.convId === s.convId) return true;
            const from1 = (signal.fromUsername || signal.from || "").toLowerCase();
            const to1 = (signal.toUsername || signal.to || signal.targetUsername || "").toLowerCase();
            const from2 = (s.fromUsername || s.from || "").toLowerCase();
            const to2 = (s.toUsername || s.to || s.targetUsername || "").toLowerCase();
            return (
              from1 && to1 && ((from1 === from2 && to1 === to2) || (from1 === to2 && to1 === from2))
            );
          };

          if (signal.type === "ring") {
            // Hapus sinyal ring atau end/decline sebelumnya untuk pasangan ini agar tidak ada duplikasi dering
            store.callSignals = store.callSignals.filter(
              (s: any) => !(matchesPair(s) && (s.type === "ring" || s.type === "end" || s.type === "decline"))
            );
            store.callSignals.push({
              ...signal,
              id: signal.id || `ring-${now}-${Math.random().toString(36).slice(2, 6)}`,
              createdAt: now,
            });
          } else if (signal.type === "accept") {
            // Saat panggilan diangkat, HAPUS semua sinyal dering agar HP penerima dan pemanggil berhenti berdering
            store.callSignals = store.callSignals.filter((s: any) => !(s.type === "ring" && matchesPair(s)));
            store.callSignals.push({
              ...signal,
              id: signal.id || `sig-${now}-${Math.random().toString(36).slice(2, 6)}`,
              createdAt: now,
            });
          } else if (signal.type === "end" || signal.type === "decline") {
            // Saat panggilan diakhiri atau ditolak, BERSIHKAN SEMUA sinyal ring, offer, candidate untuk percakapan ini
            store.callSignals = store.callSignals.filter((s: any) => !matchesPair(s));
            // Tambahkan sinyal end/decline agar pihak seberang langsung menutup tampilan panggilan
            store.callSignals.push({
              ...signal,
              id: signal.id || `end-${now}-${Math.random().toString(36).slice(2, 6)}`,
              createdAt: now,
            });
          } else if (signal.type === "offer") {
            store.callSignals = store.callSignals.filter((s: any) => !(s.type === "offer" && matchesPair(s)));
            store.callSignals.push({
              ...signal,
              id: signal.id || `sig-${now}-${Math.random().toString(36).slice(2, 6)}`,
              createdAt: now,
            });
          } else if (signal.type === "answer") {
            store.callSignals = store.callSignals.filter((s: any) => !(s.type === "answer" && matchesPair(s)));
            store.callSignals.push({
              ...signal,
              id: signal.id || `sig-${now}-${Math.random().toString(36).slice(2, 6)}`,
              createdAt: now,
            });
          } else {
            store.callSignals.push({
              ...signal,
              id: signal.id || `sig-${now}-${Math.random().toString(36).slice(2, 6)}`,
              createdAt: now,
            });
          }
        }
        break;
      }

      case "BATCH_SYNC": {
        // Merging batch dari client baru
        if (Array.isArray(payload.registeredUsers)) {
          for (const u of payload.registeredUsers) {
            const idx = store.registeredUsers.findIndex(
              (x) =>
                (u.id && x.id === u.id) ||
                (u.username && x.username && x.username.toLowerCase() === u.username.toLowerCase())
            );
            if (idx === -1) {
              store.registeredUsers.push(u);
            } else {
              const current = store.registeredUsers[idx];
              const shouldUpdate =
                (u.updatedAt && (!current.updatedAt || u.updatedAt > current.updatedAt)) ||
                (!current.bio && u.bio) ||
                (!current.bannerUrl && u.bannerUrl);

              if (shouldUpdate) {
                store.registeredUsers[idx] = {
                  ...current,
                  ...u,
                  name: u.name || current.name,
                  avatarUrl: u.avatarUrl || current.avatarUrl,
                  bannerUrl: u.bannerUrl || current.bannerUrl,
                  bannerType: u.bannerType || current.bannerType,
                  bio: u.bio !== undefined ? u.bio : current.bio,
                  location: u.location !== undefined ? u.location : current.location,
                  links: u.links || current.links,
                };
              }
            }
          }
        }
        if (Array.isArray(payload.posts)) {
          for (const p of payload.posts) {
            if (!store.posts.some((x) => x.id === p.id)) {
              store.posts.push(p);
            }
          }
        }
        break;
      }

      default:
        break;
    }

    await saveStore(store);

    return NextResponse.json({
      success: true,
      lastUpdated: store.lastUpdated,
      data: store,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process sync" },
      { status: 500 }
    );
  }
}

