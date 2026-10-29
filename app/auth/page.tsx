"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, X, HelpCircle, Sparkles } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { LoginWelcomeTransition } from "@/components/auth/LoginWelcomeTransition";

export default function AuthPage() {
  const router = useRouter();
  const { registerUser, loginUser, loginOAuthUser } = useAppStore();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState<string | null>(null);
  const [showOAuthGuide, setShowOAuthGuide] = useState(false);

  // Simple password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "bg-slate-300 dark:bg-slate-700" };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: "Lemah", color: "bg-red-500" };
    if (score === 2 || score === 3) return { score: 2, label: "Cukup Baik", color: "bg-amber-500" };
    return { score: 3, label: "Kuat & Aman", color: "bg-emerald-500" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email.includes("@")) {
      setErrorMsg("Format alamat email tidak valid.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Kata sandi minimal 8 karakter.");
      return;
    }

    setIsLoading(true);

    if (mode === "register") {
      if (!name.trim()) {
        setErrorMsg("Nama lengkap wajib diisi.");
        setIsLoading(false);
        return;
      }

      setTimeout(() => {
        const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "") || email.split("@")[0].toLowerCase();
        const res = registerUser({
          name: name.trim(),
          username: cleanUsername,
          email: email.trim(),
          password,
        });

        setIsLoading(false);
        if (!res.success) {
          setErrorMsg(res.message);
          return;
        }

        // Pendaftaran selesai: Beralih ke form Login dan minta user memasukkan password akun barunya
        setMode("login");
        setPassword("");
        setSuccessMsg(
          `Akun @${cleanUsername} berhasil dibuat! Silakan masukkan kata sandi Anda untuk masuk.`
        );
      }, 500);
    } else {
      setTimeout(() => {
        const res = loginUser(email, password);
        setIsLoading(false);
        if (!res.success) {
          setErrorMsg(res.message);
          return;
        }
        const loggedUser = useAppStore.getState().currentUser;
        setWelcomeUser(loggedUser.name || "Sobat ConnectReal");
      }, 400);
    }
  };

  // Auto-redirect jika user membuka dengan host 0.0.0.0 (yang diblokir Chromium & Google OAuth)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hostname === "0.0.0.0") {
      window.location.href = window.location.href.replace("//0.0.0.0:", "//localhost:");
    }
  }, []);

  // Redirect to official Google OAuth consent screen using Client ID
  const handleStartRealGoogleOAuth = () => {
    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      "750229016216-pfr7ru5sm8vmng6a0582ql6ktqus7dob.apps.googleusercontent.com";
    
    // Normalisasi origin agar selalu menggunakan localhost di lokal, bukan 0.0.0.0 atau IP LAN
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

  // Tangani Callback Google OAuth dari URL secara langsung & instan
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);

    const err = params.get("error");
    if (err) {
      const decodedErr = decodeURIComponent(err);
      window.history.replaceState({}, document.title, window.location.pathname);
      queueMicrotask(() => {
        setErrorMsg(decodedErr);
      });
      return;
    }

    if (params.get("google_success") === "true") {
      const gName = params.get("name") || "Pengguna Google";
      const gEmail = params.get("email");
      const gAvatar =
        params.get("avatar") ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80";

      if (gEmail) {
        window.history.replaceState({}, document.title, window.location.pathname);

        // Masuk langsung ke akun Google secara instan
        const res = loginOAuthUser({
          name: gName,
          email: gEmail,
          avatarUrl: gAvatar,
          provider: "Google",
        });

        queueMicrotask(() => {
          if (res.success) {
            setWelcomeUser(res.user.name || gName);
          } else {
            router.push("/");
          }
        });
      }
    }
  }, [loginOAuthUser, router]);


  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white dark:bg-[#0B0F17] transition-colors duration-200">
      {/* Animated Robot Welcome Transition After Login */}
      {welcomeUser && (
        <LoginWelcomeTransition
          userName={welcomeUser}
          onComplete={() => router.push("/")}
        />
      )}
      {/* Kolom Kiri: Branding & Visual Showcase (Desktop-First) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 bg-slate-50 dark:bg-[#111827] border-r border-slate-200 dark:border-slate-800/80 relative overflow-hidden">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-600/30">
              CR
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Connect<span className="text-blue-600 dark:text-blue-400">Real</span>
            </span>
          </div>
        </div>

        <div className="space-y-6 max-w-lg z-10">
          <h1 className="text-4xl xl:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
            Komunikasi Nyata, Linimasa Terbuka.
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Platform jejaring sosial dan percakapan instan real-time. Nikmati linimasa interaktif, Cerita berkualitas HD, panggilan video kamera asli, dan asisten pintar ConnectBot AI.
          </p>

          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-800 dark:text-slate-200">
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>Upload Cerita (Story) HD jernih tanpa kompresi pecah</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-800 dark:text-slate-200">
              <div className="w-6 h-6 rounded-full bg-blue-600/10 text-blue-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span>Panggilan Video HD & Suara dengan kamera depan/belakang aktif</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400 dark:text-slate-500">
          © 2026 ConnectReal Web Platform.
        </div>
      </div>

      {/* Kolom Kanan: Interactive Form (Login / Register) */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in-98 duration-200">
          {/* Mobile Brand Header */}
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
              CR
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Connect<span className="text-blue-600 dark:text-blue-400">Real</span>
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {mode === "login" ? "Selamat Datang Kembali" : "Buat Akun Baru"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              {mode === "login"
                ? "Masukkan kredensial Anda untuk masuk ke linimasa."
                : "Daftarkan akun Anda, lalu masuk dengan kata sandi yang telah dibuat."}
            </p>
          </div>

          {/* Segmented Toggle Switch */}
          <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
                mode === "login"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
                mode === "register"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              Daftar Baru
            </button>
          </div>

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Inputs */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Muhammad Rajib"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111827] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      @
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                      placeholder="rajibzahir"
                      className="w-full pl-8 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111827] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-blue-600"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Alamat Email atau Username
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@domain.com atau username"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111827] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111827] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-blue-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1.5 h-1.5">
                    <div
                      className={`flex-1 rounded-full transition-colors ${
                        strength.score >= 1 ? strength.color : "bg-slate-200 dark:bg-slate-800"
                      }`}
                    />
                    <div
                      className={`flex-1 rounded-full transition-colors ${
                        strength.score >= 2 ? strength.color : "bg-slate-200 dark:bg-slate-800"
                      }`}
                    />
                    <div
                      className={`flex-1 rounded-full transition-colors ${
                        strength.score >= 3 ? strength.color : "bg-slate-200 dark:bg-slate-800"
                      }`}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Kekuatan kata sandi:</span>
                    <span className="font-semibold">{strength.label}</span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-70"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : mode === "login" ? (
                "Masuk Sekarang"
              ) : (
                "Daftar Akun Baru"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            <span className="absolute bg-white dark:bg-[#0B0F17] px-3 text-xs text-slate-400">
              atau lanjutkan dengan
            </span>
          </div>

          {/* Google OAuth Button */}
          <div>
            <button
              type="button"
              onClick={handleStartRealGoogleOAuth}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-sm font-bold text-slate-800 dark:text-slate-100 transition-all shadow-xs active:scale-98 focus-visible:ring-2 focus-visible:ring-blue-600 bg-white dark:bg-slate-900"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
              <span>Lanjutkan dengan Akun Google</span>
            </button>
          </div>

          {/* Guide trigger for production hosting */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setShowOAuthGuide(true)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Panduan integrasi Google OAuth & Supabase</span>
            </button>
          </div>
        </div>
      </div>



      {/* Production OAuth Setup Guide Modal */}
      {showOAuthGuide && (
        <div
          onClick={() => setShowOAuthGuide(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  🔐
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Panduan Integrasi Google Sign-In & Supabase
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Kredensial resmi Google Cloud & Realtime Supabase
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOAuthGuide(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {/* Google Guide */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>1. Kredensial Google Cloud Terpasang</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Kredensial Google Client ID dan Secret resmi Anda sudah terhubung langsung ke endpoint <code>/api/auth/callback/google</code> untuk autentikasi cepat tanpa ribet.
                </p>
              </div>

              {/* Supabase Guide */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>2. Database Realtime Supabase Aktif</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Supabase menangani seluruh sinkronisasi pesan obrolan, cerita 24 jam, status online, dan unggahan media secara instan berkecepatan tinggi tanpa lag.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowOAuthGuide(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
