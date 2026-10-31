"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  UserPlus,
  Check,
  Trash2,
  Lock,
  Mail,
  User as UserIcon,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Plus,
  X,
} from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { SavedAccountItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function SwitchAccountPage() {
  const router = useRouter();
  const {
    currentUser,
    savedAccounts,
    switchAccount,
    removeSavedAccount,
    loginUser,
    registerUser,
    isAuthenticated,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Pastikan akun aktif saat ini ada di list savedAccounts
  const displayAccounts: SavedAccountItem[] = React.useMemo(() => {
    const list = [...(savedAccounts || [])];
    if (currentUser?.id && !list.some((a) => a.id === currentUser.id)) {
      list.unshift({
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        email: currentUser.email,
        avatarUrl: currentUser.avatarUrl,
        isOAuth: false,
      });
    }
    return list.slice(0, 3);
  }, [savedAccounts, currentUser]);

  const handleSwitch = (accId: string) => {
    if (accId === currentUser.id) return;
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    setTimeout(() => {
      const success = switchAccount(accId);
      setIsLoading(false);
      if (success) {
        setSuccessMsg("Berhasil beralih akun!");
        setTimeout(() => {
          router.push("/");
        }, 500);
      } else {
        setErrorMsg("Gagal beralih akun. Silakan coba login manual.");
      }
    }, 300);
  };

  const handleRemove = (accId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Hapus akun ini dari daftar pergantian cepat?")) {
      removeSavedAccount(accId);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (displayAccounts.length >= 3 && !displayAccounts.some((a) => a.username.toLowerCase() === identifier.toLowerCase().trim())) {
      setErrorMsg("Batas maksimal 3 akun tersimpan telah tercapai. Hapus salah satu akun terlebih dahulu.");
      return;
    }

    if (!identifier.trim() || !password) {
      setErrorMsg("Harap isi username/email dan kata sandi.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = loginUser(identifier.trim(), password);
      setIsLoading(false);
      if (res.success) {
        setSuccessMsg("Berhasil masuk dan menyimpan akun!");
        setIdentifier("");
        setPassword("");
        setTimeout(() => {
          router.push("/");
        }, 500);
      } else {
        setErrorMsg(res.message);
      }
    }, 400);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (displayAccounts.length >= 3) {
      setErrorMsg("Batas maksimal 3 akun tersimpan telah tercapai. Hapus salah satu akun terlebih dahulu.");
      return;
    }

    if (!regName.trim() || !regUsername.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg("Harap lengkapi semua kolom pendaftaran.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = registerUser({
        name: regName.trim(),
        username: regUsername.trim(),
        email: regEmail.trim(),
        password: regPassword,
      });

      if (!res.success) {
        setIsLoading(false);
        setErrorMsg(res.message);
        return;
      }

      // Otomatis login akun baru
      loginUser(regUsername.trim(), regPassword);
      setIsLoading(false);
      setSuccessMsg("Pendaftaran berhasil! Akun telah ditambahkan.");
      setTimeout(() => {
        router.push("/");
      }, 500);
    }, 400);
  };

  const handleGoogleOAuth = () => {
    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      "750229016216-pfr7ru5sm8vmng6a0582ql6ktqus7dob.apps.googleusercontent.com";

    let origin = window.location.origin;
    if (origin.includes("0.0.0.0") || origin.includes("127.0.0.1")) {
      origin = origin.replace("0.0.0.0", "localhost").replace("127.0.0.1", "localhost");
    }
    const redirectUri = `${origin}/api/auth/callback/google`;
    const scope = encodeURIComponent("openid email profile");
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${scope}&access_type=offline&prompt=select_account`;
    window.location.href = authUrl;
  };

  return (
    <div className="w-full min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-5 sm:p-6 space-y-5">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            Switch account
          </h1>
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert Messages */}
        {errorMsg && (
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Daftar Akun (Format TikTok & Instagram Switch Sheet) */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {displayAccounts.map((account) => {
            const isCurrent =
              currentUser?.id === account.id ||
              currentUser?.username?.toLowerCase() === account.username?.toLowerCase();

            return (
              <div
                key={account.id}
                onClick={() => !isCurrent && handleSwitch(account.id)}
                className={cn(
                  "flex items-center justify-between py-3.5 px-2 rounded-2xl transition-all select-none group",
                  isCurrent
                    ? "cursor-default"
                    : "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-[0.99]"
                )}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={
                      account.avatarUrl ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80"
                    }
                    alt={account.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate block">
                      {account.username ? `@${account.username}` : account.name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">
                      {account.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={(e) => handleRemove(account.id, e)}
                      title="Hapus akun dari daftar perangkat ini"
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-70 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {isCurrent ? (
                    <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center group-hover:border-blue-500 transition-colors">
                      <span className="w-2 h-2 rounded-full bg-transparent group-hover:bg-blue-500 transition-colors" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* + Add account row */}
          {displayAccounts.length < 3 ? (
            <div
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center justify-between py-3.5 px-2 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  Add account
                </span>
              </div>
              <span className="text-xs font-semibold text-blue-600 dark:text-sky-400">
                {showAddForm ? "Tutup" : "Tambah"}
              </span>
            </div>
          ) : (
            <div className="py-3 px-2 text-xs text-slate-400 text-center font-medium">
              Batas maksimal 3 akun telah tercapai di perangkat ini.
            </div>
          )}
        </div>

        {/* Section Tambah Akun Baru (Drawer expandable) */}
        {showAddForm && displayAccounts.length < 3 ? (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-98 duration-200 space-y-4">
            <div className="flex items-center gap-2 pb-1">
              <UserPlus className="w-4 h-4 text-blue-500" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Masuk atau Daftar Akun ({displayAccounts.length}/3)
              </h3>
            </div>

            {/* Tab Pilihan: Masuk Akun atau Daftar Baru */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("login")}
                className={cn(
                  "py-2 rounded-lg transition-all",
                  activeTab === "login"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                Masuk Akun yang Ada
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("register")}
                className={cn(
                  "py-2 rounded-lg transition-all",
                  activeTab === "register"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                Daftar Akun Baru
              </button>
            </div>

            {/* Form Masuk */}
            {activeTab === "login" ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email atau Username
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="contoh: user@mail.com atau username"
                      className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-all active:scale-98 shadow-xs disabled:opacity-50"
                >
                  {isLoading ? "Memproses..." : "Masuk & Tambahkan ke Daftar Akun"}
                </button>
              </form>
            ) : (
              /* Form Daftar */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Nama Anda"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="username_unik"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="email@domain.com"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Kata Sandi
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-all active:scale-98 shadow-xs disabled:opacity-50"
                >
                  {isLoading ? "Mendaftarkan..." : "Daftar & Hubungkan Akun"}
                </button>
              </form>
            )}

            {/* Pemisah Google Login */}
            <div className="relative flex items-center justify-center my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
              </div>
              <span className="relative bg-white dark:bg-slate-900 px-3 text-[11px] font-semibold text-slate-400 uppercase">
                Atau
              </span>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleOAuth}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all active:scale-98 shadow-xs"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sambungkan dengan Akun Google</span>
            </button>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs sm:text-sm">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Batas Maksimal 3 Akun Telah Tercapai</div>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                Aplikasi ini mendukung hingga 3 akun tersimpan secara simultan. Untuk menambahkan akun baru, silakan hapus salah satu akun yang tidak sedang digunakan melalui tombol ikon tempat sampah di atas.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

