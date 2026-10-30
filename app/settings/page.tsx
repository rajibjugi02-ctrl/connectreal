"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Lock,
  Smartphone,
  Eye,
  Moon,
  Sun,
  Laptop,
  Trash2,
  Bell,
  Volume2,
  MessageCircle,
  Heart,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Mail,
  Phone,
  UserX,
  ChevronRight,
  ShieldCheck,
  Globe,
  Check,
  FolderArchive,
  Undo2,
  AtSign,
  User as UserIcon,
  Users,
} from "lucide-react";
import { useAppStore, getRealCurrentSession } from "@/lib/store/useAppStore";
import { useTranslation, languageList } from "@/lib/i18n/translations";
import { SupportedLanguage } from "@/lib/types";
import { cn, formatTimestamp } from "@/lib/utils";

type SettingsCategory =
  | "account"
  | "archive"
  | "privacy"
  | "appearance"
  | "chat"
  | "language"
  | "notifications"
  | "danger";

export default function SettingsPage() {
  const {
    currentUser,
    updateCurrentUser,
    theme,
    setTheme,
    language,
    setLanguage,
    chatCustomization,
    setChatCustomization,
    twoFactorEnabled,
    toggle2FA,
    readReceiptsEnabled,
    toggleReadReceipts,
    showOnlineStatus,
    toggleShowOnlineStatus,
    isPrivateAccount,
    togglePrivateAccount,
    onlineVisibility,
    setOnlineVisibility,
    notificationPrefs,
    toggleNotificationPref,
    blockedUsers,
    unblockUser,
    phoneNumber,
    updatePhoneNumber,
    activeSessions,
    terminateSession,
    clearAppCache,
    setLogoutModalOpen,
    archivedPosts,
    archivedStories,
    unarchivePost,
    unarchiveStory,
    deletePost,
    deleteStory,
  } = useAppStore();

  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<SettingsCategory>("account");
  const [mobileSubSection, setMobileSubSection] = useState<SettingsCategory | null>(null);
  const [archiveTab, setArchiveTab] = useState<"posts" | "stories">("posts");

  // Keep current active session synchronized with the user's live browser and device
  useEffect(() => {
    if (typeof window !== "undefined") {
      const current = getRealCurrentSession();
      useAppStore.setState((state) => {
        const others = state.activeSessions.filter((s) => !s.isCurrent);
        return {
          activeSessions: [current, ...others],
        };
      });
    }
  }, []);

  // Account Form states
  const [usernameInput, setUsernameInput] = useState(currentUser.username);
  const [nameInput, setNameInput] = useState(currentUser.name);
  const [emailInput, setEmailInput] = useState(currentUser.email);
  const [phoneInput, setPhoneInput] = useState(
    currentUser.phone === "+62 812-8921-9988" ? "" : (currentUser.phone || "")
  );
  const [contactSaved, setContactSaved] = useState(false);

  useEffect(() => {
    setNameInput(currentUser.name);
    setEmailInput(currentUser.email);
    setPhoneInput(
      currentUser.phone === "+62 812-8921-9988" ? "" : (currentUser.phone || "")
    );
  }, [currentUser]);

  // Password Form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [cacheCleared, setCacheCleared] = useState(false);
  const [languageSaved, setLanguageSaved] = useState(false);
  const [deleteAccountModal, setDeleteAccountModal] = useState(false);

  const chatWallpaperInputRef = useRef<HTMLInputElement>(null);

  const handleCustomWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setChatCustomization({ wallpaper: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const categories = [
    {
      id: "account" as const,
      label: t.settingsAccount,
      icon: Shield,
      description: t.settingsAccountDesc,
    },
    {
      id: "archive" as const,
      label: "Arsip",
      icon: FolderArchive,
      description: "Kelola postingan dan cerita yang telah Anda arsipkan",
    },
    {
      id: "privacy" as const,
      label: t.settingsPrivacy,
      icon: Eye,
      description: t.settingsPrivacyDesc,
    },
    {
      id: "appearance" as const,
      label: t.settingsAppearance,
      icon: Moon,
      description: t.settingsAppearanceDesc,
    },
    {
      id: "chat" as const,
      label: "Kustomisasi Obrolan",
      icon: MessageCircle,
      description: "Ubah warna balon pesan dan pasang wallpaper chat",
    },
    {
      id: "language" as const,
      label: t.settingsLanguage,
      icon: Globe,
      description: t.settingsLanguageDesc,
    },
    {
      id: "notifications" as const,
      label: t.settingsNotifications,
      icon: Bell,
      description: t.settingsNotificationsDesc,
    },
    {
      id: "danger" as const,
      label: t.settingsDanger,
      icon: AlertTriangle,
      description: t.settingsDangerDesc,
    },
  ];

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    if (newPassword.length < 8) {
      setPasswordError("Kata sandi baru harus memiliki panjang minimal 8 karakter.");
      return;
    }
    setPasswordSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentUser({
      username: usernameInput.trim().replace(/^@/, ""),
      name: nameInput.trim(),
      email: emailInput.trim(),
    });
    updatePhoneNumber(phoneInput.trim());
    setContactSaved(true);
    setTimeout(() => setContactSaved(false), 2500);
  };

  const handleClearCache = () => {
    clearAppCache();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2500);
  };

  const handleLanguageChange = (langId: SupportedLanguage) => {
    setLanguage(langId);
    setLanguageSaved(true);
    setTimeout(() => setLanguageSaved(false), 2500);
  };

  const activeCategoryMeta = categories.find((c) => c.id === activeSection);

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Top Header Bar */}
      <header
        className={cn(
          "shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between z-10",
          mobileSubSection !== null && "hidden md:flex"
        )}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            aria-label="Kembali ke profil"
            className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
              {t.settingsTitle}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activeCategoryMeta?.description || t.settingsSubtitle}
            </p>
          </div>
        </div>

        <Link
          href="/profile"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors"
        >
          {t.settingsViewProfile}
        </Link>
      </header>

      {/* Main Two-Pane Layout with Independent Scroll */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        {/* Left Sub-Navigation Pane (Static / Fixed on Desktop) */}
        <aside className="hidden md:flex flex-col w-72 lg:w-80 border-r border-[#E2E8F0] dark:border-slate-800 p-4 space-y-1.5 shrink-0 bg-white dark:bg-slate-900 overflow-y-auto no-scrollbar">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 px-3 py-1 mb-1">
            Kategori
          </div>

          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeSection === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveSection(cat.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all group focus-visible:ring-2 focus-visible:ring-blue-500",
                  isSelected
                    ? "bg-blue-50 dark:bg-sky-400/10 text-blue-600 dark:text-sky-400 font-bold border border-blue-200 dark:border-sky-400/25 shadow-xs"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 border border-transparent"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "p-2 rounded-xl shrink-0 transition-colors",
                      isSelected
                        ? "bg-blue-600 dark:bg-sky-500 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100"
                    )}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm truncate font-semibold">
                      {cat.label}
                    </div>
                  </div>
                </div>
                <ChevronRight
                  className={cn(
                    "w-4 h-4 shrink-0 transition-transform",
                    isSelected
                      ? "text-blue-600 dark:text-sky-400 translate-x-0.5"
                      : "text-slate-400 opacity-40"
                  )}
                />
              </button>
            );
          })}
        </aside>

        {/* Mobile Native Settings Directory View (When at Settings Root on Mobile) */}
        <div className={cn("md:hidden flex-1 overflow-y-auto p-4 space-y-4 pb-28", mobileSubSection !== null && "hidden")}>
          {/* User Profile Card */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/30 shrink-0"
              />
              <div className="min-w-0">
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                  {currentUser.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  @{currentUser.username}
                </div>
              </div>
            </div>
            <Link
              href="/profile"
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shrink-0 ml-2"
            >
              Lihat Profil
            </Link>
          </div>

          {/* Settings Section Touch Rows */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 shadow-xs">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(cat.id);
                    setMobileSubSection(cat.id);
                  }}
                  className="w-full flex items-center justify-between p-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-sky-400 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {cat.label}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {cat.description}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                </button>
              );
            })}
          </div>

          {/* Quick Switch Account Card on Mobile */}
          <Link
            href="/settings/switch-account"
            className="flex items-center justify-between p-3.5 rounded-2xl border border-blue-500/25 bg-blue-500/5 hover:bg-blue-500/10 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span>Switch Account</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400">
                    Maks 3
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  Ganti atau tambah akun baru di perangkat ini
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-blue-500 shrink-0 ml-2" />
          </Link>
        </div>

        {/* Mobile Sub-Section Header */}
        {mobileSubSection !== null && (
          <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setMobileSubSection(null)}
              className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-sky-400 p-1.5 -ml-1 rounded-xl hover:bg-blue-50 dark:hover:bg-sky-500/10"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Pengaturan</span>
            </button>
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
              {categories.find((c) => c.id === mobileSubSection)?.label}
            </span>
          </div>
        )}

        {/* Right Detail Pane */}
        <main
          key={activeSection}
          className={cn(
            "flex-1 h-full overflow-y-auto scroll-smooth p-4 sm:p-7 lg:p-8 space-y-6 pb-28 md:pb-8 bg-slate-50/50 dark:bg-slate-900/60 animate-in fade-in-50 duration-200",
            mobileSubSection === null && "hidden md:block"
          )}
        >
          {/* 1. AKUN & KEAMANAN */}
          {activeSection === "account" && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                  {t.settingsAccount}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {t.settingsAccountDesc}
                </p>
              </div>

              {/* Form Ubah Sandi */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-800 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#E2E8F0] dark:border-slate-700">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-sky-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      Ubah Kata Sandi
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Gunakan kombinasi minimal 8 karakter dengan huruf dan angka
                    </p>
                  </div>
                </div>

                {passwordSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Kata sandi berhasil diperbarui dengan aman.
                  </div>
                )}

                {passwordError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {passwordError}
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-3.5 max-w-md">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Kata Sandi Saat Ini
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan kata sandi lama"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Kata Sandi Baru
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white shadow-xs active:scale-95 transition-all"
                    >
                      Perbarui Kata Sandi
                    </button>
                  </div>
                </form>
              </div>

              {/* Informasi Akun & Kontak */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-800 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#E2E8F0] dark:border-slate-700">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-sky-400">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      Informasi Profil & Akun Anda
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Kelola identitas akun login, username, email, dan nomor telepon
                    </p>
                  </div>
                </div>

                {contactSaved && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Data akun berhasil disimpan dan disinkronkan.
                  </div>
                )}

                <form onSubmit={handleContactSubmit} className="space-y-3.5 max-w-md">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Nama Pengguna (Username)
                    </label>
                    <div className="relative">
                      <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        placeholder="username"
                        className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Nama Lengkap"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Alamat Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Nomor Telepon
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="Belum diatur (Klik untuk menambahkan)"
                        className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white shadow-xs active:scale-95 transition-all"
                    >
                      Simpan Perubahan Akun
                    </button>
                  </div>
                </form>
              </div>

              {/* 2FA Toggle */}
              <div className="flex items-center justify-between p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-800 shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-sky-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      Autentikasi Dua Faktor (2FA)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-md">
                      Mencegah login tidak sah dengan kode verifikasi setiap masuk dari browser baru.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggle2FA}
                  aria-pressed={twoFactorEnabled}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-blue-500",
                    twoFactorEnabled ? "bg-blue-600 dark:bg-sky-500" : "bg-slate-300 dark:bg-slate-700"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                      twoFactorEnabled ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* Sesi Aktif */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-800 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2.5 pb-2 border-b border-[#E2E8F0] dark:border-slate-700">
                  <Smartphone className="w-5 h-5 text-blue-600 dark:text-sky-400" />
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    Sesi Perangkat yang Sedang Aktif
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {activeSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                            {session.device}
                          </span>
                          {session.isCurrent && (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              Perangkat Ini
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {session.browser} • {session.location} • {session.lastActive}
                        </p>
                      </div>

                      {!session.isCurrent && (
                        <button
                          type="button"
                          onClick={() => terminateSession(session.id)}
                          className="px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          Putuskan
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ARSIP POSTINGAN & CERITA */}
          {activeSection === "archive" && (
            <div className="space-y-6 max-w-3xl animate-in fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FolderArchive className="w-6 h-6 text-amber-500" />
                  <span>Arsip Postingan & Cerita</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Konten yang telah Anda arsipkan hanya dapat dilihat oleh Anda dan dapat dipulihkan kembali ke feed kapan saja.
                </p>
              </div>

              {/* Sub-tab pills */}
              <div className="flex items-center gap-2 border-b border-[#E2E8F0] dark:border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setArchiveTab("posts")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                    archiveTab === "posts"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  )}
                >
                  Postingan ({archivedPosts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setArchiveTab("stories")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                    archiveTab === "stories"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  )}
                >
                  Cerita ({archivedStories.length})
                </button>
              </div>

              {/* Tab 1: Archived Posts */}
              {archiveTab === "posts" && (
                <div className="space-y-3">
                  {archivedPosts.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 space-y-2">
                      <FolderArchive className="w-10 h-10 text-slate-400 mx-auto" />
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                        Tidak ada postingan yang diarsipkan
                      </div>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Anda dapat mengarsipkan postingan dari menu titik 3 pada setiap postingan milik Anda di beranda.
                      </p>
                    </div>
                  ) : (
                    archivedPosts.map((post) => (
                      <div
                        key={post.id}
                        className="p-4 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-medium line-clamp-2">
                            {post.content}
                          </p>
                          <span className="text-[11px] text-slate-400 block mt-1">
                            Diunggah pada {formatTimestamp(post.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => unarchivePost(post.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-sky-400/10 text-blue-600 dark:text-sky-400 text-xs font-bold hover:bg-blue-100 transition-colors"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                            <span>Pulihkan ke Beranda</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Hapus postingan ini secara permanen?")) {
                                deletePost(post.id);
                              }
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                            title="Hapus permanen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 2: Archived Stories */}
              {archiveTab === "stories" && (
                <div className="space-y-3">
                  {archivedStories.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 space-y-2">
                      <FolderArchive className="w-10 h-10 text-slate-400 mx-auto" />
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                        Tidak ada cerita yang diarsipkan
                      </div>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Cerita milik Anda yang disimpan dapat diarsipkan langsung dari penampil cerita (Story Viewer).
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {archivedStories.map((story) => (
                        <div
                          key={story.id}
                          className="relative rounded-2xl overflow-hidden border border-[#E2E8F0] dark:border-slate-800 bg-slate-900 aspect-[9/16] group"
                        >
                          <img
                            src={story.mediaUrl}
                            alt="Archived story"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-between p-3">
                            <span className="text-[10px] bg-black/60 px-2 py-0.5 rounded-full text-white w-max">
                              {formatTimestamp(story.createdAt)}
                            </span>
                            <div className="flex items-center gap-1.5 pt-2">
                              <button
                                type="button"
                                onClick={() => unarchiveStory(story.id)}
                                className="flex-1 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-bold text-center hover:bg-blue-700 transition-colors"
                              >
                                Pulihkan
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm("Hapus cerita ini secara permanen?")) {
                                    deleteStory(story.id);
                                  }
                                }}
                                className="p-1 rounded-lg bg-red-600/80 text-white hover:bg-red-600 transition-colors"
                                title="Hapus permanen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. PRIVASI & VISIBILITAS */}
          {activeSection === "privacy" && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                  {t.settingsPrivacy}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {t.settingsPrivacyDesc}
                </p>
              </div>

              {/* Laporan Baca */}
              <div className="flex items-center justify-between p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-800 shadow-xs">
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    Laporan Baca (Centang Biru)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-md">
                    Jika nonaktif, pengirim pesan tidak akan mengetahui secara tepat kapan Anda membaca obrolan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleReadReceipts}
                  aria-pressed={readReceiptsEnabled}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-blue-500",
                    readReceiptsEnabled ? "bg-blue-600 dark:bg-sky-500" : "bg-slate-300 dark:bg-slate-700"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                      readReceiptsEnabled ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* Visibilitas Status Online */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      Status Kehadiran Online
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-md">
                      Menampilkan titik hijau aktif saat Anda sedang membuka aplikasi.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleShowOnlineStatus}
                    aria-pressed={showOnlineStatus}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-blue-500",
                      showOnlineStatus ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                        showOnlineStatus ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                {showOnlineStatus && (
                  <div className="pt-3 border-t border-[#E2E8F0] dark:border-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { id: "everyone", label: "Semua Orang" },
                        { id: "contacts", label: "Hanya Pengikut" },
                        { id: "nobody", label: "Tidak Ada" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setOnlineVisibility(opt.id as typeof onlineVisibility)}
                          className={cn(
                            "p-2.5 rounded-xl border text-center text-xs font-bold transition-all active:scale-95",
                            onlineVisibility === opt.id
                              ? "border-blue-600 bg-blue-50 dark:bg-sky-400/10 text-blue-600 dark:text-sky-400"
                              : "border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Akun Privat */}
              <div className="flex items-center justify-between p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-800 shadow-xs">
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    Akun Privat
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-md">
                    Hanya pengguna yang Anda setujui yang dapat melihat kiriman dan profil lengkap Anda.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={togglePrivateAccount}
                  aria-pressed={isPrivateAccount}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-blue-500",
                    isPrivateAccount ? "bg-blue-600 dark:bg-sky-500" : "bg-slate-300 dark:bg-slate-700"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                      isPrivateAccount ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* Daftar Akun Diblokir */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-800 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0] dark:border-slate-700">
                  <UserX className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    Daftar Akun yang Diblokir ({blockedUsers.length})
                  </h3>
                </div>

                {blockedUsers.length > 0 ? (
                  <div className="divide-y divide-[#E2E8F0] dark:divide-slate-700">
                    {blockedUsers.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                          <div>
                            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                              {u.name}
                            </span>
                            <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                              @{u.username}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => unblockUser(u.id)}
                          className="px-3 py-1 text-xs font-semibold rounded-lg border border-[#E2E8F0] dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                        >
                          Buka Blokir
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tidak ada akun yang diblokir saat ini.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 3. TAMPILAN & PENYIMPANAN */}
          {activeSection === "appearance" && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                  {t.settingsAppearance}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {t.settingsAppearanceDesc}
                </p>
              </div>

              {/* Pemilih Tema Visual */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-800 shadow-xs space-y-4">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  Tema Visual Aplikasi
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Mode Terang */}
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all active:scale-95 text-center focus-visible:ring-2 focus-visible:ring-blue-500",
                      theme === "light"
                        ? "border-blue-600 bg-white shadow-md ring-2 ring-blue-500/20"
                        : "border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 block">
                        Mode Terang
                      </span>
                      <span className="text-[11px] text-slate-500">Kanvas Putih Bersih</span>
                    </div>
                  </button>

                  {/* Mode Gelap "Midnight Slate" */}
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all active:scale-95 text-center focus-visible:ring-2 focus-visible:ring-blue-500",
                      theme === "dark"
                        ? "border-sky-400 bg-slate-800 shadow-md ring-2 ring-sky-400/20 text-white"
                        : "border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-sky-400/15 text-sky-400 flex items-center justify-center">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 block">
                        Mode Gelap (Midnight Slate)
                      </span>
                      <span className="text-[11px] text-slate-400">#0F172A Nyaman di Mata</span>
                    </div>
                  </button>

                  {/* Ikuti Sistem */}
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                        setTheme(prefersDark ? "dark" : "light");
                      }
                    }}
                    className="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-900 transition-all active:scale-95 text-center focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-400/15 text-slate-400 flex items-center justify-center">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 block">
                        Ikuti Sistem
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Sinkronisasi OS</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Bersihkan Cache */}
              <div className="flex items-center justify-between p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-800 shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-400/10 text-slate-500 dark:text-slate-400 shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      {t.settingsClearCache}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-md">
                      Menghapus pratinjau session tanpa memengaruhi kredensial akun.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-[#E2E8F0] dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
                >
                  {cacheCleared ? t.settingsClearCacheSuccess : t.settingsClearCache}
                </button>
              </div>
            </div>
          )}

          {/* KUSTOMISASI OBROLAN (CHAT CUSTOMIZATION) */}
          {activeSection === "chat" && (
            <div className="space-y-6 max-w-3xl animate-in fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <MessageCircle className="w-6 h-6 text-blue-600 dark:text-sky-400" />
                  <span>Kustomisasi Obrolan</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Sesuaikan warna balon pesan dan pasang wallpaper obrolan favorit Anda di ConnectReal.
                </p>
              </div>

              {/* 1. Pemilih Warna Balon Pesan (Bubble Chat) */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-800 shadow-xs space-y-4">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    Warna Balon Pesan Saya (Bubble Chat)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Pilih warna balon pesan yang akan tampil saat Anda mengirim chat ke kontak.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: "blue", label: "Biru Klasik", bg: "bg-blue-600" },
                    { id: "slate", label: "Hitam Obsidian", bg: "bg-slate-900 dark:bg-black" },
                    { id: "emerald", label: "Hijau Emerald", bg: "bg-emerald-600" },
                    { id: "purple", label: "Ungu Violet", bg: "bg-purple-600" },
                    { id: "rose", label: "Merah Mawar", bg: "bg-rose-600" },
                    { id: "amber", label: "Oranye Sunset", bg: "bg-amber-600" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setChatCustomization({ bubbleColor: item.id })}
                      className={cn(
                        "flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all active:scale-95 text-left",
                        (chatCustomization?.bubbleColor || "blue") === item.id
                          ? "border-blue-600 bg-blue-50/50 dark:bg-sky-400/10 shadow-xs"
                          : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-slate-300"
                      )}
                    >
                      <span className={cn("w-5 h-5 rounded-full shrink-0 shadow-xs", item.bg)} />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Live Preview Box */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-100/60 dark:bg-slate-900/60 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Pratinjau Percakapan
                  </span>
                  <div className="flex flex-col space-y-2 pt-1">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 max-w-[70%]">
                      Halo! Bagaimana kabarmu hari ini?
                    </div>
                    <div
                      className={cn(
                        "p-2.5 rounded-xl text-xs text-white max-w-[70%] ml-auto text-right font-medium",
                        chatCustomization?.bubbleColor === "slate" && "bg-slate-900 dark:bg-black border border-slate-700",
                        chatCustomization?.bubbleColor === "emerald" && "bg-emerald-600",
                        chatCustomization?.bubbleColor === "purple" && "bg-purple-600",
                        chatCustomization?.bubbleColor === "rose" && "bg-rose-600",
                        chatCustomization?.bubbleColor === "amber" && "bg-amber-600",
                        (!chatCustomization?.bubbleColor || chatCustomization?.bubbleColor === "blue") && "bg-blue-600"
                      )}
                    >
                      Kabar baik! Saya sedang mencoba fitur baru di ConnectReal.
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Pemilih Wallpaper Obrolan */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-800 shadow-xs space-y-4">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    Wallpaper Obrolan (Chat Background)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Gunakan wallpaper bawaan atau unggah foto/gambar dari perangkat Anda.
                  </p>
                </div>

                {/* Preset List */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {[
                    { id: "default", label: "Standar" },
                    { id: "dark-mesh", label: "Dark Mesh" },
                    { id: "starry", label: "Starry Night" },
                    { id: "grid", label: "Minimal Grid" },
                    { id: "sunset", label: "Warm Sunset" },
                  ].map((wp) => (
                    <button
                      key={wp.id}
                      type="button"
                      onClick={() => setChatCustomization({ wallpaper: wp.id })}
                      className={cn(
                        "p-3 rounded-xl border-2 text-center transition-all active:scale-95 text-xs font-semibold",
                        (chatCustomization?.wallpaper || "default") === wp.id
                          ? "border-blue-600 bg-blue-50 dark:bg-sky-400/10 text-blue-600 dark:text-sky-400 shadow-xs"
                          : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                      )}
                    >
                      {wp.label}
                    </button>
                  ))}
                </div>

                {/* Custom Wallpaper Upload Area */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-700/60">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Unggah Wallpaper Sendiri
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Pilih berkas foto/gambar wallpaper dari HP atau komputer Anda.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => chatWallpaperInputRef.current?.click()}
                      className="px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all active:scale-95 shadow-xs"
                    >
                      Pilih Berkas Foto
                    </button>
                    {(chatCustomization?.wallpaper && chatCustomization?.wallpaper !== "default") && (
                      <button
                        type="button"
                        onClick={() => setChatCustomization({ wallpaper: "default" })}
                        className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        Reset Standar
                      </button>
                    )}
                  </div>
                  <input
                    ref={chatWallpaperInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCustomWallpaperUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. BAHASA & WILAYAH (LANGUAGE & REGION) */}
          {activeSection === "language" && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                  {t.settingsLanguage}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {t.settingsLanguageDesc}
                </p>
              </div>

              {languageSaved && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {t.settingsLanguageSelected}
                </div>
              )}

              {/* Language Selection Grid */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-sky-400">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                        Bahasa Antarmuka Global (i18n)
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Pilihan langsung tersimpan dan diaplikasikan ke seluruh antarmuka aplikasi
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {languageList.map((lang) => {
                    const isSelected = language === lang.id;
                    return (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => handleLanguageChange(lang.id)}
                        className={cn(
                          "flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all active:scale-98 text-left group focus-visible:ring-2 focus-visible:ring-blue-500",
                          isSelected
                            ? "border-blue-600 dark:border-sky-400 bg-blue-50/70 dark:bg-sky-400/10 shadow-xs"
                            : "border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-600"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl" role="img" aria-label={lang.name}>
                            {lang.flag}
                          </span>
                          <div>
                            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 block">
                              {lang.nativeName}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {lang.name}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-blue-600 dark:bg-sky-500 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 5. NOTIFIKASI */}
          {activeSection === "notifications" && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                  {t.settingsNotifications}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {t.settingsNotificationsDesc}
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-800 shadow-xs space-y-5">
                {/* Pesan Langsung */}
                <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] dark:border-slate-700">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-sky-400 shrink-0">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        Pemberitahuan Pesan Baru
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Peringatan real-time saat ada pesan atau obrolan masuk.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotificationPref("messages")}
                    aria-pressed={notificationPrefs.messages}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                      notificationPrefs.messages ? "bg-blue-600 dark:bg-sky-500" : "bg-slate-300 dark:bg-slate-700"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                        notificationPrefs.messages ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                {/* Interaksi Sosial */}
                <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] dark:border-slate-700">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-red-500/10 text-red-500 shrink-0">
                      <Heart className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        Interaksi Sosial (Suka, Komentar, Pengikut)
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Tampilkan badge saat kiriman Anda mendapatkan respons.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotificationPref("interactions")}
                    aria-pressed={notificationPrefs.interactions}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                      notificationPrefs.interactions ? "bg-blue-600 dark:bg-sky-500" : "bg-slate-300 dark:bg-slate-700"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                        notificationPrefs.interactions ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                {/* Suara Notifikasi */}
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        Efek Suara Notifikasi
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Bunyikan nada lembut saat notifikasi baru masuk.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotificationPref("sounds")}
                    aria-pressed={notificationPrefs.sounds}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                      notificationPrefs.sounds ? "bg-blue-600 dark:bg-sky-500" : "bg-slate-300 dark:bg-slate-700"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                        notificationPrefs.sounds ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 6. ZONA KRITIS (DANGER ZONE) */}
          {activeSection === "danger" && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-red-500">
                  {t.settingsDanger}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {t.settingsDangerDesc}
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl border border-red-500/25 bg-red-500/5 space-y-5">
                {/* Keluar dari Akun */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-red-500/20">
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      {t.navLogout}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-md">
                      Keluar dari sesi saat ini pada perangkat ini.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLogoutModalOpen(true)}
                    className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-red-500 hover:bg-red-600 text-white active:scale-95 transition-all shadow-xs"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t.navLogout}</span>
                  </button>
                </div>

                {/* Hapus Akun Permanen */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-red-500">
                      Hapus Akun Permanen
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-md">
                      Menghapus seluruh postingan, media, dan riwayat obrolan secara permanen.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteAccountModal(true)}
                    className="shrink-0 px-4 py-2 text-xs font-bold rounded-xl border border-red-500 text-red-500 hover:bg-red-500/10 active:scale-95 transition-all"
                  >
                    Hapus Akun
                  </button>
                </div>
              </div>

              {/* Fitur Switch Account (Batas Maksimal 3 Akun) */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-blue-500/30 bg-blue-500/5">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        Switch Account (Ganti Akun)
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400">
                          Maks 3 Akun
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-md">
                        Beralih cepat antar akun yang tersimpan atau tambahkan akun baru tanpa harus logout manual.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/settings/switch-account"
                    className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-blue-500 hover:bg-blue-600 text-white active:scale-95 transition-all shadow-xs"
                  >
                    <Users className="w-4 h-4" />
                    <span>Buka Switch Account</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Dialog Konfirmasi Hapus Akun */}
      {deleteAccountModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
          onClick={() => setDeleteAccountModal(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-red-500/30 rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold">Apakah Anda benar-benar yakin?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Tindakan ini tidak dapat dibatalkan. Seluruh data linimasa, like, pesan, dan pengikut akan dihapus secara permanen dari server ConnectReal.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteAccountModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#E2E8F0] dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteAccountModal(false);
                  setLogoutModalOpen(true);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all"
              >
                Konfirmasi Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
