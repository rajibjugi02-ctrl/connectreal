"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  Repeat,
  Bookmark,
  Share2,
  Send,
  MessageCircle,
  Users,
  Sparkles,
  Music,
  Play,
  Pause,
  CornerDownRight,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
} from "lucide-react";
import { ImageZoomLightbox } from "@/components/media/ImageZoomLightbox";

const isVideo = (url?: string) => {
  if (!url) return false;
  return (
    url.startsWith("data:video/") ||
    url.endsWith(".mp4") ||
    url.endsWith(".webm") ||
    url.endsWith(".ogg") ||
    url.includes("blob:") ||
    url.includes("video")
  );
};
import { useAppStore } from "@/lib/store/useAppStore";
import { useTranslation } from "@/lib/i18n/translations";
import { formatTimestamp, cn } from "@/lib/utils";
import { MediaRenderer } from "@/components/media/MediaRenderer";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const postId = params.id as string;

  const {
    posts,
    currentUser,
    toggleLike,
    toggleRepost,
    toggleBookmark,
    addComment,
    toggleCommentLike,
  } = useAppStore();

  const [commentText, setCommentText] = useState("");
  const [copied, setCopied] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; username: string } | null>(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [currentAudioTime, setCurrentAudioTime] = useState(0);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, clientWidth } = carouselRef.current;
    if (clientWidth > 0) {
      const newIdx = Math.round(scrollLeft / clientWidth);
      setCarouselIndex(newIdx);
    }
  };

  const handleScrollCarousel = (dir: "left" | "right") => {
    if (!carouselRef.current) return;
    const width = carouselRef.current.clientWidth;
    const current = carouselRef.current.scrollLeft;
    carouselRef.current.scrollTo({
      left: dir === "left" ? current - width : current + width,
      behavior: "smooth",
    });
  };

  // Bersihkan audio saat unmount
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, []);

  const togglePlayMusic = (audioUrl: string) => {
    if (isPlayingMusic) {
      audioPlayerRef.current?.pause();
      setIsPlayingMusic(false);
    } else {
      if (!audioPlayerRef.current) {
        audioPlayerRef.current = new Audio(audioUrl);
      } else {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.src = audioUrl;
      }

      audioPlayerRef.current.ontimeupdate = () => {
        setCurrentAudioTime(audioPlayerRef.current?.currentTime || 0);
      };
      audioPlayerRef.current.onended = () => {
        setIsPlayingMusic(false);
        setCurrentAudioTime(0);
      };

      audioPlayerRef.current.play().catch(() => {});
      setIsPlayingMusic(true);
    }
  };

  const post = posts.find((p) => p.id === postId);

  if (!post) {
    return (
      <div className="w-full min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6">
        <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-[#E2E8F0] dark:border-slate-800 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Kembali"
            className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-base sm:text-lg">{t.postDetailTitle}</h1>
        </header>
        <div className="py-20 text-center text-slate-500 dark:text-slate-400">
          <p className="text-base font-semibold">Postingan tidak ditemukan.</p>
          <p className="text-xs mt-1">Postingan ini mungkin telah dihapus atau tautan tidak valid.</p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(post.id, commentText.trim(), replyingTo || undefined);
    setCommentText("");
    setReplyingTo(null);
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const authorProfileUrl =
    post.author.username === currentUser.username
      ? "/profile"
      : `/profile/${post.author.username}`;

  return (
    <div className="w-full min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Sticky Header with Back Button */}
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label={t.postBack}
            className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-sky-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-base sm:text-lg">{t.postDetailTitle}</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {post.commentsCount} {t.postComments}
            </p>
          </div>
        </div>
      </header>

      {/* Main Post Section */}
      <article className="p-4 sm:p-5 border-b border-[#E2E8F0] dark:border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <Link href={authorProfileUrl} className="relative group shrink-0">
            <img
              src={post.author.avatarUrl}
              alt={post.author.name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/20 dark:ring-sky-400/20 group-hover:scale-105 transition-transform"
            />
            {post.author.isOnline && (
              <div
                title="Online"
                className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
              />
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href={authorProfileUrl}
              className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 hover:underline block truncate"
            >
              {post.author.name}
            </Link>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              @{post.author.username}
            </span>
          </div>
        </div>

        {/* Post Text */}
        <p className="text-base sm:text-lg text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-line my-3">
          {post.content}
        </p>

        {/* Post Media: Dynamic Aspect Ratio & Instagram-Style Horizontal Swipe Carousel */}
        {(() => {
          const medias =
            post.mediaUrls && post.mediaUrls.length > 0
              ? post.mediaUrls
              : post.mediaUrl
              ? [post.mediaUrl]
              : [];

          if (medias.length === 0) return null;

          if (medias.length === 1) {
            const url = medias[0];
            return (
              <div className="mt-3 mb-4 rounded-2xl overflow-hidden border border-[#E2E8F0] dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                <div
                  onClick={() => {
                    if (!isVideo(url)) setZoomImageUrl(url);
                  }}
                  className={cn(
                    "relative flex items-center justify-center max-h-[75vh] overflow-hidden",
                    !isVideo(url) && "cursor-zoom-in"
                  )}
                  title={!isVideo(url) ? "Klik untuk memperbesar (Zoom)" : undefined}
                >
                  <MediaRenderer
                    src={url}
                    alt="Lampiran postingan"
                    className="w-full max-h-[75vh] object-contain"
                  />
                </div>
              </div>
            );
          }

          return (
            <div className="mt-3 mb-4 relative rounded-2xl overflow-hidden border border-[#E2E8F0] dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 group">
              {/* Swipeable Track */}
              <div
                ref={carouselRef}
                onScroll={handleCarouselScroll}
                className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar max-h-[75vh]"
              >
                {medias.map((url, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      if (!isVideo(url)) setZoomImageUrl(url);
                    }}
                    className={cn(
                      "min-w-full w-full snap-center shrink-0 flex items-center justify-center bg-transparent max-h-[75vh]",
                      !isVideo(url) && "cursor-zoom-in"
                    )}
                    title={!isVideo(url) ? "Klik untuk memperbesar (Zoom)" : undefined}
                  >
                    <MediaRenderer
                      src={url}
                      alt={`Media ${idx + 1}`}
                      className="w-full max-h-[75vh] object-contain"
                    />
                  </div>
                ))}
              </div>

              {/* Desktop Navigation Chevrons */}
              {carouselIndex > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleScrollCarousel("left");
                  }}
                  aria-label="Media sebelumnya"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-all active:scale-90 opacity-90 hover:opacity-100 z-10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              {carouselIndex < medias.length - 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleScrollCarousel("right");
                  }}
                  aria-label="Media berikutnya"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-all active:scale-90 opacity-90 hover:opacity-100 z-10"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {/* Floating Instagram-Style Indicator Badge (1/N) */}
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-bold text-white tracking-wide shadow-md pointer-events-none z-10">
                {carouselIndex + 1}/{medias.length}
              </div>

              {/* Pagination Dots at Bottom */}
              <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 pointer-events-none z-10">
                {medias.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-200",
                      carouselIndex === i ? "w-4 bg-blue-500 shadow-xs" : "w-1.5 bg-slate-400/50"
                    )}
                  />
                ))}
              </div>
            </div>
          );
        })()}

        {/* Tagged Friends Pills */}
        {post.taggedUsers && post.taggedUsers.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 my-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-500" /> Bersama:
            </span>
            {post.taggedUsers.map((username) => (
              <Link
                key={username}
                href={`/profile/${username.replace(/^@/, "")}`}
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-sky-400/10 text-blue-600 dark:text-sky-400 border border-blue-200 dark:border-sky-400/20 hover:underline"
              >
                @{username.replace(/^@/, "")}
              </Link>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className="py-2.5 text-xs text-slate-500 dark:text-slate-400 border-b border-[#E2E8F0] dark:border-slate-800">
          {formatTimestamp(post.createdAt)} • ConnectReal Web
        </div>

        {/* Interaction Metrics */}
        <div className="flex items-center gap-6 py-3 text-xs sm:text-sm border-b border-[#E2E8F0] dark:border-slate-800 text-slate-500 dark:text-slate-400">
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {post.likesCount}
            </span>{" "}
            {t.postLike}
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {post.commentsCount}
            </span>{" "}
            {t.postComments}
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {post.repostsCount}
            </span>{" "}
            {t.postRepost}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-around py-2 text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={() => toggleLike(post.id)}
            className={cn(
              "flex items-center gap-2 p-2 rounded-xl hover:text-red-500 hover:bg-red-500/10 active:scale-95 transition-all",
              post.isLiked && "text-red-500 dark:text-red-400 font-bold"
            )}
            aria-label={t.postLike}
          >
            <Heart className={cn("w-5 h-5", post.isLiked && "fill-current")} />
            <span className="text-xs">{t.postLike}</span>
          </button>

          <button
            type="button"
            onClick={() => toggleRepost(post.id)}
            className={cn(
              "flex items-center gap-2 p-2 rounded-xl hover:text-emerald-500 hover:bg-emerald-500/10 active:scale-95 transition-all",
              post.isReposted && "text-emerald-500 font-bold"
            )}
            aria-label={t.postRepost}
          >
            <Repeat className="w-5 h-5" />
            <span className="text-xs">{t.postRepost}</span>
          </button>

          <button
            type="button"
            onClick={() => toggleBookmark(post.id)}
            className={cn(
              "flex items-center gap-2 p-2 rounded-xl hover:text-blue-500 hover:bg-blue-500/10 active:scale-95 transition-all",
              post.isBookmarked && "text-blue-600 dark:text-sky-400"
            )}
            aria-label={t.postBookmark}
          >
            <Bookmark className={cn("w-5 h-5", post.isBookmarked && "fill-current")} />
            <span className="text-xs">{t.postBookmark}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-2 p-2 rounded-xl hover:text-blue-500 hover:bg-blue-500/10 active:scale-95 transition-all"
            aria-label={t.postShare}
          >
            <Share2 className="w-5 h-5" />
            <span className="text-xs">{copied ? t.postCopied : t.postShare}</span>
          </button>
        </div>
      </article>

      {/* Reply Input Form */}
      <div className="p-4 border-b border-[#E2E8F0] dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
        {/* Indikator Membalas Komentar */}
        {replyingTo && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-sky-400/10 text-blue-600 dark:text-sky-400 text-xs font-semibold border border-blue-200 dark:border-sky-400/25">
            <span className="flex items-center gap-1.5">
              <CornerDownRight className="w-3.5 h-3.5" />
              Membalas komentar @{replyingTo.username}
            </span>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="p-0.5 hover:text-red-500 rounded transition-colors"
              aria-label="Batalkan balasan"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form onSubmit={handleCommentSubmit} className="flex gap-3 items-start">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-blue-500/20 dark:ring-sky-400/20 mt-1"
          />
          <div className="flex-1 min-w-0 space-y-2">
            <textarea
              ref={textareaRef}
              rows={2}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={replyingTo ? `Tulis balasan untuk @${replyingTo.username}...` : t.postReplyPlaceholder}
              className="w-full p-3 text-sm rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-sky-400 resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{replyingTo ? "Kirim Balasan" : t.postSendReply}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Chronological Comments Feed */}
      <section className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
        <div className="px-4 py-3 bg-slate-50/30 dark:bg-slate-800/20 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          <span>
            {post.comments?.length || 0} {t.postComments}
          </span>
        </div>

        {post.comments && post.comments.length > 0 ? (
          post.comments.map((comment) => (
            <article key={comment.id} className="p-4 hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-colors">
              <div className="flex gap-3">
                <Link
                  href={
                    comment.author.username === currentUser.username
                      ? "/profile"
                      : `/profile/${comment.author.username}`
                  }
                  className="shrink-0 group"
                >
                  <img
                    src={comment.author.avatarUrl}
                    alt={comment.author.name}
                    className="w-9 h-9 rounded-full object-cover group-hover:scale-105 transition-transform"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={
                        comment.author.username === currentUser.username
                          ? "/profile"
                          : `/profile/${comment.author.username}`
                      }
                      className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 hover:underline"
                    >
                      {comment.author.name}
                    </Link>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      @{comment.author.username}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formatTimestamp(comment.createdAt)}
                    </span>

                    {/* Badge Membalas */}
                    {comment.replyTo && (
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-sky-400 bg-blue-50 dark:bg-sky-400/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CornerDownRight className="w-3 h-3" />
                        @{comment.replyTo.username}
                      </span>
                    )}
                  </div>

                  <p className="mt-1.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                    {comment.content}
                  </p>

                  {/* Comment Actions: Like & Replay */}
                  <div className="flex items-center gap-4 mt-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
                    {/* Like Comment Button */}
                    <button
                      type="button"
                      onClick={() => toggleCommentLike(post.id, comment.id)}
                      className={cn(
                        "flex items-center gap-1.5 hover:text-red-500 transition-colors active:scale-95",
                        comment.isLiked && "text-red-500 font-bold"
                      )}
                    >
                      <Heart className={cn("w-3.5 h-3.5", comment.isLiked && "fill-red-500 text-red-500")} />
                      <span>{comment.likesCount || 0}</span>
                    </button>

                    {/* Reply to Comment Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingTo({ commentId: comment.id, username: comment.author.username });
                        textareaRef.current?.focus();
                      }}
                      className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-sky-400 transition-colors"
                    >
                      <CornerDownRight className="w-3.5 h-3.5" />
                      <span>Balas</span>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="py-12 px-4 text-center text-slate-500 dark:text-slate-400">
            <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold">{t.postNoComments}</p>
          </div>
        )}
      </section>

      {/* Full-Screen Interactive Zoomable Lightbox */}
      <ImageZoomLightbox
        isOpen={Boolean(zoomImageUrl)}
        onClose={() => setZoomImageUrl(null)}
        imageUrl={zoomImageUrl || ""}
      />
    </div>
  );
}
