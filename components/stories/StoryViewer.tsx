"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Archive,
  Send,
  Heart,
  Share2,
  Copy,
  Check,
  Eye,
} from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { StoryItem } from "@/lib/types";
import { formatTimestamp, cn } from "@/lib/utils";
import { StoryViewersDrawer } from "./StoryViewersDrawer";
import { StoryEffectsOverlay } from "./StoryEffectsOverlay";
import { ShareSheetModal } from "@/components/share/ShareSheetModal";

interface StoryViewerProps {
  initialStoryId?: string;
  onClose: () => void;
}

interface UserStoryGroup {
  userId: string;
  user: StoryItem["user"];
  stories: StoryItem[];
}

export function StoryViewer({ initialStoryId, onClose }: StoryViewerProps) {
  const router = useRouter();
  const {
    stories,
    markStoryViewed,
    deleteStory,
    archiveStory,
    toggleStoryLike,
    currentUser,
    conversations,
    messages,
    sendMessage,
    getOrCreateConversation,
    addNotification,
  } = useAppStore();

  // Group all stories by author so each user has their own segmented timeline (-------)
  // Diurutkan dari LAMA ke BARU (kronologis / oldest to newest) ala Instagram & WhatsApp
  const userStoryGroups: UserStoryGroup[] = useMemo(() => {
    const map = new Map<string, UserStoryGroup>();

    stories.forEach((story) => {
      if (!map.has(story.userId)) {
        map.set(story.userId, {
          userId: story.userId,
          user: story.user,
          stories: [],
        });
      }
      map.get(story.userId)!.stories.push(story);
    });

    // Urutkan stories tiap user: terlama ke terbaru (kronologis)
    map.forEach((group) => {
      group.stories.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });

    return Array.from(map.values());
  }, [stories]);

  // Determine starting group and story index based on initialStoryId
  const initialPosition = useMemo(() => {
    if (!initialStoryId || userStoryGroups.length === 0) {
      return { groupIdx: 0, storyIdx: 0 };
    }

    for (let g = 0; g < userStoryGroups.length; g++) {
      const foundS = userStoryGroups[g].stories.findIndex((s) => s.id === initialStoryId);
      if (foundS !== -1) {
        return { groupIdx: g, storyIdx: foundS };
      }
    }

    return { groupIdx: 0, storyIdx: 0 };
  }, [initialStoryId, userStoryGroups]);

  const [groupIndex, setGroupIndex] = useState(initialPosition.groupIdx);
  const [storyIndex, setStoryIndex] = useState(initialPosition.storyIdx);

  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [mediaDuration, setMediaDuration] = useState(6000);

  // Interaction states
  const [replyText, setReplyText] = useState("");
  const [reactionHearts, setReactionHearts] = useState<Array<{ id: number; emoji: string }>>([]);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(Date.now());

  const currentGroup = userStoryGroups[groupIndex];
  const currentStory: StoryItem | undefined = currentGroup?.stories[storyIndex];
  const isMyStory = Boolean(
    currentStory &&
      (currentStory.userId === currentUser.id ||
        (currentStory.user?.username &&
          currentUser?.username &&
          currentStory.user.username.toLowerCase() === currentUser.username.toLowerCase()))
  );

  const showToast = (text: string) => {
    setToastMsg(text);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Mark story as viewed
  useEffect(() => {
    if (currentStory?.id) {
      markStoryViewed(currentStory.id);
    }
  }, [currentStory?.id, markStoryViewed]);

  // Video duration listener
  const handleVideoLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const durSec = e.currentTarget.duration;
    if (durSec && !isNaN(durSec) && isFinite(durSec)) {
      setMediaDuration(Math.max(3000, durSec * 1000));
    }
  };

  // Profile navigation handler
  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
    if (!currentStory) return;
    if (isMyStory) {
      router.push("/profile");
    } else {
      router.push(`/profile/${currentStory.user.username}`);
    }
  };

  // Reset progress on story change & restart video to 0:00
  useEffect(() => {
    setProgress(0);
    lastTimeRef.current = Date.now();

    if (currentStory?.mediaType === "video") {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    } else {
      setMediaDuration(6000);
    }
  }, [groupIndex, storyIndex, currentStory?.id, currentStory?.mediaType]);

  // Sync play/pause with user interaction for video stories
  useEffect(() => {
    if (currentStory?.mediaType === "video" && videoRef.current) {
      if (isPaused || isShareOpen || isDrawerOpen) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isPaused, isShareOpen, isDrawerOpen, currentStory?.mediaType]);

  // Navigate to Next Story or Next User
  const handleNext = useCallback(() => {
    if (!currentGroup) {
      onClose();
      return;
    }

    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex((prev) => prev + 1);
      setProgress(0);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
    } else if (groupIndex < userStoryGroups.length - 1) {
      setGroupIndex((prev) => prev + 1);
      setStoryIndex(0);
      setProgress(0);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
    } else {
      onClose();
    }
  }, [currentGroup, storyIndex, groupIndex, userStoryGroups.length, onClose]);

  // Navigate to Prev Story or Prev User
  const handlePrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1);
      setProgress(0);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
    } else if (groupIndex > 0) {
      const prevGroup = userStoryGroups[groupIndex - 1];
      setGroupIndex((prev) => prev - 1);
      setStoryIndex(prevGroup.stories.length - 1);
      setProgress(0);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
    } else {
      setProgress(0);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
    }
  }, [storyIndex, groupIndex, userStoryGroups]);

  // Continuous progress bar animation (For images only; videos use onTimeUpdate & onEnded)
  useEffect(() => {
    if (!currentStory || currentStory.mediaType === "video") return;

    lastTimeRef.current = Date.now();

    const loop = () => {
      const now = Date.now();
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (!isPaused && !isShareOpen && !isDrawerOpen) {
        setProgress((prev) => {
          const next = prev + (delta / mediaDuration) * 100;
          if (next >= 100) {
            handleNext();
            return 0;
          }
          return next;
        });
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [currentStory, isPaused, isShareOpen, mediaDuration, handleNext]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "Escape") {
        if (isShareOpen) setIsShareOpen(false);
        else onClose();
      } else if (e.key === " " && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, isShareOpen, onClose]);

  // Send quick emoji reaction
  const handleSendReaction = (emoji: string) => {
    const newHeart = { id: Date.now(), emoji };
    setReactionHearts((prev) => [...prev, newHeart]);
    setTimeout(() => {
      setReactionHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1200);

    if (currentGroup?.user) {
      const convId = getOrCreateConversation({
        id: currentGroup.userId,
        name: currentGroup.user.name,
        username: currentGroup.user.username,
        email: `${currentGroup.user.username}@connectreal.app`,
        avatarUrl: currentGroup.user.avatarUrl,
        bannerUrl: "",
        bio: "",
        isOnline: true,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
      });

      sendMessage(
        convId,
        emoji,
        {
          type: "text",
          storyReply: currentStory
            ? {
                storyId: currentStory.id,
                mediaUrl: currentStory.mediaUrl,
                mediaType: currentStory.mediaType,
                authorUsername: currentStory.user.username,
              }
            : undefined,
        }
      );

      if (currentGroup.userId !== currentUser.id) {
        addNotification({
          recipientId: currentGroup.userId,
          type: "like",
          title: "Merespons cerita Anda",
          description: `${currentUser.name} merespons cerita Anda dengan ${emoji}`,
          actor: {
            name: currentUser.name,
            username: currentUser.username,
            avatarUrl: currentUser.avatarUrl,
          },
          read: false,
          category: "interaction",
        });
      }
    }
  };

  // Submit reply / comment to story
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentGroup?.user) return;

    const convId = getOrCreateConversation({
      id: currentGroup.userId,
      name: currentGroup.user.name,
      username: currentGroup.user.username,
      email: `${currentGroup.user.username}@connectreal.app`,
      avatarUrl: currentGroup.user.avatarUrl,
      bannerUrl: "",
      bio: "",
      isOnline: true,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
    });

    sendMessage(
      convId,
      replyText.trim(),
      {
        type: "text",
        storyReply: currentStory
          ? {
              storyId: currentStory.id,
              mediaUrl: currentStory.mediaUrl,
              mediaType: currentStory.mediaType,
              authorUsername: currentStory.user.username,
            }
          : undefined,
      }
    );

    if (currentGroup.userId !== currentUser.id) {
      addNotification({
        recipientId: currentGroup.userId,
        type: "comment",
        title: "Membalas cerita Anda",
        description: `${currentUser.name}: "${replyText.trim()}"`,
        actor: {
          name: currentUser.name,
          username: currentUser.username,
          avatarUrl: currentUser.avatarUrl,
        },
        read: false,
        category: "interaction",
      });
    }

    setReplyText("");
    showToast(`Balasan terkirim ke ${currentStory?.user.name}`);
  };

  // Handle Copy Story Link
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/?story=${currentStory?.id}`;
      navigator.clipboard?.writeText(url);
      showToast("Tautan cerita disalin ke papan klip");
      setIsShareOpen(false);
    }
  };

  // Handle Share to Conversation
  const handleShareToConversation = (convId: string) => {
    if (!currentStory) return;
    sendMessage(
      convId,
      `Lihat cerita dari ${currentStory.user.name}: ${window.location.origin}/?story=${currentStory.id}`,
      {
        type: "image",
        mediaUrl: currentStory.mediaUrl,
      }
    );
    showToast("Cerita berhasil dibagikan ke pesan");
    setIsShareOpen(false);
  };

  // Handle Archive Story
  const handleArchiveStory = () => {
    if (!currentStory) return;
    archiveStory(currentStory.id);
    showToast("Cerita berhasil diarsipkan ke Pengaturan > Arsip");
    if (currentGroup.stories.length <= 1) {
      onClose();
    } else {
      handleNext();
    }
  };

  // Handle Delete Story
  const handleDeleteStory = () => {
    if (!currentStory) return;
    if (confirm("Hapus cerita ini secara permanen?")) {
      deleteStory(currentStory.id);
      showToast("Cerita dihapus");
      if (currentGroup.stories.length <= 1) {
        onClose();
      } else {
        handleNext();
      }
    }
  };

  const touchStartYRef = useRef<number | null>(null);

  if (!currentGroup || !currentStory) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center select-none overflow-hidden touch-none"
      onTouchStart={(e) => {
        touchStartYRef.current = e.touches[0].clientY;
      }}
      onTouchEnd={(e) => {
        if (touchStartYRef.current !== null && isMyStory) {
          const deltaY = touchStartYRef.current - e.changedTouches[0].clientY;
          if (deltaY > 50) {
            setIsDrawerOpen(true);
          }
        }
        touchStartYRef.current = null;
      }}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest("button, input, form, [role='dialog']")) return;
        setIsPaused(true);
      }}
      onPointerUp={() => setIsPaused(false)}
      onPointerLeave={() => setIsPaused(false)}
    >
      {/* Toast Notification */}
      {toastMsg && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950 font-bold text-xs shadow-xl animate-in fade-in">
          {toastMsg}
        </div>
      )}

      {/* Desktop Navigation Arrows */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handlePrev();
        }}
        aria-label="Story sebelumnya"
        className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 text-white items-center justify-center backdrop-blur-md transition-all active:scale-90"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        aria-label="Story selanjutnya"
        className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 text-white items-center justify-center backdrop-blur-md transition-all active:scale-90"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Desktop External Close & Share Buttons (Di luar bingkai story, di kanan atas layar) */}
      <div className="hidden md:flex fixed top-6 right-8 z-50 items-center gap-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsShareOpen(true);
            setIsPaused(true);
          }}
          aria-label="Bagikan cerita"
          title="Bagikan cerita"
          className="p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition-all active:scale-95 shadow-lg border border-white/10"
        >
          <Share2 className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Tutup penampil cerita"
          title="Tutup penampil cerita (Esc)"
          className="p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition-all active:scale-95 shadow-lg border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main 9:16 Canvas Phone Frame */}
      <div className="relative w-full max-w-[420px] h-[100dvh] md:h-[90vh] md:max-h-[820px] md:rounded-3xl overflow-hidden bg-slate-950 flex flex-col justify-between shadow-2xl">
        {/* Top Header: Segmented Progress Bars (-------) and Author Information */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 z-30 p-3 pt-[max(0.85rem,env(safe-area-inset-top))] space-y-2.5 bg-gradient-to-b from-black/85 via-black/40 to-transparent transition-opacity duration-200",
            isPaused && "opacity-40"
          )}
        >
          {/* Multi-segmented Progress Bar: Instagram Style (-------) */}
          <div className="flex items-center gap-1.5 w-full">
            {currentGroup.stories.map((story, idx) => {
              const isPast = idx < storyIndex;
              const isCurrent = idx === storyIndex;

              return (
                <div
                  key={story.id}
                  className="flex-1 h-1 rounded-full bg-white/25 overflow-hidden relative shadow-xs"
                >
                  <div
                    style={{
                      width: isPast
                        ? "100%"
                        : isCurrent
                        ? `${Math.min(100, Math.max(0, progress))}%`
                        : "0%",
                    }}
                    className={cn(
                      "h-full rounded-full relative",
                      isCurrent
                        ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]"
                        : isPast
                        ? "bg-white/90"
                        : "bg-transparent"
                    )}
                  >
                    {/* Glowing head indicator for active bar */}
                    {isCurrent && !isPaused && (
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* User Details & Controls */}
          <div className="flex items-center justify-between text-white">
            <div
              onClick={handleProfileClick}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-90 active:scale-95 transition-all group"
              role="button"
              tabIndex={0}
              aria-label={`Lihat profil ${currentStory.user.name}`}
            >
              <img
                src={currentStory.user.avatarUrl}
                alt={currentStory.user.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-white/70 group-hover:ring-white shadow-sm transition-all"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs block truncate drop-shadow-sm group-hover:underline">
                    {currentStory.user.name}
                  </span>
                  {isMyStory && (
                    <span className="text-[10px] bg-blue-500/80 px-1.5 py-0.2 rounded font-semibold text-white">
                      Anda
                    </span>
                  )}
                  {currentStory.quality === "high" && (
                    <span className="text-[9px] bg-emerald-500/80 px-1 py-0.2 rounded font-black tracking-wider text-white">
                      HD
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-white/80 block truncate">
                  {formatTimestamp(currentStory.createdAt)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Share Button (Mobile only inside, on desktop placed in top-right overlay) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsShareOpen(true);
                  setIsPaused(true);
                }}
                aria-label="Bagikan cerita"
                title="Bagikan cerita"
                className="md:hidden p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {/* Author Actions: Archive & Delete */}
              {isMyStory && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArchiveStory();
                    }}
                    aria-label="Arsipkan cerita"
                    title="Arsipkan cerita"
                    className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-amber-400 transition-colors"
                  >
                    <Archive className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStory();
                    }}
                    aria-label="Hapus cerita"
                    title="Hapus cerita"
                    className="p-1.5 rounded-full bg-red-600/60 hover:bg-red-600 text-white transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Close Button (Mobile only inside, on desktop placed in top-right overlay) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                aria-label="Tutup penampil cerita"
                className="md:hidden p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Floating Pause Indicator */}
        {isPaused && !isShareOpen && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] text-white font-medium shadow-md">
            Dijeda
          </div>
        )}

        {/* Floating Reaction Flying Animation */}
        {reactionHearts.map((heart) => (
          <div
            key={heart.id}
            className="absolute bottom-20 right-8 z-50 text-4xl pointer-events-none animate-bounce"
            style={{ animation: "fly-up 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards" }}
          >
            {heart.emoji}
          </div>
        ))}

        {/* Story Media (Image or Video) with Landscape & Portrait Support */}
        <div
          key={currentStory.id}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black overflow-hidden animate-in fade-in duration-200"
        >
          {/* Blurred Backdrop for Landscape or Off-ratio media */}
          <div className="absolute inset-0 overflow-hidden opacity-35 blur-2xl scale-125 pointer-events-none">
            {currentStory.mediaType === "video" ? (
              <video
                src={currentStory.mediaUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={currentStory.mediaUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Foreground media: using object-contain so landscape/portrait are never cropped */}
          {currentStory.mediaType === "video" ? (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              autoPlay
              playsInline
              onLoadedMetadata={handleVideoLoadedMetadata}
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                if (v.duration && isFinite(v.duration) && v.duration > 0) {
                  setProgress((v.currentTime / v.duration) * 100);
                }
              }}
              onEnded={() => {
                handleNext();
              }}
              style={{ filter: currentStory.visualFilter || undefined }}
              className="relative z-10 max-w-full max-h-full object-contain transition-all"
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt="Story"
              style={{ filter: currentStory.visualFilter || undefined }}
              className="relative z-10 max-w-full max-h-full object-contain transition-all"
            />
          )}

          {/* Real-time Visual Effects Overlay (Sparkles, VHS, Bokeh, Film Grain) */}
          <StoryEffectsOverlay effect={currentStory.effectOverlay} />

          {/* Text Overlays Layer */}
          {currentStory.textOverlays?.map((to) => (
            <div
              key={to.id}
              style={{
                top: `${to.position.y}%`,
                left: `${to.position.x}%`,
                transform: "translate(-50%, -50%)",
                backgroundColor: to.bgColor || "transparent",
                color: to.color,
                fontSize: `${to.fontSize || 17}px`,
                fontFamily: to.fontFamily || "inherit",
              }}
              className="absolute z-20 px-3.5 py-1.5 rounded-xl font-bold text-center pointer-events-none drop-shadow-md max-w-[85%] animate-in zoom-in-95 duration-200"
            >
              {to.text}
            </div>
          ))}

          {/* Sticker Overlays Layer */}
          {currentStory.stickers?.map((st) => (
            <div
              key={st.id}
              style={{
                top: `${st.position.y}%`,
                left: `${st.position.x}%`,
                transform: "translate(-50%, -50%)",
                fontSize: `${st.size || 38}px`,
                fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", sans-serif',
              }}
              className="absolute z-20 pointer-events-none drop-shadow-lg animate-in zoom-in-95 duration-200"
            >
              {st.emoji}
            </div>
          ))}

          {/* Interactive Tagged Users Mention Badges */}
          {currentStory.taggedUsers?.map((tag) => {
            const cleanTag = tag.replace(/^@/, "");
            const pos = currentStory.tagPositions?.[cleanTag] || currentStory.tagPositions?.[tag] || { x: 50, y: 70 };
            return (
              <button
                key={tag}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                  router.push(`/profile/${cleanTag}`);
                }}
                style={{
                  top: `${pos.y}%`,
                  left: `${pos.x}%`,
                  transform: "translate(-50%, -50%)",
                }}
                className="absolute z-25 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black/90 text-white font-bold text-xs flex items-center gap-1.5 shadow-xl border border-white/20 active:scale-95 transition-all pointer-events-auto group/tag"
              >
                <span className="text-sky-400 font-extrabold group-hover/tag:scale-110 transition-transform">@</span>
                <span className="group-hover/tag:underline">{cleanTag}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Tap Zones: Left 30% for Prev, Right 70% for Next */}
        <div className="absolute inset-0 z-20 flex">
          <div className="w-1/3 h-full cursor-pointer" onClick={(e) => { e.stopPropagation(); handlePrev(); }} />
          <div className="w-2/3 h-full cursor-pointer" onClick={(e) => { e.stopPropagation(); handleNext(); }} />
        </div>

        {/* Bottom Bar: Like, Emoji Reactions, Reply (Khusus cerita orang lain), ATAU Info Penonton & Opsi (Cerita Sendiri) */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 z-30 p-3 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col gap-2 transition-opacity duration-200",
            isPaused && "opacity-40"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {isMyStory ? (
            /* Tampilan Khusus Pemilik Story: Jumlah Penonton & Tombol Pengelolaan */
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-black/60 border border-white/15 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                title="Buka daftar penonton cerita"
                className="flex items-center gap-2 text-white hover:opacity-90 active:scale-95 transition-all text-left"
              >
                {/* Stacked mini avatars */}
                {currentStory.viewers && currentStory.viewers.length > 0 ? (
                  <div className="flex -space-x-2 overflow-hidden">
                    {currentStory.viewers.slice(0, 3).map((v) => (
                      <img
                        key={v.id || v.userId || v.username}
                        src={v.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                        alt={v.name}
                        className="inline-block h-6 w-6 rounded-full ring-2 ring-black object-cover"
                      />
                    ))}
                  </div>
                ) : (
                  <Eye className="w-4 h-4 text-sky-400" />
                )}
                <span className="text-xs font-semibold">
                  Dilihat oleh {currentStory.viewers?.length || currentStory.viewsCount || 1} orang
                </span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleArchiveStory}
                  title="Arsipkan Cerita"
                  aria-label="Arsipkan Cerita"
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Arsip</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeleteStory}
                  title="Hapus Cerita"
                  aria-label="Hapus Cerita"
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/15 hover:bg-red-500/25 transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ) : (
            /* Tampilan Pengunjung: Reaksi Cepat & Kolom Balasan Pesan */
            <>
              {/* Quick Reaction Pill */}
              <div className="flex items-center justify-around px-2 py-1 rounded-full bg-black/40 backdrop-blur-md">
                {["❤️", "🔥", "👏", "😍", "😂", "😮"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSendReaction(emoji)}
                    className="text-lg p-1 hover:scale-125 active:scale-95 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Reply Form & Story Like Button */}
              <div className="flex items-center gap-2">
                <form onSubmit={handleSendReply} className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onFocus={() => setIsPaused(true)}
                    onBlur={() => setIsPaused(false)}
                    placeholder={`Kirim pesan ke ${currentStory.user.name}...`}
                    className="flex-1 px-3.5 py-2 text-xs rounded-full bg-white/20 border border-white/30 text-white placeholder-white/70 backdrop-blur-md focus:outline-none focus:ring-1 focus:ring-white"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all active:scale-90"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Like Button */}
                <button
                  type="button"
                  onClick={() => toggleStoryLike(currentStory.id)}
                  aria-label={currentStory.isLiked ? "Batal suka cerita" : "Sukai cerita"}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 shrink-0",
                    currentStory.isLiked
                      ? "bg-red-600 text-white shadow-md animate-heart-burst"
                      : "bg-white/20 text-white hover:bg-white/30"
                  )}
                >
                  <Heart className={cn("w-4 h-4", currentStory.isLiked && "fill-current")} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Share Dialog Sheet with WhatsApp, Instagram, Copy Link & DM */}
        {currentStory && (
          <ShareSheetModal
            isOpen={isShareOpen}
            onClose={() => {
              setIsShareOpen(false);
              setIsPaused(false);
            }}
            title={`Cerita dari ${currentStory.user.name}`}
            url={typeof window !== "undefined" ? `${window.location.origin}/feed` : "https://connectreal-theta.vercel.app"}
            description={`Lihat cerita terbaru dari @${currentStory.user.username} di ConnectReal!`}
          />
        )}
      </div>

      {/* Instagram-style Story Viewers Bottom Drawer */}
      {currentStory && (
        <StoryViewersDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          stories={currentGroup?.stories || stories.filter((s) => s.userId === currentUser.id)}
          activeStoryId={currentStory.id}
          onSelectStory={(newStoryId) => {
            const newIdx = currentGroup.stories.findIndex((s) => s.id === newStoryId);
            if (newIdx !== -1) {
              setStoryIndex(newIdx);
              setProgress(0);
            }
          }}
          onDeleteStory={(sId) => {
            deleteStory(sId);
            setIsDrawerOpen(false);
            handleNext();
          }}
          allMessages={messages}
        />
      )}
    </div>
  );
}
