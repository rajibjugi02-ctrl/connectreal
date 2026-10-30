"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Type,
  Smile,
  Send,
  X,
  Image as ImageIcon,
  Sparkles,
  Sun,
  Moon,
  Trash2,
  RefreshCw,
  Sliders,
  Check,
  Wand2,
  Palette,
} from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { TextOverlay, StickerOverlay, UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { uploadMediaFile } from "@/lib/utils/mediaUpload";
import {
  StoryEffectsOverlay,
  VISUAL_FILTERS,
  EFFECT_OVERLAYS,
  VisualFilterId,
  EffectOverlayId,
} from "@/components/stories/StoryEffectsOverlay";

// Curated emoji sticker palette
const STORY_STICKERS = [
  "✨", "🔥", "🚀", "❤️", "😍", "🎉", "💯", "👏", "🙌", "🥳",
  "💡", "☕", "💻", "🎧", "🌈", "🌸", "⭐", "⚡", "🎨", "🍕",
  "🌴", "🎯", "🏆", "💎", "🌟"
];

// Curated text color chips
const TEXT_COLORS = [
  { name: "Putih", hex: "#FFFFFF" },
  { name: "Hitam", hex: "#0F172A" },
  { name: "Kuning", hex: "#FBBF24" },
  { name: "Biru Langit", hex: "#38BDF8" },
  { name: "Mawar", hex: "#F43F5E" },
  { name: "Zamrud", hex: "#10B981" },
  { name: "Ungu", hex: "#A855F7" },
];

// Opsi gaya tulisan / typography story yang rapi & estetik
export const STORY_FONTS = [
  { id: "poppins", name: "Poppins", fontFamily: "'Poppins', ui-sans-serif, sans-serif" },
  { id: "times", name: "Times New Roman", fontFamily: "'Times New Roman', Times, serif" },
  { id: "deco", name: "Deco", fontFamily: "Impact, 'Arial Black', sans-serif" },
  { id: "squeeze", name: "Squeeze", fontFamily: "'Arial Narrow', 'Haettenschweiler', sans-serif" },
  { id: "elegant", name: "Elegant", fontFamily: "'Playfair Display', Georgia, serif" },
  { id: "typewriter", name: "Typewriter", fontFamily: "'Courier New', Courier, monospace" },
  { id: "modern", name: "Modern", fontFamily: "system-ui, -apple-system, sans-serif" },
];

// Aesthetic preset wallpaper backgrounds
const PRESET_BACKGROUNDS = [
  {
    title: "Neon Cyber",
    url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Gradient Glow",
    url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Sunset Vibes",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Minimal Studio",
    url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
  },
];

export default function CreateStoryPage() {
  const router = useRouter();
  const {
    currentUser,
    addStory,
    theme,
    toggleTheme,
    storyUploadQuality,
    setStoryUploadQuality,
    registeredUsers,
    onlineUsers,
    sendMessage,
    getOrCreateConversation,
  } = useAppStore();

  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [videoDuration, setVideoDuration] = useState<number>(10);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Drag-and-drop state for overlays on canvas
  const [activeDragItem, setActiveDragItem] = useState<{
    id: string;
    type: "text" | "sticker";
  } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Quality setting: low | medium | high
  const [quality, setQuality] = useState<"low" | "medium" | "high">(storyUploadQuality || "high");

  // Overlays
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [stickers, setStickers] = useState<StickerOverlay[]>([]);

  // Story Tagging / Mention state
  const [taggedUsers, setTaggedUsers] = useState<string[]>([]);
  const [tagPositions, setTagPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState("");

  // Visual filter and effect overlay state
  const [selectedFilter, setSelectedFilter] = useState<VisualFilterId>("normal");
  const [selectedEffect, setSelectedEffect] = useState<EffectOverlayId>("none");

  // Active drawer tool: null | 'text' | 'sticker' | 'quality' | 'filter' | 'effect'
  const [activeTool, setActiveTool] = useState<"text" | "sticker" | "quality" | "filter" | "effect" | null>(null);

  // Text editor draft states
  const [draftText, setDraftText] = useState("");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [selectedFont, setSelectedFont] = useState(STORY_FONTS[0].fontFamily);
  const [textBgStyle, setTextBgStyle] = useState<"translucent" | "solid" | "none">("translucent");
  const [textPos, setTextPos] = useState<"top" | "center" | "bottom">("center");

  // File picker ref
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // Read draft image from Chat Lightbox or Repost Story URL params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const repMedia = params.get("repostMedia");
      if (repMedia) {
        setMediaUrl(decodeURIComponent(repMedia));
        setMediaType("image");
      } else {
        const sharedMedia = sessionStorage.getItem("draft_story_media");
        if (sharedMedia) {
          setMediaUrl(sharedMedia);
          setMediaType("image");
          sessionStorage.removeItem("draft_story_media");
        }
      }
    }
  }, []);

  // Compress image using efficient Blob pipeline (mendukung hingga 100MB di iOS Safari)
  const compressMediaImage = (file: File, q: "low" | "medium" | "high"): Promise<File> => {
    return new Promise((resolve) => {
      const objUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(objUrl);
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Max bounds per quality
        const maxDim = q === "high" ? 1440 : q === "medium" ? 1080 : 720;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const qualityRatio = q === "high" ? 0.82 : q === "medium" ? 0.7 : 0.55;

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File(
                [blob],
                file.name ? file.name.replace(/\.[^.]+$/, ".jpg") : "story.jpg",
                { type: "image/jpeg" }
              );
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          qualityRatio
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objUrl);
        resolve(file);
      };

      img.src = objUrl;
    });
  };

  // Handle local photo/video selection with automatic optimization (hingga 100MB)
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Batasi maksimum 100MB
    const MAX_100MB = 100 * 1024 * 1024;
    if (file.size > MAX_100MB) {
      alert("Ukuran berkas melebihi batas maksimum 100MB. Silakan gunakan berkas yang lebih kecil.");
      return;
    }

    setRawFile(file);
    const isVideo = file.type.startsWith("video/");

    if (!isVideo) {
      const previewUrl = URL.createObjectURL(file);
      setMediaUrl(previewUrl);
      setMediaType("image");
    } else {
      const previewUrl = URL.createObjectURL(file);
      setMediaUrl(previewUrl);
      setMediaType("video");

      const tempVideo = document.createElement("video");
      tempVideo.src = previewUrl;
      tempVideo.onloadedmetadata = () => {
        setVideoDuration(tempVideo.duration || 10);
      };
    }
  };

  // Add text overlay
  const handleApplyText = () => {
    if (!draftText.trim()) {
      setActiveTool(null);
      return;
    }

    const yCoord = textPos === "top" ? 22 : textPos === "center" ? 50 : 78;
    const bgColor =
      textBgStyle === "solid"
        ? "#0F172A"
        : textBgStyle === "translucent"
          ? "rgba(15, 23, 42, 0.75)"
          : "transparent";

    const newOverlay: TextOverlay = {
      id: `text-${Date.now()}`,
      text: draftText.trim(),
      color: textColor,
      bgColor,
      position: { x: 50, y: yCoord },
      fontSize: 18,
      fontFamily: selectedFont,
    };

    setTextOverlays((prev) => [...prev, newOverlay]);
    setDraftText("");
    setActiveTool(null);
  };

  // Add sticker overlay
  const handleAddSticker = (emoji: string) => {
    const randomY = Math.floor(Math.random() * 35) + 32;
    const newSticker: StickerOverlay = {
      id: `sticker-${Date.now()}`,
      emoji,
      position: { x: 50, y: randomY },
      size: 44,
    };
    setStickers((prev) => [...prev, newSticker]);
    setActiveTool(null);
  };

  // Drag-and-drop pointer handlers for text & emoji on story canvas
  const handlePointerDownItem = (
    e: React.PointerEvent,
    id: string,
    type: "text" | "sticker"
  ) => {
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    setActiveDragItem({ id, type });
  };

  const handlePointerMoveCanvas = (e: React.PointerEvent) => {
    if (!activeDragItem || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const xPct = Math.max(10, Math.min(90, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const yPct = Math.max(10, Math.min(90, Math.round(((e.clientY - rect.top) / rect.height) * 100)));

    if (activeDragItem.type === "text") {
      setTextOverlays((prev) =>
        prev.map((t) => (t.id === activeDragItem.id ? { ...t, position: { x: xPct, y: yPct } } : t))
      );
    } else {
      setStickers((prev) =>
        prev.map((s) => (s.id === activeDragItem.id ? { ...s, position: { x: xPct, y: yPct } } : s))
      );
    }
  };

  const handlePointerUpCanvas = (e: React.PointerEvent) => {
    if (activeDragItem) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setActiveDragItem(null);
    }
  };

  // Publish story to global feed & LAN server (Mendukung hingga 100MB tanpa QuotaExceededError)
  const handlePublish = async () => {
    if (!mediaUrl || isPublishing) return;
    setIsPublishing(true);

    try {
      setStoryUploadQuality(quality);
      let finalMediaUrl = mediaUrl;

      // Jika berkas asli tersedia, unggah ke server agar URL berupa path server LAN yang dapat dibuka semua perangkat
      if (rawFile) {
        try {
          let fileToUpload = rawFile;
          if (rawFile.type.startsWith("image/")) {
            fileToUpload = await compressMediaImage(rawFile, quality);
          }
          const uploadedPath = await uploadMediaFile(fileToUpload);
          if (uploadedPath) {
            finalMediaUrl = uploadedPath;
          }
        } catch (uploadErr) {
          console.warn("Upload ke server gagal, menggunakan media lokal:", uploadErr);
        }
      }

      const currentFilterObj = VISUAL_FILTERS.find((f) => f.id === selectedFilter);
      const newStoryId = `story-${Date.now()}`;

      addStory({
        userId: currentUser.id,
        user: {
          name: currentUser.name,
          username: currentUser.username,
          avatarUrl: currentUser.avatarUrl,
        },
        mediaUrl: finalMediaUrl,
        mediaType,
        videoDuration: mediaType === "video" ? videoDuration : 10,
        quality,
        textOverlays,
        stickers,
        taggedUsers,
        tagPositions,
        visualFilter: currentFilterObj && currentFilterObj.cssFilter !== "none" ? currentFilterObj.cssFilter : undefined,
        effectOverlay: selectedEffect !== "none" ? selectedEffect : undefined,
      });

      // Module 11: Tag Story otomatis masuk ke DM lawan bicara dengan tombol Repost Story ala Instagram
      if (taggedUsers && taggedUsers.length > 0) {
        taggedUsers.forEach((tag) => {
          const cleanUser = tag.replace(/^@/, "").toLowerCase();
          const target =
            registeredUsers.find((u) => u.username.toLowerCase() === cleanUser) ||
            onlineUsers.find((u) => u.username.toLowerCase() === cleanUser);
          if (target) {
            const targetProfile: UserProfile = {
              id: target.id,
              name: target.name,
              username: target.username,
              email: target.email,
              avatarUrl: target.avatarUrl,
              bannerUrl: target.bannerUrl || "",
              bio: target.bio || "",
              isOnline: target.isOnline ?? true,
              followersCount: target.followersCount || 0,
              followingCount: target.followingCount || 0,
              postsCount: target.postsCount || 0,
            };
            const convId = getOrCreateConversation(targetProfile);
            sendMessage(convId, "", {
              storyMention: {
                storyId: newStoryId,
                mediaUrl: finalMediaUrl,
                mediaType,
                authorUsername: currentUser.username,
                authorName: currentUser.name,
              },
            });
          }
        });
      }

      router.push("/");
    } catch (err: any) {
      console.error("Story publish error:", err);
      alert("Gagal membagikan cerita. Silakan coba kembali.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/90 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between relative select-none transition-colors duration-200">
      {/* Hidden file input */}
      <input
        ref={mediaInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleMediaUpload}
        className="hidden"
      />

      {/* Studio Header Bar */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 backdrop-blur-md z-30 shrink-0 shadow-xs">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </Link>
        </div>

        {/* Center Title Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-sky-400/10 border border-blue-200/60 dark:border-sky-400/20">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
          <span className="font-bold text-xs text-blue-900 dark:text-sky-300 tracking-wide">
            Studio Cerita
          </span>
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Alihkan mode tema"
            title={theme === "dark" ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Quality Trigger (Low, Medium, High HD) */}
          <button
            type="button"
            onClick={() => setActiveTool(activeTool === "quality" ? null : "quality")}
            aria-label="Pengaturan Kualitas Cerita"
            title="Kualitas Cerita (HD / Standar)"
            className={cn(
              "flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95",
              quality === "high"
                ? "bg-emerald-600 text-white"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
            )}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="text-[11px] uppercase tracking-wider">{quality === "high" ? "HD" : quality}</span>
          </button>

          {/* Filter Visual Trigger */}
          <button
            type="button"
            onClick={() => setActiveTool(activeTool === "filter" ? null : "filter")}
            aria-label="Filter Visual Estetik"
            title="Filter Visual Estetik"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs active:scale-95",
              selectedFilter !== "normal" || activeTool === "filter"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            )}
          >
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
          </button>

          {/* Efek Animasi Trigger */}
          <button
            type="button"
            onClick={() => setActiveTool(activeTool === "effect" ? null : "effect")}
            aria-label="Efek Animasi Partikel"
            title="Efek Animasi Partikel & Shimmer"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs active:scale-95",
              selectedEffect !== "none" || activeTool === "effect"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            )}
          >
            <Wand2 className="w-4 h-4" />
            <span className="hidden sm:inline">Efek</span>
          </button>

          {/* Add Text Trigger */}
          <button
            type="button"
            onClick={() => setActiveTool(activeTool === "text" ? null : "text")}
            aria-label="Tambah Teks Cerita"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs active:scale-95",
              activeTool === "text"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            )}
          >
            <Type className="w-4 h-4" />
            <span className="hidden sm:inline">Teks</span>
          </button>

          {/* Add Sticker Trigger */}
          <button
            type="button"
            onClick={() => setActiveTool(activeTool === "sticker" ? null : "sticker")}
            aria-label="Tambah Stiker & Emoji"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs active:scale-95",
              activeTool === "sticker"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            )}
          >
            <Smile className="w-4 h-4" />
            <span className="hidden sm:inline">Stiker</span>
          </button>

          {/* Tag Akun (@) Trigger */}
          <button
            type="button"
            onClick={() => setIsTagModalOpen(true)}
            aria-label="Tag Akun Pengguna"
            title="Tag Akun Pengguna (@)"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs active:scale-95",
              taggedUsers.length > 0
                ? "bg-sky-500 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            )}
          >
            <span className="font-extrabold text-sm text-sky-400 group-hover:text-white">@</span>
            <span className="hidden sm:inline">Tag {taggedUsers.length > 0 ? `(${taggedUsers.length})` : ""}</span>
          </button>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <main className="flex-1 flex items-center justify-center p-0 sm:p-6 overflow-hidden">
        <div
          className={cn(
            "relative w-full h-[calc(100dvh-125px)] sm:h-[680px] sm:max-w-[390px] bg-black sm:rounded-[44px] sm:border-[10px] border-slate-800 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden transition-all duration-300 ring-1 ring-white/10"
          )}
        >
          {/* iPhone 16 Pro Dynamic Island */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-35 flex items-center justify-between px-3 w-28 h-7 bg-black/95 rounded-full border border-white/10 shadow-lg pointer-events-none">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-white tracking-widest font-mono">
              {mediaType === "video" ? "REC" : "STORY"}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500/80" />
          </div>

          {mediaUrl ? (
            /* Active Media Canvas with Draggable Overlays */
            <div
              ref={canvasRef}
              onPointerMove={handlePointerMoveCanvas}
              onPointerUp={handlePointerUpCanvas}
              className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden touch-none"
            >
              {/* Ambient Blurred Depth Backdrop */}
              <div className="absolute inset-0 overflow-hidden opacity-40 blur-2xl scale-125 pointer-events-none">
                {mediaType === "video" ? (
                  <video
                    src={mediaUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Foreground Media with Selected Visual Filter */}
              {mediaType === "video" ? (
                <video
                  src={mediaUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    filter: VISUAL_FILTERS.find((f) => f.id === selectedFilter)?.cssFilter || undefined,
                  }}
                  className="relative z-10 max-w-full max-h-full object-contain transition-all duration-300 pointer-events-none"
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt="Story preview"
                  style={{
                    filter: VISUAL_FILTERS.find((f) => f.id === selectedFilter)?.cssFilter || undefined,
                  }}
                  className="relative z-10 max-w-full max-h-full object-contain transition-all duration-300 pointer-events-none"
                />
              )}

              {/* Real-time Interactive Effects Overlay (Sparkles, VHS, Bokeh, Grain) */}
              <StoryEffectsOverlay effect={selectedEffect} />

              {/* Quality & Active Filter/Effect Badges */}
              <div className="absolute top-12 left-4 z-20 flex items-center gap-1.5 flex-wrap pointer-events-none">
                <div className="px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-black tracking-wider text-emerald-400 border border-emerald-400/30 shadow-xs">
                  {quality.toUpperCase()} HD
                </div>
                {selectedFilter !== "normal" && (
                  <div className="px-2.5 py-0.5 rounded-full bg-purple-600/80 backdrop-blur-md text-[10px] font-bold text-white border border-purple-400/40 shadow-xs">
                    🎨 {VISUAL_FILTERS.find((f) => f.id === selectedFilter)?.name}
                  </div>
                )}
                {selectedEffect !== "none" && (
                  <div className="px-2.5 py-0.5 rounded-full bg-amber-500/80 backdrop-blur-md text-[10px] font-bold text-white border border-amber-300/40 shadow-xs animate-pulse">
                    ✨ {EFFECT_OVERLAYS.find((e) => e.id === selectedEffect)?.name}
                  </div>
                )}
              </div>

              {/* Draggable Text Overlays Layer */}
              {textOverlays.map((to) => (
                <div
                  key={to.id}
                  onPointerDown={(e) => handlePointerDownItem(e, to.id, "text")}
                  style={{
                    top: `${to.position.y}%`,
                    left: `${to.position.x}%`,
                    transform: "translate(-50%, -50%)",
                    backgroundColor: to.bgColor,
                    color: to.color,
                    fontFamily: to.fontFamily || "inherit",
                  }}
                  className="absolute z-20 px-3.5 py-1.5 rounded-xl font-bold text-center text-sm shadow-md flex items-center gap-2 group cursor-grab active:cursor-grabbing select-none"
                  title="Geser teks ke mana saja, atau klik X untuk hapus"
                >
                  <span>{to.text}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTextOverlays((prev) => prev.filter((item) => item.id !== to.id));
                    }}
                    className="p-0.5 rounded-full hover:bg-black/30 text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Draggable Sticker Overlays Layer */}
              {stickers.map((st) => (
                <div
                  key={st.id}
                  onPointerDown={(e) => handlePointerDownItem(e, st.id, "sticker")}
                  style={{
                    top: `${st.position.y}%`,
                    left: `${st.position.x}%`,
                    transform: "translate(-50%, -50%)",
                    fontSize: `${st.size || 40}px`,
                    fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", sans-serif',
                  }}
                  className="absolute z-20 cursor-grab active:cursor-grabbing group select-none relative"
                  title="Geser emoji ke mana saja, atau klik X untuk hapus"
                >
                  <span>{st.emoji}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStickers((prev) => prev.filter((item) => item.id !== st.id));
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}

              {/* Tagged Users Mentions Layer */}
              {taggedUsers.map((tag) => {
                const cleanTag = tag.replace(/^@/, "");
                const pos = tagPositions[cleanTag] || tagPositions[tag] || { x: 50, y: 70 };
                return (
                  <div
                    key={tag}
                    style={{
                      top: `${pos.y}%`,
                      left: `${pos.x}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    className="absolute z-20 px-3 py-1.5 rounded-full bg-black/80 hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 shadow-xl border border-white/20 group cursor-pointer animate-in zoom-in-95 duration-150"
                    onClick={() => {
                      setTaggedUsers((prev) => prev.filter((t) => t !== tag && t !== cleanTag));
                    }}
                    title="Ketuk untuk menghapus tag"
                  >
                    <span className="text-sky-400 font-bold">@</span>
                    <span>{cleanTag}</span>
                    <X className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                );
              })}

              {/* Floating Media Controls Pill */}
              <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                <button
                  type="button"
                  onClick={() => mediaInputRef.current?.click()}
                  className="pointer-events-auto px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-xs font-semibold text-white border border-white/20 transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Ganti Media</span>
                </button>

                {(textOverlays.length > 0 || stickers.length > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      setTextOverlays([]);
                      setStickers([]);
                    }}
                    className="pointer-events-auto px-3 py-1.5 rounded-full bg-red-600/80 hover:bg-red-600 backdrop-blur-md text-xs font-semibold text-white transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Elemen</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Modern Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-5 bg-gradient-to-b from-white via-slate-50 to-slate-100/60 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-blue-50 dark:bg-sky-400/10 text-blue-600 dark:text-sky-400 border border-blue-200/60 dark:border-sky-400/20 shadow-xs">
                <Upload className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Buat Cerita Baru
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[240px] leading-relaxed">
                  Bagikan momen 24 jam dengan foto atau video resolusi tinggi tanpa pecah.
                </p>
              </div>

              {/* Primary Select Button */}
              <button
                type="button"
                onClick={() => mediaInputRef.current?.click()}
                className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Pilih Foto atau Video</span>
              </button>

              {/* Instant Preset Cards */}
              <div className="pt-2 w-full">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-2.5">
                  Atau coba latar belakang contoh:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_BACKGROUNDS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setMediaUrl(item.url);
                        setMediaType("image");
                      }}
                      className="group flex flex-col items-center gap-1 focus:outline-none"
                    >
                      <img
                        src={item.url}
                        alt={item.title}
                        className="w-14 h-20 rounded-xl object-cover border-2 border-transparent group-hover:border-blue-500 dark:group-hover:border-sky-400 group-hover:scale-105 transition-all shadow-xs"
                      />
                      <span className="text-[9px] font-medium text-slate-600 dark:text-slate-400 truncate max-w-14">
                        {item.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Quality Setting Drawer */}
      {activeTool === "quality" && (
        <div className="absolute bottom-20 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-40 space-y-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Kualitas Unggahan Cerita
            </span>
            <button
              type="button"
              onClick={() => setActiveTool(null)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {[
              {
                id: "high" as const,
                title: "Ultra HD (Kualitas Penuh)",
                desc: "Resolusi 1080p tajam, jernih tanpa pecah (Rekomendasi)",
                badge: "Terbaik",
              },
              {
                id: "medium" as const,
                title: "Standar Seimbang (720p)",
                desc: "Kecepatan unggah normal dengan kualitas tetap baik",
                badge: "Seimbang",
              },
              {
                id: "low" as const,
                title: "Hemat Kuota (480p)",
                desc: "Kompresi cepat, cocok saat koneksi lambat",
                badge: "Cepat",
              },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setQuality(opt.id);
                  setStoryUploadQuality(opt.id);
                  setActiveTool(null);
                }}
                className={cn(
                  "w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all",
                  quality === opt.id
                    ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-500/10 text-slate-900 dark:text-slate-100"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                )}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{opt.title}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 font-semibold">
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {opt.desc}
                  </p>
                </div>
                {quality === opt.id && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Text Drawer */}
      {activeTool === "text" && (
        <div className="absolute bottom-20 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-40 space-y-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Tambah Teks Cerita
            </span>
            <button
              type="button"
              onClick={() => setActiveTool(null)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            type="text"
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder="Ketik teks cerita Anda..."
            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />

          {/* Color Chips */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Warna:
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  style={{ backgroundColor: c.hex }}
                  onClick={() => setTextColor(c.hex)}
                  title={c.name}
                  className={cn(
                    "w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 transition-transform",
                    textColor === c.hex && "scale-125 ring-2 ring-blue-500"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Font Typography Selector */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Pilihan Font:
            </span>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {STORY_FONTS.map((font) => (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => setSelectedFont(font.fontFamily)}
                  style={{ fontFamily: font.fontFamily }}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs whitespace-nowrap border transition-all active:scale-95 shrink-0",
                    selectedFont === font.fontFamily
                      ? "bg-blue-600 text-white border-blue-600 font-bold shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  )}
                >
                  {font.name}
                </button>
              ))}
            </div>
          </div>

          {/* Position & Apply Controls */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1">
              {(["top", "center", "bottom"] as const).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setTextPos(pos)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-colors",
                    textPos === pos
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  {pos === "top" ? "Atas" : pos === "center" ? "Tengah" : "Bawah"}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleApplyText}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold active:scale-95 transition-all shadow-xs"
            >
              Terapkan
            </button>
          </div>
        </div>
      )}

      {/* Floating Sticker Drawer */}
      {activeTool === "sticker" && (
        <div className="absolute bottom-20 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-40 space-y-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Pilih Stiker & Emoji
            </span>
            <button
              type="button"
              onClick={() => setActiveTool(null)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div
            className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1"
            style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", sans-serif' }}
          >
            {STORY_STICKERS.map((emoji, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddSticker(emoji)}
                className="w-12 h-12 text-2xl flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-125 transition-all shadow-2xs border border-slate-100 dark:border-slate-700"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal Tag Akun Pengguna */}
      {isTagModalOpen && (
        <div
          onClick={() => setIsTagModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 font-extrabold text-base flex items-center justify-center">
                  @
                </span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Tag Akun (@)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Pilih akun untuk ditag di cerita Anda
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTagModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <input
              type="text"
              value={tagSearchQuery}
              onChange={(e) => setTagSearchQuery(e.target.value)}
              placeholder="Cari nama atau @username..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-sky-500"
            />

            {/* User List */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800/60">
              {(() => {
                const combined = new Map<string, { id: string; name: string; username: string; avatarUrl: string }>();
                registeredUsers.forEach((u) => {
                  if (u.id !== currentUser.id) {
                    combined.set(u.username.toLowerCase(), {
                      id: u.id,
                      name: u.name,
                      username: u.username,
                      avatarUrl: u.avatarUrl,
                    });
                  }
                });
                onlineUsers.forEach((u) => {
                  if (u.id !== currentUser.id && !combined.has(u.username.toLowerCase())) {
                    combined.set(u.username.toLowerCase(), {
                      id: u.id,
                      name: u.name,
                      username: u.username,
                      avatarUrl: u.avatarUrl,
                    });
                  }
                });

                const list = Array.from(combined.values()).filter((u) => {
                  if (!tagSearchQuery.trim()) return true;
                  const q = tagSearchQuery.toLowerCase();
                  return u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
                });

                if (list.length === 0) {
                  return (
                    <div className="py-6 text-center text-xs text-slate-400">
                      Tidak ada akun yang cocok
                    </div>
                  );
                }

                return list.map((user) => {
                  const isTagged = taggedUsers.includes(user.username);
                  return (
                    <div
                      key={user.id}
                      className="pt-1.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {user.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            @{user.username}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (isTagged) {
                            setTaggedUsers((prev) => prev.filter((u) => u !== user.username));
                          } else {
                            setTaggedUsers((prev) => [...prev, user.username]);
                            setTagPositions((prev) => ({
                              ...prev,
                              [user.username]: { x: 50, y: Math.min(80, 55 + taggedUsers.length * 8) },
                            }));
                          }
                        }}
                        className={cn(
                          "px-3 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-95",
                          isTagged
                            ? "bg-sky-500 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                        )}
                      >
                        {isTagged ? "Ditag ✓" : "Tag"}
                      </button>
                    </div>
                  );
                });
              })()}
            </div>

            <button
              type="button"
              onClick={() => setIsTagModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              Selesai ({taggedUsers.length} Ditag)
            </button>
          </div>
        </div>
      )}

      {/* Bottom Publish Bar */}
      <footer className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 backdrop-blur-md z-30 shrink-0">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 min-w-0">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
            />
            <span className="truncate font-medium">Bagikan sebagai {currentUser.name}</span>
          </div>

          <button
            type="button"
            onClick={handlePublish}
            disabled={!mediaUrl || isPublishing}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs transition-all shadow-md active:scale-95",
              mediaUrl && !isPublishing
                ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:shadow-lg"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60"
            )}
          >
            <span>{isPublishing ? "Membagikan..." : "Bagikan ke Cerita"}</span>
            <Send className={cn("w-3.5 h-3.5", isPublishing && "animate-spin")} />
          </button>
        </div>
      </footer>
    </div>
  );
}
