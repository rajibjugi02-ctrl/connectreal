/**
 * Client-Side Real-Time Synchronization Engine
 * Menjembatani sinkronisasi antar perangkat lokal (Laptop, Smartphone, Tablet)
 * sehingga 2 device yang membuka web di jaringan lokal dapat langsung saling kirim pesan & berinteraksi.
 */

import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { MessageItem, ConversationItem, NotificationItem, PostItem, StoryItem, CallSignalItem } from "@/lib/types";
import { getChatPartner } from "@/lib/utils/chatPartner";

let activeSyncTrigger: (() => void) | null = null;

export async function pushToServer(action: string, payload: any) {
  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });
    if (res.ok && activeSyncTrigger) {
      activeSyncTrigger();
    }
  } catch (err) {
    // Retry sekali jika koneksi lokal tertunda
    try {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });
      if (activeSyncTrigger) activeSyncTrigger();
    } catch { }
  }
}

export const dismissedCallIds = new Set<string>();

let hasInitialSynced = false;

export function useServerSync() {
  const lastSyncTimeRef = useRef<number>(0);
  const isSyncingRef = useRef<boolean>(false);

  useEffect(() => {
    // Siarkan profil aktif perangkat saat ini ke server LAN agar server selalu terbarui
    const initialCurrent = useAppStore.getState().currentUser;
    if (initialCurrent && initialCurrent.id && initialCurrent.username) {
      pushToServer("UPDATE_USER", initialCurrent);
    }

    // Sinkronisasi pertama hanya sekali per sesi browser
    if (!hasInitialSynced) {
      hasInitialSynced = true;
      const state = useAppStore.getState();
      const currentRegUsers = [...state.registeredUsers];
      if (initialCurrent && initialCurrent.id) {
        const idx = currentRegUsers.findIndex(
          (u) =>
            u.id === initialCurrent.id ||
            u.username.toLowerCase() === initialCurrent.username.toLowerCase()
        );
        if (idx >= 0) {
          currentRegUsers[idx] = { ...currentRegUsers[idx], ...initialCurrent };
        } else {
          currentRegUsers.push(initialCurrent as any);
        }
      }
      const currentPosts = state.posts;
      if (currentRegUsers.length > 0 || currentPosts.length > 0) {
        pushToServer("BATCH_SYNC", {
          registeredUsers: currentRegUsers,
          posts: currentPosts,
        });
      }
    }

    const runSync = async () => {
      if (isSyncingRef.current) return;

      isSyncingRef.current = true;
      try {
        const res = await fetch(`/api/sync?since=${lastSyncTimeRef.current}`);
        if (!res.ok) throw new Error("Sync failed");
        const json = await res.json();
        if (!json.success) return;

        const state = useAppStore.getState();
        const currentUserId = state.currentUser?.id;
        const currentUsername = (state.currentUser?.username || "").toLowerCase();
        const myClearedMap = (currentUserId ? state.clearedConversations?.[currentUserId] : undefined) || {};

        // Status mengetik jika data server tidak termodifikasi
        if (json.notModified) {
          if (json.typingStatus && typeof json.typingStatus === "object") {
            useAppStore.getState().setTypingStatus(json.typingStatus);
          }
          return;
        }

        const serverData = json.data;
        if (!serverData) return;

        // 1. SINKRONISASI STATUS MENGETIK (Typing Indicator)
        if (serverData.typingStatus && typeof serverData.typingStatus === "object") {
          useAppStore.getState().setTypingStatus(serverData.typingStatus);
        }

        // Lewati pemrosesan entitas basis data jika data di server belum berubah
        if (serverData.lastUpdated <= lastSyncTimeRef.current) {
          isSyncingRef.current = false;
          return;
        }

        // 1. Sinkronisasi Registered Users (Tambah user baru atau perbarui user yang sudah ada)
        if (Array.isArray(serverData.registeredUsers)) {
          const localUserMap = new Map(state.registeredUsers.map((u) => [u.id, u]));
          let usersChanged = false;

          for (const serverUser of serverData.registeredUsers) {
            const existingKey = Array.from(localUserMap.entries()).find(
              ([id, u]) =>
                id === serverUser.id ||
                u.id === serverUser.id ||
                u.username.toLowerCase() === serverUser.username?.toLowerCase()
            );

            if (!existingKey) {
              localUserMap.set(serverUser.id, serverUser);
              usersChanged = true;
            } else {
              const [localId, existing] = existingKey;
              // Periksa pembaruan data profil
              const hasDiff =
                existing.name !== serverUser.name ||
                existing.avatarUrl !== serverUser.avatarUrl ||
                existing.bannerUrl !== serverUser.bannerUrl ||
                existing.bannerType !== serverUser.bannerType ||
                existing.bio !== serverUser.bio ||
                existing.location !== serverUser.location ||
                JSON.stringify(existing.links || []) !== JSON.stringify(serverUser.links || []) ||
                (serverUser.updatedAt && serverUser.updatedAt !== existing.updatedAt);

              if (hasDiff) {
                localUserMap.set(localId, { ...existing, ...serverUser });
                usersChanged = true;
              }
            }
          }

          if (usersChanged) {
            const updatedList = Array.from(localUserMap.values());
            useAppStore.setState({ registeredUsers: updatedList });

            // Sinkronkan juga ke onlineUsers agar pencarian & profil terbarui seketika
            const currentOnline = useAppStore.getState().onlineUsers;
            const updatedOnline = currentOnline.map((u) => {
              const match =
                localUserMap.get(u.id) ||
                updatedList.find((x) => x.username.toLowerCase() === u.username.toLowerCase());
              return match ? { ...u, ...match } : u;
            });

            // Sinkronkan data author postingan yang ada di feed lokal
            const currentPosts = useAppStore.getState().posts;
            const updatedPosts = currentPosts.map((p) => {
              const match =
                localUserMap.get(p.author.id) ||
                updatedList.find((x) => x.username.toLowerCase() === p.author.username.toLowerCase());
              return match
                ? {
                  ...p,
                  author: {
                    ...p.author,
                    name: match.name || p.author.name,
                    avatarUrl: match.avatarUrl || p.author.avatarUrl,
                  },
                }
                : p;
            });

            useAppStore.setState({
              onlineUsers: updatedOnline,
              posts: updatedPosts,
            });
          }
        }

        // 2. Sinkronisasi Pesan & Percakapan (Preservasi penuh riwayat pesan tanpa delay/flicker)
        if (serverData.messages && typeof serverData.messages === "object") {
          useAppStore.setState((currentState) => {
            const currentClearedMap = currentState.clearedConversations?.[currentUserId] || {};
            const nextMessages = { ...currentState.messages };
            let hasChanges = false;

            for (const [convId, serverMsgList] of Object.entries(serverData.messages)) {
              const clearedTime = currentClearedMap[convId] || 0;
              const serverValidMsgs = (serverMsgList as MessageItem[]).filter(
                (m) => !(currentUserId && m.deletedForUsers?.includes(currentUserId))
              );

              // Ambil pesan lokal terkini (termasuk yang baru saja dikirim detik ini)
              const localList = nextMessages[convId] || [];
              const msgMap = new Map<string, MessageItem>();

              for (const m of localList) {
                if (!(currentUserId && m.deletedForUsers?.includes(currentUserId))) {
                  msgMap.set(m.id, m);
                }
              }

              let convChanged = false;

              for (const sMsg of serverValidMsgs) {
                const msgTime = new Date(sMsg.createdAt).getTime();
                if (clearedTime > 0 && msgTime <= clearedTime) {
                  if (msgMap.has(sMsg.id)) {
                    msgMap.delete(sMsg.id);
                    convChanged = true;
                  }
                  continue;
                }

                const existing = msgMap.get(sMsg.id);
                if (!existing) {
                  msgMap.set(sMsg.id, sMsg);
                  convChanged = true;
                } else {
                  // Merge status tanpa menimpa atribut lokal penting
                  const reactionsDiff =
                    JSON.stringify(sMsg.reactions || []) !== JSON.stringify(existing.reactions || []);
                  const editedDiff =
                    (sMsg.isEdited && sMsg.content !== existing.content) ||
                    (sMsg.editedAt && sMsg.editedAt !== existing.editedAt);

                  if (reactionsDiff || editedDiff || sMsg.isRead !== existing.isRead) {
                    msgMap.set(sMsg.id, {
                      ...existing,
                      ...sMsg,
                      reactions: sMsg.reactions || existing.reactions,
                    });
                    convChanged = true;
                  }
                }
              }

              if (convChanged || msgMap.size !== localList.length) {
                const sorted = Array.from(msgMap.values()).sort(
                  (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
                nextMessages[convId] = sorted;
                hasChanges = true;
              }
            }

            if (!hasChanges) return currentState;
            return { messages: nextMessages };
          });
        }

        // 3. Sinkronisasi Percakapan (Conversations List)
        if (Array.isArray(serverData.conversations)) {
          const localConvMap = new Map(state.conversations.map((c) => [c.id, c]));
          let convsChanged = false;

          for (const sConv of serverData.conversations as ConversationItem[]) {
            // Pastikan user melihat percakapan yang relevan dan semua grup lokal
            const isParticipant =
              !currentUserId ||
              sConv.isGroup ||
              sConv.participant?.id === currentUserId ||
              sConv.participantIds?.some((id) => id === currentUserId || id === currentUsername) ||
              sConv.creatorId === currentUserId ||
              sConv.creatorId === currentUsername ||
              (serverData.messages &&
                serverData.messages[sConv.id]?.some(
                  (m: any) => m.senderId === currentUserId || m.senderId === currentUsername
                ));

            if (!isParticipant) {
              continue;
            }

            const clearedTime = myClearedMap[sConv.id] || 0;
            const convMsgs = (serverData.messages && serverData.messages[sConv.id]) || [];
            const hasNewerMsg = convMsgs.some(
              (m: MessageItem) => new Date(m.createdAt).getTime() > clearedTime
            );

            // Jika percakapan sudah dibersihkan dan belum ada pesan baru, tetap pertahankan kontak dengan lastMessage kosong
            if (clearedTime > 0 && !hasNewerMsg) {
              const partner = getChatPartner(
                sConv,
                state.currentUser,
                state.registeredUsers,
                state.onlineUsers,
                []
              );
              localConvMap.set(sConv.id, {
                ...sConv,
                participant: partner,
                lastMessage: "",
                unreadCount: 0,
              });
              convsChanged = true;
              continue;
            }

            // Pastikan lawan bicara dalam percakapan bukan diri kita sendiri
            const partner = getChatPartner(
              sConv,
              state.currentUser,
              state.registeredUsers,
              state.onlineUsers,
              convMsgs
            );
            const resolvedConv = { ...sConv, participant: partner };

            const localConv = localConvMap.get(sConv.id);
            if (!localConv) {
              localConvMap.set(sConv.id, resolvedConv);
              convsChanged = true;
            } else {
              // Periksa perubahan nama grup, foto profil grup, daftar admin, atau pesan baru
              const partnerUpdated =
                localConv.participant.id !== partner.id ||
                localConv.participant.avatarUrl !== partner.avatarUrl ||
                localConv.participant.name !== partner.name;

              const groupMetaUpdated =
                Boolean(sConv.isGroup) &&
                (sConv.groupName !== localConv.groupName ||
                  sConv.avatarUrl !== localConv.avatarUrl ||
                  JSON.stringify(sConv.adminIds || []) !== JSON.stringify(localConv.adminIds || []) ||
                  JSON.stringify(sConv.participantIds || []) !==
                  JSON.stringify(localConv.participantIds || []));

              const hasNewerLastMsg =
                sConv.lastMessageAt &&
                (!localConv.lastMessageAt || sConv.lastMessageAt > localConv.lastMessageAt);

              if (partnerUpdated || groupMetaUpdated || hasNewerLastMsg) {
                localConvMap.set(sConv.id, {
                  ...localConv,
                  ...sConv,
                  participant: partner,
                  lastMessage: sConv.lastMessage || localConv.lastMessage,
                  lastMessageAt: sConv.lastMessageAt || localConv.lastMessageAt,
                  adminIds: sConv.adminIds || localConv.adminIds,
                  avatarUrl: sConv.avatarUrl || localConv.avatarUrl,
                  groupName: sConv.groupName || localConv.groupName,
                  participantIds: sConv.participantIds || localConv.participantIds,
                });
                convsChanged = true;
              }
            }
          }

          if (convsChanged) {
            useAppStore.setState({ conversations: Array.from(localConvMap.values()) });
          }
        }

        // 4. Sinkronisasi Notifikasi (Deduplikasi cerdas untuk mencegah penumpukan)
        if (Array.isArray(serverData.notifications)) {
          const currentUsername = (state.currentUser?.username || "").toLowerCase();
          const existingNotifs = [...state.notifications];
          const localNotifKeySet = new Set(
            existingNotifs.map((n) =>
              n.type === "follow"
                ? `follow-${n.recipientId}-${n.actor?.id || n.actor?.username}`
                : n.id
            )
          );
          const newNotifs: NotificationItem[] = [];

          for (const sNotif of serverData.notifications as NotificationItem[]) {
            const isForMe =
              sNotif.recipientId === currentUserId ||
              (sNotif.recipientId && sNotif.recipientId.toLowerCase() === currentUsername);

            if (!isForMe) continue;

            const key =
              sNotif.type === "follow"
                ? `follow-${sNotif.recipientId}-${sNotif.actor?.id || sNotif.actor?.username}`
                : sNotif.id;

            if (!localNotifKeySet.has(key)) {
              newNotifs.push(sNotif);
              localNotifKeySet.add(key);
            }
          }

          if (newNotifs.length > 0) {
            useAppStore.setState({
              notifications: [...newNotifs, ...existingNotifs],
            });
          }
        }

        // 5. Sinkronisasi Postingan & Komentar Feed
        if (Array.isArray(serverData.posts)) {
          let postsChanged = false;
          const mergedPosts = [...state.posts];
          const localPostIndexMap = new Map(mergedPosts.map((p, idx) => [p.id, idx]));

          for (const sPost of serverData.posts as PostItem[]) {
            const existingIdx = localPostIndexMap.get(sPost.id);
            if (existingIdx === undefined) {
              mergedPosts.unshift(sPost);
              postsChanged = true;
            } else {
              const localPost = mergedPosts[existingIdx];
              const sComments = sPost.comments || [];
              const lComments = localPost.comments || [];
              const sLikedBy = sPost.likedBy || [];
              const sRepostedBy = sPost.repostedBy || [];
              const lLikedBy = localPost.likedBy || [];
              const lRepostedBy = localPost.repostedBy || [];

              const commentsChanged =
                sComments.length !== lComments.length ||
                (sPost.commentsCount || 0) !== (localPost.commentsCount || 0);

              const likesChanged =
                sPost.likesCount !== localPost.likesCount ||
                JSON.stringify(sLikedBy) !== JSON.stringify(lLikedBy);

              const repostsChanged =
                sPost.repostsCount !== localPost.repostsCount ||
                JSON.stringify(sRepostedBy) !== JSON.stringify(lRepostedBy);

              if (commentsChanged || likesChanged || repostsChanged) {
                const commentMap = new Map(lComments.map((c) => [c.id, c]));
                for (const sc of sComments) {
                  commentMap.set(sc.id, sc);
                }
                const mergedComments = Array.from(commentMap.values());
                const userIsLiked = currentUserId ? sLikedBy.includes(currentUserId) : localPost.isLiked;
                const userIsReposted = currentUserId ? sRepostedBy.includes(currentUserId) : localPost.isReposted;

                mergedPosts[existingIdx] = {
                  ...localPost,
                  commentsCount: Math.max(sPost.commentsCount || 0, mergedComments.length),
                  comments: mergedComments,
                  likesCount: sPost.likesCount ?? localPost.likesCount,
                  repostsCount: sPost.repostsCount ?? localPost.repostsCount,
                  likedBy: sLikedBy,
                  repostedBy: sRepostedBy,
                  isLiked: userIsLiked,
                  isReposted: userIsReposted,
                };
                postsChanged = true;
              }
            }
          }

          if (postsChanged) {
            useAppStore.setState({
              posts: mergedPosts,
            });
          }
        }

        // 6. Sinkronisasi Cerita (Stories)
        if (Array.isArray(serverData.stories)) {
          const serverStoryMap = new Map((serverData.stories as StoryItem[]).map((s) => [s.id, s]));
          const localStoryMap = new Map(state.stories.map((s) => [s.id, s]));
          let storiesChanged = false;

          for (const sStory of serverData.stories as StoryItem[]) {
            if (!localStoryMap.has(sStory.id)) {
              localStoryMap.set(sStory.id, sStory);
              storiesChanged = true;
            } else {
              const localStory = localStoryMap.get(sStory.id)!;
              if (
                JSON.stringify(sStory.viewers || []) !== JSON.stringify(localStory.viewers || []) ||
                sStory.viewsCount !== localStory.viewsCount ||
                sStory.likesCount !== localStory.likesCount
              ) {
                localStoryMap.set(sStory.id, {
                  ...localStory,
                  ...sStory,
                });
                storiesChanged = true;
              }
            }
          }

          for (const localId of Array.from(localStoryMap.keys())) {
            if (!serverStoryMap.has(localId)) {
              localStoryMap.delete(localId);
              storiesChanged = true;
            }
          }

          if (storiesChanged) {
            const updatedStories = Array.from(localStoryMap.values());
            updatedStories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            useAppStore.setState({ stories: updatedStories });
          }
        }

        lastSyncTimeRef.current = serverData.lastUpdated;
      } catch {
        // Network polling error - continue silently
      } finally {
        isSyncingRef.current = false;
      }
    };

    activeSyncTrigger = runSync;
    const syncInterval = setInterval(runSync, 500);

    return () => {
      clearInterval(syncInterval);
      if (activeSyncTrigger === runSync) {
        activeSyncTrigger = null;
      }
    };
  }, []);
}

