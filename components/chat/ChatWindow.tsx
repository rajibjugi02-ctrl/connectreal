"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Paperclip,
  Smile,
  Send,
  CheckCheck,
  Check,
  Phone,
  Video,
  MoreVertical,
  Mic,
  X,
  Play,
  Pause,
  FileText,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  Reply,
  Forward,
  Copy,
  Trash2,
  Search,
  BellOff,
  Bell,
  User as UserIcon,
  Ban,
  Eraser,
  MoreHorizontal,
  AlertCircle,
  PhoneIncoming,
  PhoneMissed,
  Image as ImageIcon,
  Pencil,
  Info,
} from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useTranslation } from "@/lib/i18n/translations";
import { MessageItem } from "@/lib/types";
import { formatTimestamp, cn } from "@/lib/utils";
import { getChatPartner } from "@/lib/utils/chatPartner";
import { pushToServer } from "@/lib/sync/clientSync";
import { ForwardMessageView } from "./ForwardMessageView";
import { GroupDetailsModal } from "./GroupDetailsModal";
import { StoryViewer } from "@/components/stories/StoryViewer";
import { ApplePulseDots } from "@/components/ui/apple-pulse-dots";
import { CardCornerFan } from "@/components/ui/card-corner-fan";
import { DeleteMessageModal } from "./DeleteMessageModal";
import { canSeeOnlineStatus, getOnlineDotClass } from "@/lib/utils/onlineStatus";

interface ChatWindowProps {
  onBack?: () => void;
}

// Upload helper: Mengunggah berkas biner ke server /api/upload agar hemat kuota & anti lag/freeze di HP
async function uploadMediaFile(file: File | Blob, filename: string): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("file", file, filename);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.url) {
        return data.url;
      }
    }
  } catch (err) {
    console.warn("Upload endpoint failed, fallback to compressed base64:", err);
  }
  return "";
}

// In-app synthetic WAV audio note generation for mobile browsers without getUserMedia over LAN
function createSyntheticVoiceNoteBlob(durationSeconds: number): Blob {
  const sampleRate = 8000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const numSamples = Math.max(8000, Math.floor(Math.max(1, durationSeconds) * sampleRate));
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = numSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // 'RIFF' chunk
  view.setUint32(0, 0x52494646, false);
  view.setUint32(4, 36 + dataSize, true);
  view.setUint32(8, 0x57415645, false); // 'WAVE'

  // 'fmt ' chunk
  view.setUint32(12, 0x666d7420, false);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // 'data' chunk
  view.setUint32(36, 0x64617461, false);
  view.setUint32(40, dataSize, true);

  // Harmonious pleasant sound wave (audible chime)
  let offset = 44;
  for (let i = 0; i < numSamples; i++, offset += 2) {
    const t = i / sampleRate;
    // Nada harmonis 520Hz + overtone agar terdengar jelas & natural
    const tone =
      Math.sin(2 * Math.PI * 520 * t) * 0.28 * Math.exp(-((t % 0.8) * 2.0)) +
      Math.sin(2 * Math.PI * 660 * t) * 0.12 * Math.exp(-((t % 0.8) * 3.0));
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(tone * 32767)));
    view.setInt16(offset, intSample, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

// iOS-style emoji collection with categories
const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥹", "😊", "😇", "🙂", "😉", "😌", "😍", "🥰", "😘", "😗", "😚", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🫡", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "😮‍💨", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐"],
  },
  {
    name: "Gestures",
    emojis: ["👍", "👎", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✌️", "🤞", "🫰", "🤟", "🤘", "👌", "🤌", "🤏", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐️", "🖖", "👋", "🤙", "💪", "🦾", "🖕", "✍️", "🤳"],
  },
  {
    name: "Hearts & Fire",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "✨", "🔥", "💥", "⭐", "🌟", "💫", "⚡"],
  },
  {
    name: "Tech & Work",
    emojis: ["💻", "🖥️", "📱", "📲", "💾", "⌨️", "🖱️", "💡", "🚀", "⚡", "⚙️", "🛠️", "🔧", "📡", "🔋", "🔌", "📊", "📈", "📉", "📁", "📂", "📄", "📑", "🔒", "🔑", "🎯", "🏆", "☕"],
  },
];

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const BUBBLE_COLOR_CLASSES: Record<string, string> = {
  blue: "bg-blue-600 text-white rounded-br-xs",
  slate: "bg-slate-900 dark:bg-black text-white border border-slate-700 rounded-br-xs",
  emerald: "bg-emerald-600 text-white rounded-br-xs",
  purple: "bg-purple-600 text-white rounded-br-xs",
  rose: "bg-rose-600 text-white rounded-br-xs",
  amber: "bg-amber-600 text-white rounded-br-xs",
};

const getWallpaperStyle = (wallpaper?: string): React.CSSProperties => {
  if (!wallpaper || wallpaper === "default") return {};
  if (wallpaper.startsWith("data:") || wallpaper.startsWith("http")) {
    return {
      backgroundImage: `url(${wallpaper})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  }
  if (wallpaper === "dark-mesh") {
    return {
      background: "radial-gradient(at 0% 0%, rgba(30, 41, 59, 0.7) 0, transparent 50%), radial-gradient(at 50% 100%, rgba(15, 23, 42, 0.9) 0, transparent 50%)",
    };
  }
  if (wallpaper === "starry") {
    return {
      background: "radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%)",
    };
  }
  if (wallpaper === "sunset") {
    return {
      background: "linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(217, 70, 239, 0.15) 100%)",
    };
  }
  if (wallpaper === "grid") {
    return {
      backgroundImage: "linear-gradient(to right, rgba(120, 120, 120, 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(120, 120, 120, 0.12) 1px, transparent 1px)",
      backgroundSize: "24px 24px",
    };
  }
  return {};
};

export function ChatWindow({ onBack }: ChatWindowProps) {
  const router = useRouter();
  const {
    conversations,
    activeConversationId,
    messages,
    sendMessage,
    deleteMessage,
    deleteMessageForEveryone,
    deleteMessageForMe,
    editMessage,
    clearConversation,
    deleteConversation,
    addReaction,
    forwardMessage,
    currentUser,
    readReceiptsEnabled,
    blockedUsers,
    blockUser,
    unblockUser,
    deleteContact,
    chatCustomization,
    registeredUsers,
    onlineUsers,
    typingStatus,
    stories,
    contactAliases,
  } = useAppStore();

  const { t } = useTranslation();

  const [inputVal, setInputVal] = useState("");
  const [editingMessage, setEditingMessage] = useState<MessageItem | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<MessageItem | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [viewStoryId, setViewStoryId] = useState<string | null>(null);
  const [storyExpiredToast, setStoryExpiredToast] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState(0);

  // Input & File picker refs
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mobileMicInputRef = useRef<HTMLInputElement>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const isSimulatedRecordingRef = useRef(false);

  // Voice note recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioMimeTypeRef = useRef<string>("audio/webm;codecs=opus");

  // Audio playback state tracker ala WhatsApp
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<Record<string, number>>({});
  const [audioCurrentTimes, setAudioCurrentTimes] = useState<Record<string, number>>({});
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Image Lightbox modal state
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    fileName?: string;
  } | null>(null);
  const [isLightboxZoomed, setIsLightboxZoomed] = useState(false);

  // Desktop Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    message: MessageItem | null;
  }>({ visible: false, x: 0, y: 0, message: null });

  // Mobile Bottom Sheet state for message actions
  const [mobileActionMessage, setMobileActionMessage] = useState<MessageItem | null>(null);

  // Reply state
  const [replyingTo, setReplyingTo] = useState<MessageItem | null>(null);

  // Forwarding State - dedicated full page/view (Item 2)
  const [forwardingMessage, setForwardingMessage] = useState<MessageItem | null>(null);

  // Group Details Modal State
  const [isGroupDetailsOpen, setIsGroupDetailsOpen] = useState(false);

  // Header 3-Dots Menu State (Item 3)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isChatMuted, setIsChatMuted] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Copy feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Touch tracking for mobile long-press
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageFeedRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const rawConvMessages = activeConversationId ? messages[activeConversationId] || [] : [];

  // Lawan bicara yang sebenarnya (memastikan header dan bubble lawan bukan profil diri sendiri)
  const partner = useMemo(() => {
    return getChatPartner(activeConv, currentUser, registeredUsers, onlineUsers, rawConvMessages);
  }, [activeConv, currentUser, registeredUsers, onlineUsers, rawConvMessages]);

  // Deteksi dan resolusi spesifik user yang sedang mengetik (khusus grup & obrolan personal)
  const typingMember = useMemo(() => {
    if (!activeConversationId) return null;
    const convTyping = typingStatus[activeConversationId];
    if (!convTyping) return null;
    const now = Date.now();
    for (const [uid, timestamp] of Object.entries(convTyping)) {
      const isNotMe =
        uid !== currentUser.id &&
        uid !== currentUser.username &&
        uid.toLowerCase() !== (currentUser.username || "").toLowerCase();
      if (isNotMe && typeof timestamp === "number" && now - timestamp < 4500) {
        const found =
          registeredUsers.find(
            (u) =>
              u.id === uid ||
              u.username === uid ||
              u.username?.toLowerCase() === uid.toLowerCase()
          ) ||
          onlineUsers.find(
            (u) =>
              u.id === uid ||
              u.username === uid ||
              u.username?.toLowerCase() === uid.toLowerCase()
          ) ||
          activeConv?.participants?.find(
            (p) =>
              p.id === uid ||
              p.username === uid ||
              p.username?.toLowerCase() === uid.toLowerCase()
          );
        return {
          id: uid,
          name: found?.name || (uid.startsWith("user-") ? uid.slice(5) : uid),
          username: found?.username || uid,
          avatarUrl:
            found?.avatarUrl ||
            `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(uid)}`,
        };
      }
    }
    return null;
  }, [typingStatus, activeConversationId, currentUser, registeredUsers, onlineUsers, activeConv]);

  const isPartnerTyping = Boolean(typingMember);

  const senderColors = useMemo(
    () => [
      "text-emerald-600 dark:text-emerald-400",
      "text-indigo-600 dark:text-indigo-400",
      "text-amber-600 dark:text-amber-400",
      "text-rose-600 dark:text-rose-400",
      "text-cyan-600 dark:text-cyan-400",
      "text-teal-600 dark:text-teal-400",
      "text-violet-600 dark:text-violet-400",
      "text-orange-600 dark:text-orange-400",
    ],
    []
  );

  const getSenderColorClass = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
    }
    return senderColors[Math.abs(hash) % senderColors.length];
  };

  const getSenderInfo = (senderId: string) => {
    if (
      senderId === currentUser.id ||
      (currentUser.username && senderId.toLowerCase() === currentUser.username.toLowerCase())
    ) {
      return {
        name: currentUser.name,
        username: currentUser.username,
        avatarUrl: currentUser.avatarUrl,
      };
    }
    const found =
      registeredUsers.find(
        (u) =>
          u.id === senderId ||
          u.username === senderId ||
          u.username?.toLowerCase() === senderId.toLowerCase()
      ) ||
      onlineUsers.find(
        (u) =>
          u.id === senderId ||
          u.username === senderId ||
          u.username?.toLowerCase() === senderId.toLowerCase()
      ) ||
      activeConv?.participants?.find(
        (p) =>
          p.id === senderId ||
          p.username === senderId ||
          p.username?.toLowerCase() === senderId.toLowerCase()
      );
    const cleanName =
      found?.name && found.name !== activeConv?.groupName
        ? found.name
        : found?.username || senderId;
    return {
      name: cleanName,
      username: found?.username || senderId,
      avatarUrl:
        found?.avatarUrl ||
        `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(senderId)}`,
    };
  };

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);
    if (!activeConversationId) return;

    pushToServer("TYPING_STATUS", {
      conversationId: activeConversationId,
      userId: currentUser.id,
      username: currentUser.username,
      isTyping: val.trim().length > 0,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      pushToServer("TYPING_STATUS", {
        conversationId: activeConversationId,
        userId: currentUser.id,
        username: currentUser.username,
        isTyping: false,
      });
    }, 3000);
  };

  // Status blokir kontak saat ini
  const isContactBlocked = Boolean(
    activeConv &&
    blockedUsers.some(
      (b) => b.id === partner.id || b.username === partner.username
    )
  );

  const handleBlockToggle = () => {
    if (!activeConv) return;
    if (isContactBlocked) {
      unblockUser(partner.id);
      showToast(`Blokir kontak @${partner.username} dibuka`);
    } else {
      blockUser({
        id: partner.id,
        name: partner.name,
        username: partner.username,
        avatarUrl: partner.avatarUrl,
      });
      showToast(`Kontak @${partner.username} telah diblokir`);
    }
    setShowOptionsMenu(false);
  };

  const handleDeleteContact = () => {
    if (!activeConv) return;
    if (typeof window !== "undefined" && window.confirm(`Hapus kontak @${partner.username} beserta seluruh riwayat obrolan?`)) {
      deleteContact(activeConv.id, partner.id);
      showToast(`Kontak @${partner.username} berhasil dihapus`);
      if (onBack) onBack();
    }
    setShowOptionsMenu(false);
  };

  // Filter messages if search is active
  const convMessages = useMemo(() => {
    if (!isSearchActive || !searchQuery.trim()) return rawConvMessages;
    const q = searchQuery.toLowerCase();
    return rawConvMessages.filter(
      (m) =>
        (m.content && m.content.toLowerCase().includes(q)) ||
        (m.fileName && m.fileName.toLowerCase().includes(q))
    );
  }, [rawConvMessages, isSearchActive, searchQuery]);

  // Scroll to bottom on new messages or when partner starts typing (scroll internal container only to prevent parent window/main scroll bug)
  useEffect(() => {
    if (!isSearchActive && messageFeedRef.current) {
      messageFeedRef.current.scrollTo({
        top: messageFeedRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [rawConvMessages.length, isSearchActive, isPartnerTyping]);

  // Clean up recording timer on unmount
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxImage) setLightboxImage(null);
        if (contextMenu.visible) setContextMenu({ visible: false, x: 0, y: 0, message: null });
        if (mobileActionMessage) setMobileActionMessage(null);
        if (editingMessage) {
          setEditingMessage(null);
          setInputVal("");
        }
        if (showEmojiPicker) setShowEmojiPicker(false);
        if (showAttachMenu) setShowAttachMenu(false);
        if (showOptionsMenu) setShowOptionsMenu(false);
        if (forwardingMessage) setForwardingMessage(null);
        if (isSearchActive) {
          setIsSearchActive(false);
          setSearchQuery("");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    lightboxImage,
    contextMenu.visible,
    mobileActionMessage,
    showEmojiPicker,
    showAttachMenu,
    showOptionsMenu,
    forwardingMessage,
    isSearchActive,
  ]);

  // Close context menu, attachment menu, and options menu on outside click
  useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0, message: null });
      }
      if (showOptionsMenu) {
        setShowOptionsMenu(false);
      }
      if (showAttachMenu) {
        setShowAttachMenu(false);
      }
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, [contextMenu.visible, showOptionsMenu, showAttachMenu]);

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleStartEdit = (msg: MessageItem) => {
    setEditingMessage(msg);
    setInputVal(msg.content || "");
    setReplyingTo(null);
    setContextMenu({ visible: false, x: 0, y: 0, message: null });
    setMobileActionMessage(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || !activeConversationId) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    pushToServer("TYPING_STATUS", {
      conversationId: activeConversationId,
      userId: currentUser.id,
      username: currentUser.username,
      isTyping: false,
    });

    if (editingMessage) {
      editMessage(activeConversationId, editingMessage.id, inputVal.trim());
      setInputVal("");
      setEditingMessage(null);
      showToast("Pesan berhasil diedit");
      return;
    }

    const replyData = replyingTo
      ? {
          id: replyingTo.id,
          senderName:
            replyingTo.senderId === currentUser.id
              ? currentUser.name
              : partner.name || "Kontak",
          text: replyingTo.content || replyingTo.fileName || "Lampiran",
          type: replyingTo.type,
        }
      : undefined;

    sendMessage(activeConversationId, inputVal.trim(), {
      replyTo: replyData,
    });

    setInputVal("");
    setShowEmojiPicker(false);
    setReplyingTo(null);
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputVal((prev) => prev + emoji);
  };

  // Helper kompresi gambar berbasis Canvas: menjaga kualitas foto kamera HP (4K/12MP)
  // tetap tajam namun berukuran ringan (~150KB), mencegah QuotaExceededError di mobile browser
  const compressImageFile = (file: File, maxDim = 1280, quality = 0.82): Promise<string> => {
    return new Promise((resolve, reject) => {
      // File SVG & GIF dibiarkan utuh tanpa re-encode
      if (file.type === "image/gif" || file.type === "image/svg+xml") {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      const img = document.createElement("img");
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let width = img.naturalWidth || img.width || 800;
        let height = img.naturalHeight || img.height || 600;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        try {
          const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedDataUrl);
        } catch {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      };

      img.src = objectUrl;
    });
  };

  // Dedicated Image Picker Handler: Mendukung pemilihan banyak foto sekaligus di iOS & Android
  const handleImageFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0 || !activeConversationId) return;

    const files = Array.from(fileList);
    if (imageInputRef.current) imageInputRef.current.value = "";

    try {
      if (files.length > 1) {
        showToast(`Memproses ${files.length} foto...`);
        const processedUrls = await Promise.all(
          files.map(async (file) => {
            const uploaded = await uploadMediaFile(file, file.name);
            if (uploaded) return uploaded;
            return compressImageFile(file);
          })
        );

        sendMessage(activeConversationId, `${files.length} Foto`, {
          type: "image",
          mediaUrl: processedUrls[0],
          mediaUrls: processedUrls,
          fileName: `${files.length} Foto`,
        });
        showToast(`${files.length} foto berhasil dikirim`);
      } else {
        const file = files[0];
        const uploadedUrl = await uploadMediaFile(file, file.name);
        const finalUrl = uploadedUrl || (await compressImageFile(file));
        const formattedSize =
          file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(file.size / 1024)} KB`;

        sendMessage(activeConversationId, "", {
          type: "image",
          mediaUrl: finalUrl,
          fileName: file.name,
          fileSize: formattedSize,
        });
      }
    } catch (err) {
      console.error("Gagal memproses gambar:", err);
      showToast("Gagal memproses gambar");
    }
  };

  // General File/Document Handler: Menjamin berkas jamak tidak terabaikan
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0 || !activeConversationId) return;

    const files = Array.from(fileList);
    if (fileInputRef.current) fileInputRef.current.value = "";

    const isImageFile = (f: File) =>
      f.type.startsWith("image/") || /\.(jpe?g|png|gif|webp|heic|heif|bmp|svg)$/i.test(f.name);

    const allImages = files.every(isImageFile);

    // Jika seluruh berkas adalah gambar dan lebih dari 1, kemas ke album kipas
    if (allImages && files.length > 1) {
      showToast(`Memproses ${files.length} foto...`);
      const processedUrls = await Promise.all(
        files.map(async (file) => {
          const uploaded = await uploadMediaFile(file, file.name);
          if (uploaded) return uploaded;
          return compressImageFile(file);
        })
      );

      sendMessage(activeConversationId, `${files.length} Foto`, {
        type: "image",
        mediaUrl: processedUrls[0],
        mediaUrls: processedUrls,
        fileName: `${files.length} Foto`,
      });
      return;
    }

    // Kirim berkas dokumen/gambar secara berurutan
    for (const file of files) {
      const formattedSize =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

      if (isImageFile(file)) {
        const uploadedUrl = await uploadMediaFile(file, file.name);
        const finalUrl = uploadedUrl || (await compressImageFile(file));
        sendMessage(activeConversationId, "", {
          type: "image",
          mediaUrl: finalUrl,
          fileName: file.name,
          fileSize: formattedSize,
        });
      } else {
        const uploadedUrl = await uploadMediaFile(file, file.name);
        if (uploadedUrl) {
          sendMessage(activeConversationId, "", {
            type: "file",
            mediaUrl: uploadedUrl,
            fileName: file.name,
            fileSize: formattedSize,
          });
        } else {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            sendMessage(activeConversationId, "", {
              type: "file",
              mediaUrl: dataUrl,
              fileName: file.name,
              fileSize: formattedSize,
            });
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  // Perekaman suara asli perangkat mobile (iOS Safari / Android Browser via input capture)
  const handleMobileAudioCaptured = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversationId) return;

    // Reset value input agar dapat dipilih ulang
    e.target.value = "";

    try {
      showToast("Mengirim pesan suara...");

      // Hitung durasi suara secara presisi
      let duration = 3;
      try {
        const tempUrl = URL.createObjectURL(file);
        const tempAudio = new Audio(tempUrl);
        await new Promise<void>((resolve) => {
          tempAudio.onloadedmetadata = () => {
            if (tempAudio.duration && isFinite(tempAudio.duration)) {
              duration = Math.max(1, Math.round(tempAudio.duration));
            }
            resolve();
          };
          tempAudio.onerror = () => resolve();
          setTimeout(resolve, 800);
        });
        URL.revokeObjectURL(tempUrl);
      } catch {
        // Fallback default durasi
      }

      const ext = file.name.endsWith(".m4a")
        ? ".m4a"
        : file.name.endsWith(".wav")
        ? ".wav"
        : file.name.endsWith(".mp3")
        ? ".mp3"
        : ".mp4";
      const filename = `vn_${Date.now()}${ext}`;

      const uploadedUrl = await uploadMediaFile(file, filename);
      if (uploadedUrl) {
        sendMessage(activeConversationId, "", {
          type: "audio",
          mediaUrl: uploadedUrl,
          audioDuration: duration,
          fileName: "Pesan Suara",
        });
        showToast("Pesan suara terkirim");
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Audio = event.target?.result as string;
          sendMessage(activeConversationId, "", {
            type: "audio",
            mediaUrl: base64Audio,
            audioDuration: duration,
            fileName: "Pesan Suara",
          });
          showToast("Pesan suara terkirim");
        };
        reader.readAsDataURL(file);
      }
    } catch {
      showToast("Gagal mengirim pesan suara");
    }
  };

  // Dynamic audio MIME type selection: prioritaskan audio/mp4 dan audio/aac agar kompatibel penuh di iOS Safari & Windows
  const getSupportedAudioMimeType = () => {
    if (typeof MediaRecorder === "undefined") return "";
    const preferredMimeTypes = [
      "audio/mp4",
      "audio/aac",
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];
    for (const mime of preferredMimeTypes) {
      if (typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(mime)) {
        return mime;
      }
    }
    return "";
  };

  // Perekaman pesan suara real-time dengan MediaRecorder atau antarmuka mikrofon bawaan smartphone
  const startRecording = async () => {
    // Pada browser mobile tanpa dukungan getUserMedia langsung
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      showToast("Akses mikrofon tidak didukung di peramban ini");
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const selectedMime = getSupportedAudioMimeType();
      audioMimeTypeRef.current = selectedMime;

      const options: MediaRecorderOptions = {};
      if (selectedMime) {
        options.mimeType = selectedMime;
      }

      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch {
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      isSimulatedRecordingRef.current = false;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordDuration(0);

      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      recordTimerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn("Direct microphone hardware access unavailable:", err);
      showToast("Izin mikrofon diperlukan untuk merekam suara langsung");
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current.stream?.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
    }
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setIsRecording(false);
    setRecordDuration(0);
    audioChunksRef.current = [];
    isSimulatedRecordingRef.current = false;
  };

  const stopAndSendRecording = async () => {
    if (!activeConversationId) return;

    const duration = recordDuration || 1;
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setIsRecording(false);
    setRecordDuration(0);

    // Fallback sintetis in-app murni (tanpa membuka picker file iOS/Android)
    if (isSimulatedRecordingRef.current || !mediaRecorderRef.current) {
      isSimulatedRecordingRef.current = false;
      const wavBlob = createSyntheticVoiceNoteBlob(duration);
      const filename = `vn_${Date.now()}.wav`;

      const uploadedUrl = await uploadMediaFile(wavBlob, filename);
      if (uploadedUrl) {
        sendMessage(activeConversationId, "", {
          type: "audio",
          mediaUrl: uploadedUrl,
          audioDuration: duration,
          fileName: "Pesan Suara",
        });
        showToast("Pesan suara terkirim");
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Audio = event.target?.result as string;
          sendMessage(activeConversationId, "", {
            type: "audio",
            mediaUrl: base64Audio,
            audioDuration: duration,
            fileName: "Pesan Suara",
          });
          showToast("Pesan suara terkirim");
        };
        reader.readAsDataURL(wavBlob);
      }
      return;
    }

    const rec = mediaRecorderRef.current;
    rec.onstop = async () => {
      const mime = audioMimeTypeRef.current || "audio/webm";
      const audioBlob = new Blob(audioChunksRef.current, { type: mime });
      const ext = mime.includes("quicktime") ? ".mov" : mime.includes("mp4") ? ".mp4" : ".webm";
      const filename = `vn_${Date.now()}${ext}`;

      const uploadedUrl = await uploadMediaFile(audioBlob, filename);
      if (uploadedUrl) {
        sendMessage(activeConversationId, "", {
          type: "audio",
          mediaUrl: uploadedUrl,
          audioDuration: duration,
          fileName: "Pesan Suara",
        });
        showToast("Pesan suara terkirim");
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Audio = event.target?.result as string;
          sendMessage(activeConversationId, "", {
            type: "audio",
            mediaUrl: base64Audio,
            audioDuration: duration,
            fileName: "Pesan Suara",
          });
          showToast("Pesan suara terkirim");
        };
        reader.readAsDataURL(audioBlob);
      }

      rec.stream?.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
    };

    if (rec.state === "recording") {
      rec.stop();
    }
  };

  const togglePlayAudio = (msgId: string, audioUrl?: string) => {
    if (!audioUrl) return;

    if (playingAudioId === msgId) {
      audioPlayerRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      const audio = new Audio(audioUrl);
      audio.volume = 1.0;
      audio.preload = "auto";
      audioPlayerRef.current = audio;

      audio.ontimeupdate = () => {
        if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
          const ratio = audio.currentTime / audio.duration;
          setAudioProgress((prev) => ({ ...prev, [msgId]: ratio }));
          setAudioCurrentTimes((prev) => ({ ...prev, [msgId]: Math.floor(audio.currentTime) }));
        }
      };
      audio.onended = () => {
        setPlayingAudioId(null);
        setAudioProgress((prev) => ({ ...prev, [msgId]: 0 }));
        setAudioCurrentTimes((prev) => ({ ...prev, [msgId]: 0 }));
      };
      audio.play().catch(async (err) => {
        console.warn("Standard HTMLAudio playback failed, attempting AudioContext decoding:", err);
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            if (ctx.state === "suspended") {
              await ctx.resume();
            }
            const response = await fetch(audioUrl);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);

            const totalDur = audioBuffer.duration || 1;
            const startTime = ctx.currentTime;
            setPlayingAudioId(msgId);

            const interval = setInterval(() => {
              const elapsed = ctx.currentTime - startTime;
              if (elapsed >= totalDur) {
                clearInterval(interval);
                setPlayingAudioId(null);
                setAudioProgress((prev) => ({ ...prev, [msgId]: 0 }));
                setAudioCurrentTimes((prev) => ({ ...prev, [msgId]: 0 }));
              } else {
                setAudioProgress((prev) => ({ ...prev, [msgId]: elapsed / totalDur }));
                setAudioCurrentTimes((prev) => ({ ...prev, [msgId]: Math.floor(elapsed) }));
              }
            }, 100);

            source.onended = () => {
              clearInterval(interval);
              setPlayingAudioId(null);
              setAudioProgress((prev) => ({ ...prev, [msgId]: 0 }));
              setAudioCurrentTimes((prev) => ({ ...prev, [msgId]: 0 }));
            };
            source.start(0);
            return;
          }
        } catch (decodeErr) {
          console.warn("AudioContext fallback also failed:", decodeErr);
        }
        setPlayingAudioId(null);
        showToast("Format audio tidak didukung oleh browser ini");
      });
      setPlayingAudioId(msgId);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Open context menu: Desktop at cursor, Mobile via bottom drawer
  const triggerMessageActions = (msg: MessageItem, clientX?: number, clientY?: number) => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    if (isMobile || clientX === undefined || clientY === undefined) {
      setMobileActionMessage(msg);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(25);
      }
    } else {
      const menuWidth = 220;
      const menuHeight = 240;
      const x = Math.min(clientX, window.innerWidth - menuWidth - 16);
      const y = Math.min(clientY, window.innerHeight - menuHeight - 16);
      setContextMenu({
        visible: true,
        x: Math.max(16, x),
        y: Math.max(16, y),
        message: msg,
      });
    }
  };

  // Mobile touch listeners with scroll threshold cancellation
  const handleTouchStart = (msg: MessageItem, e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

    touchTimerRef.current = setTimeout(() => {
      triggerMessageActions(msg);
    }, 400);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current) return;
    const touch = e.touches[0];
    const diff = Math.hypot(
      touch.clientX - touchStartPosRef.current.x,
      touch.clientY - touchStartPosRef.current.y
    );
    // Cancel long press if user is scrolling
    if (diff > 10 && touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  const handleTouchEnd = (msg: MessageItem, e: React.TouchEvent) => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
    // Geser ke kanan (swipe to reply ala WhatsApp)
    if (touchStartPosRef.current && e.changedTouches && e.changedTouches[0]) {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartPosRef.current.x;
      const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
      if (dx > 45 && dy < 30) {
        setReplyingTo(msg);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
    touchStartPosRef.current = null;
  };

  const handleCopyMessage = (msg: MessageItem) => {
    const text = msg.content || msg.fileName || "";
    if (text) {
      navigator.clipboard.writeText(text);
      showToast("Pesan disalin ke papan klip");
    }
    setContextMenu({ visible: false, x: 0, y: 0, message: null });
    setMobileActionMessage(null);
  };

  // Dedicated Forward Execution
  const handleExecuteForward = (targetConvIds: string[]) => {
    if (!forwardingMessage) return;
    targetConvIds.forEach((targetId) => {
      forwardMessage(targetId, forwardingMessage);
    });
    setForwardingMessage(null);
    showToast(`Pesan berhasil diteruskan ke ${targetConvIds.length} obrolan`);
  };

  // Copy Full Chat Transcript
  const handleCopyChatTranscript = () => {
    if (convMessages.length === 0) {
      showToast("Tidak ada riwayat obrolan untuk disalin");
      return;
    }
    const transcript = convMessages
      .map((m) => {
        const sender =
          m.senderId === currentUser.id ? currentUser.name : activeConv?.participant.name || "Kontak";
        const content = m.content || m.fileName || `[${m.type}]`;
        return `[${formatTimestamp(m.createdAt)}] ${sender}: ${content}`;
      })
      .join("\n");

    navigator.clipboard.writeText(transcript);
    setShowOptionsMenu(false);
    showToast("Riwayat obrolan berhasil disalin ke papan klip");
  };

  // Clear Chat History Confirmation
  const handleConfirmClearChat = () => {
    if (!activeConversationId) return;
    clearConversation(activeConversationId);
    setShowClearConfirm(false);
    setShowOptionsMenu(false);
    showToast("Riwayat obrolan telah dibersihkan");
  };

  // Lightbox download handler
  const handleDownloadLightboxImage = () => {
    if (!lightboxImage?.url) return;
    const a = document.createElement("a");
    a.href = lightboxImage.url;
    a.download = lightboxImage.fileName || `connectreal-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("Foto berhasil diunduh");
  };

  // Real document & file download handler
  const handleDownloadFile = async (e: React.MouseEvent, url: string, fileName?: string) => {
    e.stopPropagation();
    try {
      if (url.startsWith("data:") || url.startsWith("blob:")) {
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName || "dokumen";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast("Berkas berhasil diunduh");
        return;
      }
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName || "dokumen";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      showToast("Berkas berhasil diunduh");
    } catch {
      window.open(url, "_blank");
    }
  };

  const handleShareToStory = () => {
    if (!lightboxImage?.url) return;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("draft_story_media", lightboxImage.url);
    }
    setLightboxImage(null);
    router.push("/stories/create");
  };

  if (!activeConv) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 relative">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Kembali ke daftar pesan"
            className="md:hidden absolute top-4 left-4 p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 dark:bg-sky-400/10 text-blue-600 dark:text-sky-400 flex items-center justify-center font-bold text-xl mb-4 shadow-xs">
          CR
        </div>
        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
          {t.chatSelectPrompt}
        </h3>
        <p className="text-xs max-w-xs mt-1 leading-relaxed">
          {t.chatSelectDesc}
        </p>
      </div>
    );
  }

  const localAlias = partner ? (contactAliases[partner.id] || contactAliases[partner.username] || "") : "";
  const displayName = activeConv.isGroup ? activeConv.groupName : (localAlias || partner?.name || "Pengguna");
  const participantProfileUrl = `/profile/${partner?.username || activeConv.participant?.username || "user"}`;

  const isTargetFollowing = Boolean(
    onlineUsers.find((u) => u.id === partner.id || u.username === partner.username)?.isFollowing ||
    registeredUsers.find((u) => u.id === partner.id || u.username === partner.username)?.isFollowing
  );
  const isOnlineVisible = canSeeOnlineStatus(partner, currentUser, isTargetFollowing);

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden bg-white dark:bg-slate-900 relative">
      {/* Contact Header: Tetap terkunci di atas dengan safe-area inset agar tidak terpotong status bar */}
      <div 
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))" }}
        className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-[#E2E8F0] dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0 z-20"
      >
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Kembali ke daftar pesan"
              className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Avatar: Profil kontak atau Pengaturan Grup */}
          {activeConv.isGroup ? (
            <button
              type="button"
              onClick={() => router.push(`/messages/group/${activeConv.id}/info`)}
              className="relative shrink-0 group text-left"
              title="Lihat detail grup"
            >
              <img
                src={activeConv.participant?.avatarUrl || partner.avatarUrl}
                alt={displayName || "Grup"}
                className="w-10 h-10 rounded-full object-cover group-hover:scale-105 transition-transform"
              />
            </button>
          ) : (
            <Link href={participantProfileUrl} className="relative shrink-0 group">
              <img
                src={partner.avatarUrl}
                alt={displayName || "Kontak"}
                className="w-10 h-10 rounded-full object-cover group-hover:scale-105 transition-transform"
              />
              <div
                title={isOnlineVisible ? "Online" : "Offline"}
                className={cn(
                  "absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white dark:ring-slate-900",
                  getOnlineDotClass(isOnlineVisible)
                )}
              />
            </Link>
          )}

          {/* Name & Subtitle */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              {activeConv.isGroup ? (
                <button
                  type="button"
                  onClick={() => router.push(`/messages/group/${activeConv.id}/info`)}
                  className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:underline block truncate text-left"
                >
                  {displayName}
                </button>
              ) : (
                <Link
                  href={participantProfileUrl}
                  className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:underline block truncate"
                >
                  {displayName}
                </Link>
              )}
              {isChatMuted && (
                <span title="Notifikasi dibisukan">
                  <BellOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </span>
              )}
            </div>
            <p className="text-[11px] truncate">
              {activeConv.isGroup ? (
                typingMember ? (
                  <span className="text-emerald-500 dark:text-emerald-400 font-semibold inline-flex items-center gap-1.5">
                    <span>{typingMember.name} sedang mengetik</span>
                    <ApplePulseDots size="xs" color="bg-emerald-500 dark:bg-emerald-400" />
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.push(`/messages/group/${activeConv.id}/info`)}
                    className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-sky-400 transition-colors text-left"
                  >
                    {activeConv.participantIds?.length || activeConv.participants?.length || 1} Anggota • Ketuk untuk detail
                  </button>
                )
              ) : isPartnerTyping ? (
                <span className="text-emerald-500 dark:text-emerald-400 font-semibold inline-flex items-center gap-1.5">
                  <span>sedang mengetik</span>
                  <ApplePulseDots size="xs" color="bg-emerald-500 dark:bg-emerald-400" />
                </span>
              ) : isOnlineVisible ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">{t.chatOnline}</span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400">{t.chatOffline}</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons: Group Details & 3-Dots Menu */}
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 relative">
          <button
            type="button"
            onClick={() => {
              if (activeConv.isGroup) {
                router.push(`/messages/group/${activeConv.id}/info`);
              } else {
                router.push(`/messages/contact/${partner.id || partner.username}/info`);
              }
            }}
            aria-label="Informasi & Detail"
            title={activeConv.isGroup ? "Detail & Info Grup" : "Info Kontak & Media"}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-sky-400 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* 3-Dots More Options Menu Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowOptionsMenu(!showOptionsMenu);
              }}
              aria-label="Opsi obrolan lainnya"
              title="Opsi Obrolan"
              className={cn(
                "p-2 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95",
                showOptionsMenu
                  ? "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-sky-400"
                  : "hover:bg-black/5 dark:hover:bg-white/5"
              )}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* 3-Dots Dropdown Menu */}
            {showOptionsMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 shadow-xl p-1.5 z-30 animate-in fade-in zoom-in-95 duration-100 select-none"
              >
                {/* 1. View Profile */}
                <Link
                  href={participantProfileUrl}
                  onClick={() => setShowOptionsMenu(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                  <span>Lihat Profil @{partner.username}</span>
                </Link>

                {/* 2. In-Chat Search */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchActive(true);
                    setShowOptionsMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                >
                  <Search className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Cari dalam Obrolan</span>
                </button>

                {/* 3. Mute / Unmute Notifications */}
                <button
                  type="button"
                  onClick={() => {
                    setIsChatMuted(!isChatMuted);
                    setShowOptionsMenu(false);
                    showToast(!isChatMuted ? "Notifikasi percakapan dibisukan" : "Notifikasi diaktifkan");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                >
                  {isChatMuted ? (
                    <>
                      <Bell className="w-4 h-4 text-emerald-500" />
                      <span>Aktifkan Notifikasi</span>
                    </>
                  ) : (
                    <>
                      <BellOff className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span>Bisukan Notifikasi</span>
                    </>
                  )}
                </button>

                {/* 4. Copy Chat Transcript */}
                <button
                  type="button"
                  onClick={handleCopyChatTranscript}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                >
                  <Copy className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Salin Riwayat Obrolan</span>
                </button>

                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />

                {/* 5. Clear Chat History */}
                <button
                  type="button"
                  onClick={() => {
                    setShowOptionsMenu(false);
                    setShowClearConfirm(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                >
                  <Eraser className="w-4 h-4" />
                  <span>Bersihkan Obrolan</span>
                </button>

                {/* 6. Block / Unblock Contact */}
                <button
                  type="button"
                  onClick={handleBlockToggle}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <Ban className="w-4 h-4" />
                  <span>{isContactBlocked ? "Buka Blokir Kontak" : "Blokir Kontak"}</span>
                </button>

                {/* 7. Delete Contact */}
                <button
                  type="button"
                  onClick={handleDeleteContact}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Kontak</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* In-Chat Search Bar */}
      {isSearchActive && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[#E2E8F0] dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 shrink-0 animate-in fade-in slide-in-from-top-1">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pesan dalam obrolan ini..."
            autoFocus
            className="flex-1 bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
          />
          {searchQuery && (
            <span className="text-[11px] font-semibold text-slate-400 px-1.5">
              {convMessages.length} ditemukan
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setIsSearchActive(false);
              setSearchQuery("");
            }}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Message History Feed */}
      <div 
        ref={messageFeedRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40 dark:bg-slate-900/40"
        style={getWallpaperStyle(chatCustomization?.wallpaper)}
      >
        {convMessages.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-xs">
              {isSearchActive ? "Tidak ada pesan yang cocok dengan pencarian." : "Belum ada pesan. Mulai percakapan sekarang!"}
            </p>
          </div>
        ) : (
          convMessages.map((msg) => {
            // Render WhatsApp-Style Call Log Card jika pesan merupakan log panggilan
            if (msg.type === "call_log") {
              const isMissed = msg.callLog?.status === "missed";
              const isDeclined = msg.callLog?.status === "declined";
              const isCompleted = msg.callLog?.status === "completed";
              const isVideo = msg.callLog?.callType === "video";
              const formatCallDur = (seconds: number) => {
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return mins > 0 ? `${mins} mnt ${secs} dtk` : `${secs} dtk`;
              };

              return (
                <div
                  key={msg.id}
                  onClick={() =>
                    router.push(
                      `/call?type=${isVideo ? "video" : "voice"}&convId=${activeConversationId}`
                    )
                  }
                  className="mx-auto my-2.5 w-full max-w-[320px] sm:max-w-xs cursor-pointer select-none rounded-2xl bg-[#1F2C34] text-white border border-white/10 p-3.5 shadow-lg hover:bg-[#23323B] transition-all active:scale-[0.98] group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-xs",
                        isCompleted
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/20 text-rose-400"
                      )}
                    >
                      {isVideo ? (
                        <Video className="w-5 h-5" />
                      ) : isMissed || isDeclined ? (
                        <PhoneMissed className="w-5 h-5" />
                      ) : (
                        <PhoneIncoming className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-100 group-hover:text-sky-300 transition-colors truncate">
                        {isCompleted
                          ? `Panggilan ${isVideo ? "video" : "suara"} selesai`
                          : isDeclined
                          ? `Panggilan ${isVideo ? "video" : "suara"} ditolak`
                          : `Panggilan ${isVideo ? "video" : "suara"} tak terjawab`}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
                        {isCompleted && msg.callLog?.duration ? (
                          <span className="text-emerald-400 font-medium">
                            {formatCallDur(msg.callLog.duration)} •
                          </span>
                        ) : null}
                        <span className="hover:underline">Ketuk untuk menelepon balik</span>
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 self-end">
                      {formatTimestamp(msg.createdAt)}
                    </span>
                  </div>
                </div>
              );
            }

            // Pesan sistem / status pembaruan grup ala WhatsApp (ditampilkan di tengah)
            const isSystem =
              msg.type === "system" ||
              msg.content?.includes("membuat grup") ||
              msg.content?.includes("menjadikan") ||
              msg.content?.includes("mengubah nama grup") ||
              msg.content?.includes("mengubah foto profil grup") ||
              msg.content?.includes("mengeluarkan") ||
              msg.content?.includes("menambahkan") ||
              msg.content?.includes("keluar dari grup");

            if (isSystem) {
              return (
                <div key={msg.id} id={`msg-${msg.id}`} className="flex justify-center my-2.5 px-4 w-full">
                  <div className="px-3.5 py-1.5 rounded-xl bg-slate-200/90 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium shadow-2xs border border-slate-300/40 dark:border-slate-700/50 text-center max-w-[85%] break-words">
                    {msg.content}
                  </div>
                </div>
              );
            }

            const isSender = msg.senderId === currentUser.id;
            const senderInfo = isSender ? null : getSenderInfo(msg.senderId);

            return (
              <div
                key={msg.id}
                id={`msg-${msg.id}`}
                className={cn(
                  "flex items-end gap-1.5 max-w-[88%] sm:max-w-[75%] group relative transition-all duration-300",
                  isSender ? "ml-auto justify-end" : "mr-auto justify-start"
                )}
                onContextMenu={(e) => {
                  e.preventDefault();
                  triggerMessageActions(msg, e.clientX, e.clientY);
                }}
                onTouchStart={(e) => handleTouchStart(msg, e)}
                onTouchMove={handleTouchMove}
                onTouchEnd={(e) => handleTouchEnd(msg, e)}
              >
                {/* Avatar pengirim pesan di grup ala WhatsApp */}
                {activeConv?.isGroup && !isSender && senderInfo && (
                  <img
                    src={senderInfo.avatarUrl}
                    alt={senderInfo.name}
                    className="w-7 h-7 rounded-full object-cover shrink-0 mb-1 ring-1 ring-slate-200 dark:ring-slate-700 shadow-2xs"
                  />
                )}

                <div
                  className={cn(
                    "flex flex-col max-w-full",
                    isSender ? "items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-1 max-w-full",
                      isSender ? "justify-end" : "justify-start"
                    )}
                  >
                    {/* WhatsApp-Style Quick Reply Button: Touch-friendly di mobile & hover di desktop */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReplyingTo(msg);
                        inputRef.current?.focus();
                      }}
                      title="Balas pesan (ala WhatsApp)"
                      aria-label="Balas pesan"
                      className={cn(
                        "p-1.5 rounded-full text-slate-400 hover:text-blue-600 dark:hover:text-sky-400 hover:bg-black/5 dark:hover:bg-white/5 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-all shrink-0 active:scale-90",
                        isSender ? "order-first" : "order-last"
                      )}
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>

                    {/* Small Action Trigger for Touch & Hover Convenience */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerMessageActions(msg);
                      }}
                      aria-label="Pilihan pesan"
                      className={cn(
                        "p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
                        isSender ? "order-first" : "order-last"
                      )}
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>

                    {/* Bubble Container (Disesuaikan dengan panjang konten - tanpa background untuk album kipas kartu) */}
                    <div
                      className={cn(
                        msg.type === "image" && msg.mediaUrls && msg.mediaUrls.length > 1
                          ? "p-0 bg-transparent shadow-none border-none max-w-full inline-block"
                          : cn(
                              "p-3 rounded-2xl text-sm leading-relaxed shadow-xs break-words transition-all w-fit max-w-full inline-block",
                              isSender
                                ? (BUBBLE_COLOR_CLASSES[chatCustomization?.bubbleColor || "blue"] || "bg-blue-600 text-white rounded-br-xs")
                                : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-[#E2E8F0] dark:border-slate-700 rounded-bl-xs"
                            )
                      )}
                    >
                      {/* Nama Pengirim di dalam bubble grup ala WhatsApp */}
                      {activeConv?.isGroup && !isSender && senderInfo && (
                        <div
                          className={cn(
                            "text-[11px] font-bold mb-1 truncate leading-tight select-none",
                            getSenderColorClass(msg.senderId)
                          )}
                        >
                          {senderInfo.name}
                        </div>
                      )}
                    {/* Quoted Reply Preview (Ala WhatsApp) */}
                    {msg.replyTo && (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          const targetEl = document.getElementById(`msg-${msg.replyTo?.id}`);
                          if (targetEl) {
                            targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
                            targetEl.classList.add("ring-2", "ring-blue-400", "scale-[1.02]");
                            setTimeout(() => {
                              targetEl.classList.remove("ring-2", "ring-blue-400", "scale-[1.02]");
                            }, 1200);
                          }
                        }}
                        className={cn(
                          "mb-2 p-2 rounded-xl text-xs border-l-4 transition-all cursor-pointer text-left select-none",
                          isSender
                            ? "bg-black/25 border-white text-white/95 hover:bg-black/35"
                            : "bg-slate-100 dark:bg-slate-700/60 border-blue-600 dark:border-sky-400 text-slate-700 dark:text-slate-200 hover:bg-slate-200/60"
                        )}
                      >
                        <div
                          className={cn(
                            "font-bold text-[11px] opacity-95 flex items-center gap-1",
                            isSender ? "text-white" : "text-blue-600 dark:text-sky-300"
                          )}
                        >
                          <Reply className="w-3 h-3 rotate-180" />
                          <span>{msg.replyTo.senderName}</span>
                        </div>
                        <div className="truncate text-[11px] opacity-85 mt-0.5">
                          {msg.replyTo.text}
                        </div>
                      </div>
                    )}

                    {/* Story Mention Card (Ala Instagram DM: Menyebut Anda dalam cerita + Tombol "Tambahkan ke Cerita Anda") */}
                    {msg.storyMention && (
                      <div className="mb-2 p-3 rounded-2xl border border-sky-400/40 bg-gradient-to-br from-sky-500/15 via-blue-500/10 to-indigo-500/15 backdrop-blur-xs space-y-2.5 max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
                          <span className="text-xs font-bold text-sky-600 dark:text-sky-300">
                            @{msg.storyMention.authorUsername} menyebut Anda dalam cerita
                          </span>
                        </div>
                        {msg.storyMention.mediaUrl && (
                          <div className="relative w-full h-36 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                            {msg.storyMention.mediaType === "video" ? (
                              <video
                                src={msg.storyMention.mediaUrl}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                              />
                            ) : (
                              <img
                                src={msg.storyMention.mediaUrl}
                                alt="Story Mention"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/stories/create?repostMedia=${encodeURIComponent(msg.storyMention!.mediaUrl)}&repostStoryId=${msg.storyMention!.storyId}`
                            );
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Tambahkan ke Cerita Anda</span>
                        </button>
                      </div>
                    )}

                    {/* Story Reply Preview (Thumbnail cerita + Header Balasan - Interaktif & Bisa Diklik) */}
                    {msg.storyReply && (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          const targetStory = stories.find((s) => s.id === msg.storyReply!.storyId);
                          if (targetStory) {
                            setViewStoryId(msg.storyReply!.storyId);
                          } else {
                            setStoryExpiredToast(true);
                            setTimeout(() => setStoryExpiredToast(false), 3000);
                          }
                        }}
                        className={cn(
                          "flex items-center gap-2.5 p-2 mb-2 rounded-xl border backdrop-blur-xs cursor-pointer transition-all active:scale-[0.98] group/story",
                          isSender
                            ? "bg-black/25 hover:bg-black/35 border-white/20 text-white"
                            : "bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-700/60 dark:hover:bg-slate-700/90 border-slate-200 dark:border-slate-600/60 text-slate-900 dark:text-slate-100"
                        )}
                        title="Ketuk untuk memutar cerita"
                      >
                        <div className="relative w-10 h-13 rounded-lg overflow-hidden shrink-0 bg-black border border-white/10 group-hover/story:scale-105 transition-transform">
                          {msg.storyReply.mediaType === "video" ? (
                            <video
                              src={msg.storyReply.mediaUrl}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                            />
                          ) : (
                            <img
                              src={msg.storyReply.mediaUrl}
                              alt="Cerita"
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover/story:opacity-100 transition-opacity">
                            <Play className="w-3.5 h-3.5 text-white fill-white" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-extrabold tracking-wide uppercase opacity-85 flex items-center justify-between">
                            <span>
                              {isSender
                                ? `Membalas cerita @${msg.storyReply.authorUsername}`
                                : "Membalas cerita Anda"}
                            </span>
                            <span className="text-[9px] text-blue-400 dark:text-sky-300 font-semibold lowercase opacity-90 group-hover/story:underline">
                              buka cerita ↗
                            </span>
                          </div>
                          <div className="text-[11px] opacity-75 truncate mt-0.5">
                            Lampiran Cerita • Ketuk untuk melihat
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 1. IMAGE BUBBLE: Multiple Images (CardCornerFan ala @amicro/card-corner-fan) atau Single Image */}
                    {msg.type === "image" && (msg.mediaUrls?.length || msg.mediaUrl) ? (
                      msg.mediaUrls && msg.mediaUrls.length > 1 ? (
                        <div className="space-y-1.5">
                          <CardCornerFan
                            images={msg.mediaUrls}
                            isSender={isSender}
                            onSelectImage={(url, idx) => {
                              setLightboxImage({
                                url,
                                fileName: `connectreal-album-${msg.id}-${idx + 1}.png`,
                              });
                              setIsLightboxZoomed(false);
                            }}
                          />
                          {msg.content && msg.content !== `${msg.mediaUrls.length} Foto` && (
                            <div
                              className={cn(
                                "mt-1.5 px-3 py-1.5 rounded-2xl text-xs sm:text-sm shadow-xs break-words max-w-full",
                                isSender
                                  ? (BUBBLE_COLOR_CLASSES[chatCustomization?.bubbleColor || "blue"] || "bg-blue-600 text-white rounded-br-xs")
                                  : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-[#E2E8F0] dark:border-slate-700 rounded-bl-xs"
                              )}
                            >
                              {msg.content}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <img
                            src={msg.mediaUrl || msg.mediaUrls?.[0]}
                            alt="Gambar terkirim"
                            className="rounded-xl max-h-72 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setLightboxImage({
                                url: (msg.mediaUrl || msg.mediaUrls?.[0])!,
                                fileName: msg.fileName || `connectreal-${msg.id}.png`,
                              });
                              setIsLightboxZoomed(false);
                            }}
                          />
                          {msg.content && msg.content !== "Foto" && (
                            <p className="text-xs pt-1">{msg.content}</p>
                          )}
                        </div>
                      )
                    ) : /* 2. AUDIO / VOICE NOTE BUBBLE (Ala WhatsApp) - Responsif di mobile */
                    msg.type === "audio" || (msg.mediaUrl && (msg.mediaUrl.startsWith("data:audio/") || msg.mediaUrl.endsWith(".m4a") || msg.mediaUrl.endsWith(".mp3") || msg.mediaUrl.endsWith(".aac") || msg.mediaUrl.endsWith(".wav") || msg.mediaUrl.endsWith(".webm") || msg.mediaUrl.endsWith(".ogg"))) ? (
                      <div className="flex items-center gap-2 sm:gap-3 py-1 px-0.5 w-full max-w-full min-w-0">
                        <button
                          type="button"
                          onClick={() => togglePlayAudio(msg.id, msg.mediaUrl)}
                          aria-label={playingAudioId === msg.id ? "Jeda pesan suara" : "Putar pesan suara"}
                          className={cn(
                            "w-8.5 h-8.5 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-md",
                            isSender
                              ? "bg-white text-blue-600 hover:bg-slate-100"
                              : "bg-blue-600 text-white dark:bg-sky-500 hover:bg-blue-700 dark:hover:bg-sky-600"
                          )}
                        >
                          {playingAudioId === msg.id ? (
                            <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                          ) : (
                            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current ml-0.5" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          {/* Animated Scrubber Waveform Bars */}
                          <div className="flex items-center gap-0.5 sm:gap-1 h-6 sm:h-7 w-full max-w-[150px] sm:max-w-[200px]">
                            {[35, 70, 50, 95, 60, 85, 45, 100, 75, 45, 80, 60, 40, 75, 55, 90].map(
                              (h, idx) => {
                                const currentRatio = audioProgress[msg.id] || 0;
                                const isPlayed = idx / 16 <= currentRatio;
                                return (
                                  <span
                                    key={idx}
                                    style={{ height: `${h}%` }}
                                    className={cn(
                                      "flex-1 min-w-[2px] max-w-[3px] rounded-full transition-colors duration-150",
                                      isSender
                                        ? isPlayed
                                          ? "bg-white"
                                          : "bg-white/40"
                                        : isPlayed
                                        ? "bg-blue-600 dark:bg-sky-400"
                                        : "bg-slate-300 dark:bg-slate-600"
                                    )}
                                  />
                                );
                              }
                            )}
                          </div>
                          <div
                            className={cn(
                              "text-[10px] mt-0.5 font-semibold flex items-center justify-between",
                              isSender ? "text-white/85" : "text-slate-500 dark:text-slate-400"
                            )}
                          >
                            <span>
                              {playingAudioId === msg.id && audioCurrentTimes[msg.id] !== undefined
                                ? `${formatDuration(audioCurrentTimes[msg.id])} / ${formatDuration(msg.audioDuration || 0)}`
                                : formatDuration(msg.audioDuration || 0)}
                            </span>
                            <span className="text-[9px] opacity-80 flex items-center gap-1">
                              <Mic className="w-3 h-3" />
                              <span>{t.chatVoiceNote}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : /* 3. FILE / DOCUMENT BUBBLE */
                    msg.type === "file" ? (
                      <div className="flex items-center gap-3 p-1">
                        <div
                          className={cn(
                            "p-2.5 rounded-xl shrink-0",
                            isSender
                              ? "bg-white/20 text-white"
                              : "bg-blue-500/10 text-blue-600 dark:text-sky-400"
                          )}
                        >
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs truncate max-w-[180px]">
                            {msg.fileName || "Dokumen"}
                          </div>
                          <div
                            className={cn(
                              "text-[10px]",
                              isSender ? "text-white/80" : "text-slate-500 dark:text-slate-400"
                            )}
                          >
                            {msg.fileSize || "Berkas"}
                          </div>
                        </div>
                        {msg.mediaUrl && (
                          <button
                            type="button"
                            onClick={(e) => handleDownloadFile(e, msg.mediaUrl!, msg.fileName)}
                            className={cn(
                              "p-2 rounded-xl transition-colors cursor-pointer",
                              isSender
                                ? "hover:bg-white/20 text-white"
                                : "hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"
                            )}
                            title={t.chatDocDownloaded}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      /* 4. STANDARD TEXT BUBBLE */
                      msg.content
                    )}
                  </div>
                </div>

                {/* Message Reactions Badges */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1 px-1">
                    {msg.reactions.map((r, i) => {
                      const hasReacted = r.users.includes(currentUser.id);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => addReaction(activeConversationId, msg.id, r.emoji)}
                          className={cn(
                            "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors shadow-2xs active:scale-95",
                            hasReacted
                              ? "bg-blue-50 dark:bg-sky-500/20 border-blue-400 dark:border-sky-400 text-blue-600 dark:text-sky-300"
                              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400"
                          )}
                        >
                          <span style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", sans-serif' }}>
                            {r.emoji}
                          </span>
                          {r.count > 1 && (
                            <span className="text-[10px] font-bold">{r.count}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Status and timestamp */}
                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500 dark:text-slate-400 px-1">
                  <span>{formatTimestamp(msg.createdAt)}</span>
                  {msg.isEdited && (
                    <span className="italic opacity-80 text-[9px] font-medium">(diedit)</span>
                  )}
                  {isSender && (
                    readReceiptsEnabled ? (
                      <CheckCheck className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-slate-400" />
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* Animated typing indicator ala WhatsApp / Instagram */}
      {Boolean(typingMember) && (
        <div className="flex items-end gap-2 mr-auto mb-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <img
            src={
              activeConv?.isGroup
                ? typingMember?.avatarUrl || partner.avatarUrl
                : partner.avatarUrl
            }
            alt={typingMember?.name || partner.name}
            className="w-7 h-7 rounded-full object-cover shrink-0 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700"
          />
          <div className="flex items-center px-3.5 py-2.5 rounded-2xl rounded-bl-xs bg-slate-200/90 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-300/40 dark:border-slate-700/60">
            <ApplePulseDots size="sm" color="bg-blue-600 dark:bg-sky-400" />
          </div>
          <span className="text-[11px] text-slate-400 italic">
            {activeConv?.isGroup
              ? `${typingMember?.name} sedang mengetik...`
              : `${partner.name || `@${partner.username}`} sedang mengetik...`}
          </span>
        </div>
      )}

        <div ref={messagesEndRef} />
      </div>

      {/* WhatsApp-Style Reply Banner Above Input Bar */}
      {replyingTo && (
        <div className="mx-3 my-1.5 p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 border-l-4 border-l-blue-600 dark:border-l-sky-500 flex items-center justify-between gap-3 text-xs shrink-0 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex-1 min-w-0 pl-1">
            <div className="flex items-center gap-1.5">
              <Reply className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 rotate-180" />
              <span className="font-bold text-blue-600 dark:text-sky-400 text-xs truncate">
                {replyingTo.senderId === currentUser.id ? "Anda" : partner.name}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] truncate mt-0.5">
              {replyingTo.content || replyingTo.fileName || "Lampiran"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Batalkan balasan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Edit Message Banner Above Input Bar */}
      {editingMessage && (
        <div className="mx-3 my-1.5 p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 border-l-4 border-l-amber-500 flex items-center justify-between gap-3 text-xs shrink-0 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex-1 min-w-0 pl-1">
            <div className="flex items-center gap-1.5">
              <Pencil className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-bold text-amber-600 dark:text-amber-400 text-xs">
                Mengedit Pesan
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] truncate mt-0.5">
              {editingMessage.content || editingMessage.fileName || "Teks"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingMessage(null);
              setInputVal("");
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Batalkan edit pesan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Universal Standard Unicode Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-4 right-4 sm:left-4 sm:right-auto sm:w-80 bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-3xl shadow-2xl z-30 p-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E2E8F0] dark:border-slate-700">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Emoji Universal
            </span>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(false)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-1 mb-2 overflow-x-auto no-scrollbar">
            {EMOJI_CATEGORIES.map((cat, idx) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setEmojiCategory(idx)}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-semibold rounded-lg shrink-0 transition-colors",
                  emojiCategory === idx
                    ? "bg-blue-600 dark:bg-sky-500 text-white"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 max-h-48 overflow-y-auto p-1 font-sans">
            {EMOJI_CATEGORIES[emojiCategory].emojis.map((emoji, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleEmojiSelect(emoji)}
                className="w-9 h-9 text-xl flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hidden Native Pure Image Input (Multi-Photo Picker untuk Mobile iOS & Android) */}
      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleImageFilesChange}
        className="hidden"
      />

      {/* Hidden Native File Input (Dokumen & Berkas) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.zip,.txt,.xlsx,.pptx"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Hidden Native Audio Capture Input untuk Mobile Browser (iOS Safari / Android) */}
      <input
        ref={mobileMicInputRef}
        type="file"
        accept="audio/*"
        capture="user"
        onChange={handleMobileAudioCaptured}
        className="hidden"
      />

      {/* Sticky Bottom Input Bar: Responsif penuh & pas di layar HP tanpa memotong tombol kirim */}
      <div 
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))" }}
        className="px-2 py-2 sm:px-4 sm:py-2.5 border-t border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 w-full"
      >
        {isContactBlocked ? (
          <div className="p-3 sm:p-4 bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2.5">
              <Ban className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Anda telah memblokir kontak ini
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Anda tidak dapat mengirim atau menerima pesan dari @{partner.username}.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleBlockToggle}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Buka Blokir
              </button>
              <button
                type="button"
                onClick={handleDeleteContact}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 dark:border-red-900/40 transition-colors"
              >
                Hapus Kontak
              </button>
            </div>
          </div>
        ) : isRecording ? (
          <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 animate-pulse min-w-0">
            <div className="flex items-center gap-2 min-w-0 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
              <span className="text-xs font-bold truncate">
                <span className="hidden sm:inline">{t.chatRecording} </span>
                <span>{formatDuration(recordDuration)}</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={cancelRecording}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.chatCancelRecording}</span>
                <span className="sm:hidden">Batal</span>
              </button>
              <button
                type="button"
                onClick={stopAndSendRecording}
                className="flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-red-500 hover:bg-red-600 text-white shadow-xs transition-all active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.chatSendRecording}</span>
                <span className="sm:hidden">Kirim</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="relative flex items-center gap-1 sm:gap-1.5 w-full min-w-0">
            {/* Attachment Popover Menu */}
            {showAttachMenu && (
              <div
                className="absolute bottom-14 left-2 z-50 flex flex-col gap-1 p-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150 min-w-[210px]"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowAttachMenu(false);
                    imageInputRef.current?.click();
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/70 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div>Foto & Galeri</div>
                    <div className="text-[10px] font-normal text-slate-400">Pilih banyak foto sekaligus</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowAttachMenu(false);
                    fileInputRef.current?.click();
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/70 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div>Dokumen & Berkas</div>
                    <div className="text-[10px] font-normal text-slate-400">PDF, Word, Zip, dsb.</div>
                  </div>
                </button>
              </div>
            )}

            {/* Direct Image/Gallery Picker Button (1-tap photo multi-selector on mobile) */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              aria-label="Kirim Foto dari Galeri"
              title="Kirim Foto dari Galeri (Bisa pilih banyak)"
              className="p-1 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-sky-400 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 shrink-0"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            {/* Paperclip Button: Toggles attach menu */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAttachMenu((prev) => !prev);
              }}
              aria-label={t.chatAttachFile}
              title={t.chatAttachFile}
              className={cn(
                "p-1 sm:p-2 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 shrink-0",
                showAttachMenu
                  ? "text-blue-600 dark:text-sky-400 bg-blue-50 dark:bg-sky-400/10"
                  : "text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-sky-400 hover:bg-black/5 dark:hover:bg-white/5"
              )}
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              aria-label="Sisipkan Emoji Apple"
              className={cn(
                "p-1 sm:p-2 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 shrink-0",
                showEmojiPicker
                  ? "text-blue-600 dark:text-sky-400 bg-blue-50 dark:bg-sky-400/10"
                  : "text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-sky-400 hover:bg-black/5 dark:hover:bg-white/5"
              )}
            >
              <Smile className="w-5 h-5" />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={handleInputChange}
              placeholder={t.chatPlaceholder}
              className="flex-1 min-w-0 px-2.5 sm:px-4 py-2 sm:py-2.5 text-sm rounded-full border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-sky-400 touch-manipulation outline-none"
            />

            {inputVal.trim() ? (
              <button
                type="submit"
                aria-label={editingMessage ? "Simpan edit pesan" : "Kirim pesan"}
                className={cn(
                  "p-2 sm:p-2.5 rounded-full text-white transition-all active:scale-95 shadow-xs shrink-0 focus-visible:ring-2 focus-visible:ring-blue-500",
                  editingMessage
                    ? "bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-600"
                    : "bg-blue-600 hover:bg-blue-700 dark:bg-sky-500 dark:hover:bg-sky-600"
                )}
              >
                {editingMessage ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                onContextMenu={(e) => e.preventDefault()}
                aria-label="Mulai merekam pesan suara"
                title="Mulai pesan suara real-time (kualitas jernih 128 kbps)"
                className="p-2 sm:p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-sky-500/20 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-sky-400 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 shrink-0"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
          </form>
        )}
      </div>

      {/* Desktop Floating Context Menu */}
      {contextMenu.visible && contextMenu.message && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 w-56 rounded-2xl bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-100 select-none hidden sm:block"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick Reaction Bar */}
          <div className="flex items-center justify-between px-2 py-1.5 mb-1 border-b border-[#E2E8F0] dark:border-slate-700">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  if (contextMenu.message) {
                    addReaction(activeConversationId, contextMenu.message.id, emoji);
                  }
                  setContextMenu({ visible: false, x: 0, y: 0, message: null });
                }}
                className="text-lg hover:scale-125 active:scale-95 transition-transform p-1 rounded-md"
                style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", sans-serif' }}
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="space-y-0.5 text-xs font-medium text-slate-700 dark:text-slate-200">
            <button
              type="button"
              onClick={() => {
                setReplyingTo(contextMenu.message);
                setContextMenu({ visible: false, x: 0, y: 0, message: null });
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors text-left"
            >
              <Reply className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Balas</span>
            </button>

            {contextMenu.message?.senderId === currentUser.id && contextMenu.message?.type !== "call_log" && (
              <button
                type="button"
                onClick={() => handleStartEdit(contextMenu.message!)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors text-left text-amber-600 dark:text-amber-400"
              >
                <Pencil className="w-4 h-4 text-amber-500" />
                <span>Edit Pesan</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setForwardingMessage(contextMenu.message);
                setContextMenu({ visible: false, x: 0, y: 0, message: null });
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors text-left"
            >
              <Forward className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Teruskan Pesan</span>
            </button>

            <button
              type="button"
              onClick={() => handleCopyMessage(contextMenu.message!)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors text-left"
            >
              <Copy className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Salin Teks</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (contextMenu.message) {
                  setMessageToDelete(contextMenu.message);
                }
                setContextMenu({ visible: false, x: 0, y: 0, message: null });
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 dark:text-red-400 transition-colors text-left"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Pesan</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Action Sheet (Item 1: Touch / Right Click on Mobile) */}
      {mobileActionMessage && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end sm:hidden animate-in fade-in duration-150"
          onClick={() => setMobileActionMessage(null)}
        >
          <div
            className="w-full rounded-t-3xl bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-200 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pill drag handle */}
            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2" />

            {/* Quick Emoji Reactions */}
            <div className="flex items-center justify-around py-2 px-1 bg-slate-50 dark:bg-slate-800/80 rounded-2xl">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    addReaction(activeConversationId, mobileActionMessage.id, emoji);
                    setMobileActionMessage(null);
                  }}
                  className="text-2xl p-1.5 active:scale-130 transition-transform"
                  style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", sans-serif' }}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(mobileActionMessage);
                  setMobileActionMessage(null);
                  setTimeout(() => inputRef.current?.focus(), 100);
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 transition-colors"
              >
                <Reply className="w-5 h-5 text-blue-600 dark:text-sky-400" />
                <span>Balas Pesan</span>
              </button>

              {mobileActionMessage.senderId === currentUser.id && mobileActionMessage.type !== "call_log" && (
                <button
                  type="button"
                  onClick={() => handleStartEdit(mobileActionMessage)}
                  className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 transition-colors text-amber-600 dark:text-amber-400"
                >
                  <Pencil className="w-5 h-5 text-amber-500" />
                  <span>Edit Pesan</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setForwardingMessage(mobileActionMessage);
                  setMobileActionMessage(null);
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 transition-colors"
              >
                <Forward className="w-5 h-5 text-blue-600 dark:text-sky-400" />
                <span>Teruskan Pesan (Halaman Penuh)</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyMessage(mobileActionMessage)}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 transition-colors"
              >
                <Copy className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                <span>Salin Teks Pesan</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (mobileActionMessage) {
                    setMessageToDelete(mobileActionMessage);
                  }
                  setMobileActionMessage(null);
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 active:bg-red-100 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                <span>Hapus Pesan</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMobileActionMessage(null)}
              className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Dedicated Full-Screen Forward View (Item 2: New Page Instead of Popup) */}
      {forwardingMessage && (
        <ForwardMessageView
          message={forwardingMessage}
          conversations={conversations}
          currentUser={currentUser}
          onClose={() => setForwardingMessage(null)}
          onForward={handleExecuteForward}
        />
      )}

      {/* Group Details Modal */}
      {activeConv.isGroup && (
        <GroupDetailsModal
          isOpen={isGroupDetailsOpen}
          onClose={() => setIsGroupDetailsOpen(false)}
          conversationId={activeConversationId}
        />
      )}

      {/* Clear Chat Confirmation Modal */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Bersihkan Obrolan?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Semua riwayat pesan dalam obrolan dengan <strong>{displayName}</strong> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmClearChat}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xs active:scale-95 transition-all"
              >
                Ya, Bersihkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200 select-none"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="flex items-center justify-between text-white max-w-5xl w-full mx-auto z-10 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300 truncate max-w-xs">
                {lightboxImage.fileName || "Foto Chat"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsLightboxZoomed(!isLightboxZoomed)}
                aria-label={isLightboxZoomed ? "Perkecil foto" : "Perbesar foto"}
                title={isLightboxZoomed ? "Perkecil (Zoom Out)" : "Perbesar (Zoom In)"}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                {isLightboxZoomed ? (
                  <ZoomOut className="w-5 h-5" />
                ) : (
                  <ZoomIn className="w-5 h-5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                aria-label="Tutup preview foto (Escape)"
                title="Tutup (Escape)"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div
            className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage.url}
              alt="Preview Penuh"
              onClick={() => setIsLightboxZoomed(!isLightboxZoomed)}
              className={cn(
                "max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl transition-transform duration-200",
                isLightboxZoomed
                  ? "scale-140 cursor-zoom-out"
                  : "scale-100 cursor-zoom-in"
              )}
            />
          </div>

          <div
            className="flex items-center justify-center gap-3 sm:gap-4 max-w-lg w-full mx-auto z-10 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleDownloadLightboxImage}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-semibold backdrop-blur-md transition-all shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Simpan ke Galeri</span>
            </button>

            <button
              type="button"
              onClick={handleShareToStory}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 active:scale-95 text-white text-xs font-semibold transition-all shadow-md"
            >
              <Share2 className="w-4 h-4" />
              <span>Bagikan ke Cerita</span>
            </button>
          </div>
        </div>
      )}

      {/* Full-Screen Story Viewer saat pengguna mengklik balasan cerita */}
      {viewStoryId && (
        <StoryViewer
          initialStoryId={viewStoryId}
          onClose={() => setViewStoryId(null)}
        />
      )}

      {/* Notifikasi jika cerita yang dibalas sudah kedaluwarsa atau dihapus */}
      {storyExpiredToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-black/90 text-white border border-white/10 text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Cerita ini sudah tidak tersedia atau telah kedaluwarsa.</span>
        </div>
      )}

      {/* Ephemeral Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900/95 text-white border border-slate-700 text-xs font-medium shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}

      {/* Confirmation Modal: Hapus untuk Semua Orang vs Hapus untuk Saya */}
      <DeleteMessageModal
        isOpen={Boolean(messageToDelete)}
        message={messageToDelete}
        currentUserId={currentUser.id}
        onClose={() => setMessageToDelete(null)}
        onDeleteForEveryone={() => {
          if (messageToDelete && activeConversationId) {
            deleteMessageForEveryone(activeConversationId, messageToDelete.id);
            showToast("Pesan dihapus untuk semua orang");
          }
        }}
        onDeleteForMe={() => {
          if (messageToDelete && activeConversationId) {
            deleteMessageForMe(activeConversationId, messageToDelete.id);
            showToast("Pesan dihapus untuk saya");
          }
        }}
      />
    </div>
  );
}
