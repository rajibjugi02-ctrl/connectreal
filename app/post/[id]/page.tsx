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
} from "lucide-react";

const FILTER_CSS: Record<string, string> = {
  normal: "none",
  fade: "contrast(90%) brightness(105%) saturate(80%)",
  paris: "contrast(105%) brightness(110%) saturate(115%) sepia(10%)",
  simple: "contrast(100%) brightness(102%)",
  midnight: "contrast(120%) brightness(85%) hue-rotate(190deg) saturate(110%)",
  jakarta: "contrast(115%) brightness(105%) sepia(25%) saturate(125%)",
  vivid: "contrast(125%) saturate(140%)",
  vintage: "sepia(45%) contrast(95%) brightness(95%)",
  noir: "grayscale(100%) contrast(120%)",
};

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

        {/* Post Media (Foto & Video dengan Filter & Multi-Media Support) */}
        {(() => {
          const medias = post.mediaUrls && post.mediaUrls.length > 0 
            ? post.mediaUrls 
            : post.mediaUrl ? [post.mediaUrl] : [];
          const filterCss = FILTER_CSS[post.filter || "normal"] || "none";

          if (medias.length === 0) return null;

          if (medias.length === 1) {
            const url = medias[0];
            return (
              <div className="mt-3 mb-4 rounded-2xl overflow-hidden border border-[#E2E8F0] dark:border-slate-800 bg-black">
                <MediaRenderer
                  src={url}
                  alt="Lampiran postingan"
                  className="w-full max-h-[520px] object-contain"
                  style={{ filter: filterCss }}
                />
              </div>
            );
          }

          return (
            <div className="mt-3 mb-4 space-y-2">
              <div
                className={cn(
                  "grid gap-2 rounded-2xl overflow-hidden border border-[#E2E8F0] dark:border-slate-800 bg-black/40",
                  medias.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"
                )}
              >
                {medias.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative h-48 sm:h-60 overflow-hidden bg-black flex items-center justify-center"
                  >
                    <MediaRenderer
                      src={url}
                      alt={`Media ${idx + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      style={{ filter: filterCss }}
                    />
                  </div>
                ))}
              </div>
              <div className="text-xs text-slate-400 font-medium px-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{medias.length} Media terlampir • Filter: {post.filter || "Normal"}</span>
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

        {/* Beat-Synced Music Player & Karaoke Lyrics */}
        {post.musicTrack && (
          <div className="my-3 p-3.5 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/30 text-white space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={post.musicTrack.coverUrl}
                  alt={post.musicTrack.title}
                  className={cn(
                    "w-11 h-11 rounded-xl object-cover ring-2 ring-blue-400/40 shrink-0",
                    isPlayingMusic && "animate-spin [animation-duration:8s]"
                  )}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                    <h4 className="font-bold text-xs sm:text-sm text-white truncate">
                      {post.musicTrack.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-blue-200/80 truncate">
                    {post.musicTrack.artist}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => togglePlayMusic(post.musicTrack!.audioUrl)}
                className="w-10 h-10 rounded-full bg-white text-blue-900 flex items-center justify-center shrink-0 shadow-md hover:scale-105 active:scale-95 transition-transform"
                aria-label={isPlayingMusic ? "Jeda musik" : "Putar musik"}
              >
                {isPlayingMusic ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
            </div>

            {/* Beat-Synced Lyric Line Display */}
            {post.musicTrack.lyrics && post.musicTrack.lyrics.length > 0 && (
              <div className="px-3 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-center">
                <p className="text-xs font-bold text-amber-300 animate-pulse">
                  {(() => {
                    const active = post.musicTrack.lyrics
                      ?.slice()
                      .reverse()
                      .find((l) => currentAudioTime >= l.time);
                    return active?.text || "♪ Dengarkan alunan musik ♪";
                  })()}
                </p>
              </div>
            )}
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
    </div>
  );
}
