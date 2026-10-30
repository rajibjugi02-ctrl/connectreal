"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  MessageCircle,
  Repeat,
  Bookmark,
  Share2,
  MoreHorizontal,
  Edit3,
  Archive,
  Trash2,
  Check,
  Users,
  ChevronLeft,
  ChevronRight,
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

import { PostItem } from "@/lib/types";
import { useAppStore } from "@/lib/store/useAppStore";
import { useTranslation } from "@/lib/i18n/translations";
import { formatTimestamp, cn } from "@/lib/utils";
import { MediaRenderer } from "@/components/media/MediaRenderer";
import { ShareSheetModal } from "@/components/share/ShareSheetModal";

interface PostCardProps {
  post: PostItem;
}

export function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const {
    toggleLike,
    toggleRepost,
    toggleBookmark,
    currentUser,
    editPost,
    deletePost,
    archivePost,
  } = useAppStore();
  const { t } = useTranslation();

  const [likeBurst, setLikeBurst] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(post.content);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Carousel State for Multi-Media
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const isAuthor =
    post.author.id === currentUser.id ||
    post.author.username === currentUser.username;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLikeBurst(true);
    toggleLike(post.id);
    setTimeout(() => setLikeBurst(false), 350);
  };

  const handleOpenShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsShareModalOpen(true);
  };

  const handleSaveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!draftContent.trim()) return;
    editPost(post.id, draftContent.trim());
    setIsEditing(false);
    showToast("Postingan berhasil diperbarui");
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    archivePost(post.id);
    setIsMenuOpen(false);
    showToast("Postingan diarsipkan");
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Hapus postingan ini secara permanen?")) {
      deletePost(post.id);
      setIsMenuOpen(false);
    }
  };

  const handleScrollCarousel = (direction: "left" | "right") => {
    if (!carouselRef.current) return;
    const width = carouselRef.current.clientWidth;
    const scrollAmount = direction === "left" ? -width : width;
    carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    const width = carouselRef.current.clientWidth;
    const scrollLeft = carouselRef.current.scrollLeft;
    const newIdx = Math.round(scrollLeft / width);
    setCarouselIndex(newIdx);
  };

  const authorProfileUrl = isAuthor
    ? "/profile"
    : `/profile/${post.author.username}`;

  const medias =
    post.mediaUrls && post.mediaUrls.length > 0
      ? post.mediaUrls
      : post.mediaUrl
      ? [post.mediaUrl]
      : [];
  const filterCss = FILTER_CSS[post.filter || "normal"] || "none";

  const postShareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/post/${post.id}`
      : `https://connectreal-theta.vercel.app/post/${post.id}`;

  return (
    <article className="border-b border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors relative">
      {toastMsg && (
        <div className="absolute top-2 right-4 z-40 bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-900 text-xs px-3 py-1.5 rounded-full font-semibold shadow-md animate-in fade-in">
          {toastMsg}
        </div>
      )}

      <div className="flex gap-3">
        {/* Author Avatar with Link */}
        <Link href={authorProfileUrl} className="relative shrink-0 group">
          <img
            src={post.author.avatarUrl}
            alt={post.author.name}
            className="w-10 h-10 rounded-full object-cover group-hover:scale-105 transition-transform"
          />
          {post.author.isOnline && (
            <div
              title="Online"
              className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
            />
          )}
        </Link>

        {/* Post Main Body */}
        <div className="flex-1 min-w-0">
          {/* Header Metadata */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={authorProfileUrl}
                className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:underline"
              >
                {post.author.name}
              </Link>
              <Link
                href={authorProfileUrl}
                className="text-xs text-slate-500 dark:text-slate-400 hover:underline"
              >
                @{post.author.username}
              </Link>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-400">
                {formatTimestamp(post.createdAt)}
              </span>
            </div>

            {/* Author Post Options Menu (...) */}
            {isAuthor && (
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(!isMenuOpen);
                  }}
                  aria-label="Opsi postingan"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {isMenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-full mt-1 z-30 w-44 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1 text-xs font-semibold animate-in fade-in zoom-in-95"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                      <span>Edit Postingan</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleArchive}
                      className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                    >
                      <Archive className="w-3.5 h-3.5 text-amber-500" />
                      <span>Arsipkan</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Post Content / Inline Edit Form */}
          {isEditing ? (
            <div className="mt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
              <textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                rows={3}
                className="w-full p-2.5 text-sm rounded-xl border border-blue-400 dark:border-sky-400 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-xs rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-3 py-1 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Simpan
                </button>
              </div>
            </div>
          ) : (
            <p
              onClick={() => router.push(`/post/${post.id}`)}
              className="mt-2 text-sm text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-line cursor-pointer hover:text-blue-600 dark:hover:text-sky-300 transition-colors"
            >
              {post.content}
            </p>
          )}

          {/* Post Media: Dynamic Aspect Ratio & Instagram-Style Horizontal Swipe Carousel */}
          {medias.length > 0 && (
            <div className="mt-3 relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black/95">
              {medias.length === 1 ? (
                // Single Media (Full portrait / square / landscape without letterbox cropping)
                <div
                  onClick={(e) => {
                    if ((e.target as HTMLElement).tagName === "VIDEO") return;
                    router.push(`/post/${post.id}`);
                  }}
                  className="relative flex items-center justify-center max-h-[580px] overflow-hidden cursor-pointer"
                >
                  <MediaRenderer
                    src={medias[0]}
                    alt="Lampiran postingan"
                    className="w-full max-h-[580px] object-contain"
                    style={{ filter: filterCss }}
                  />
                </div>
              ) : (
                // Multi-Media Instagram-Style Swipe Carousel
                <div className="relative group">
                  {/* Swipeable Track */}
                  <div
                    ref={carouselRef}
                    onScroll={handleCarouselScroll}
                    className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar max-h-[580px]"
                  >
                    {medias.map((url, idx) => (
                      <div
                        key={idx}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).tagName === "VIDEO") return;
                          router.push(`/post/${post.id}`);
                        }}
                        className="min-w-full w-full snap-center shrink-0 flex items-center justify-center bg-black/95 max-h-[580px] cursor-pointer"
                      >
                        <MediaRenderer
                          src={url}
                          alt={`Media ${idx + 1}`}
                          className="w-full max-h-[580px] object-contain"
                          style={{ filter: filterCss }}
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
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}

                  {carouselIndex < medias.length - 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScrollCarousel("right");
                      }}
                      aria-label="Media selanjutnya"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-all active:scale-90 opacity-90 hover:opacity-100 z-10"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}

                  {/* Floating Carousel Counter Badge (Ala Instagram) */}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-bold text-white shadow-md z-10">
                    {carouselIndex + 1}/{medias.length}
                  </div>

                  {/* Centered Pagination Dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 pointer-events-none">
                    {medias.map((_, dotIdx) => (
                      <span
                        key={dotIdx}
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-200",
                          carouselIndex === dotIdx
                            ? "w-4 bg-white"
                            : "w-1.5 bg-white/40"
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tagged Friends Pills */}
          {post.taggedUsers && post.taggedUsers.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-500" /> Bersama:
              </span>
              {post.taggedUsers.map((username) => (
                <Link
                  key={username}
                  href={`/profile/${username.replace(/^@/, "")}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-sky-400/10 text-blue-600 dark:text-sky-400 border border-blue-200 dark:border-sky-400/20 hover:underline"
                >
                  @{username.replace(/^@/, "")}
                </Link>
              ))}
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between mt-3 text-xs text-slate-500 dark:text-slate-400 max-w-lg sm:max-w-xl pr-2">
            {/* Comment Button -> Opens Post Detail Page */}
            <Link
              href={`/post/${post.id}`}
              className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-sky-400 group transition-colors rounded-lg p-1.5 -ml-1.5"
              aria-label={t.postComment}
            >
              <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>{post.commentsCount}</span>
            </Link>

            {/* Repost Button */}
            <button
              type="button"
              onClick={() => toggleRepost(post.id)}
              className={cn(
                "flex items-center gap-1.5 hover:text-emerald-500 group transition-colors rounded-lg p-1.5",
                post.isReposted && "text-emerald-500 font-bold"
              )}
              aria-label={t.postRepost}
            >
              <Repeat className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>{post.repostsCount}</span>
            </button>

            {/* Like Button */}
            <button
              type="button"
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1.5 hover:text-red-500 dark:hover:text-red-400 group transition-colors rounded-lg p-1.5 active:scale-90",
                post.isLiked && "text-red-500 dark:text-red-400 font-bold"
              )}
              aria-label={t.postLike}
            >
              <Heart
                className={cn(
                  "w-4 h-4 group-hover:scale-110 transition-transform",
                  post.isLiked && "fill-current text-red-500 dark:text-red-400",
                  likeBurst && "animate-heart-burst"
                )}
              />
              <span>{post.likesCount}</span>
            </button>

            {/* Bookmark Button */}
            <button
              type="button"
              onClick={() => toggleBookmark(post.id)}
              className={cn(
                "flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-sky-400 group transition-colors rounded-lg p-1.5",
                post.isBookmarked && "text-blue-600 dark:text-sky-400"
              )}
              aria-label={t.postBookmark}
            >
              <Bookmark
                className={cn(
                  "w-4 h-4 group-hover:scale-110 transition-transform",
                  post.isBookmarked && "fill-current"
                )}
              />
            </button>

            {/* Share Button -> Opens Multi-Platform Share Sheet Modal */}
            <button
              type="button"
              onClick={handleOpenShare}
              className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-sky-400 group transition-colors rounded-lg p-1.5"
              aria-label={t.postShare}
            >
              <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Reusable Share Sheet Modal (WhatsApp, Instagram / Web Share, Copy Link, DM) */}
      <ShareSheetModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={`Postingan oleh ${post.author.name} (@${post.author.username})`}
        url={postShareUrl}
        description={post.content.slice(0, 100)}
      />
    </article>
  );
}
