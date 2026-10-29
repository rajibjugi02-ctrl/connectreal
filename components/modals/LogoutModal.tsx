"use client";

import React, { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useRouter } from "next/navigation";

export function LogoutModal() {
  const { isLogoutModalOpen, setLogoutModalOpen, logout } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isLogoutModalOpen) {
        setLogoutModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLogoutModalOpen, setLogoutModalOpen]);

  if (!isLogoutModalOpen) return null;

  const handleConfirmLogout = () => {
    logout();
    router.push("/auth");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-title"
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
      onClick={() => setLogoutModalOpen(false)}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-[#E2E8F0] dark:border-slate-700 rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 dark:text-red-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            onClick={() => setLogoutModalOpen(false)}
            aria-label="Tutup dialog konfirmasi"
            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 id="logout-title" className="text-lg font-bold mb-2">
          Konfirmasi Keluar dari ConnectReal
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          Apakah Anda yakin ingin keluar dari akun Anda? Anda harus memasukkan kembali kredensial akun untuk mengakses linimasa dan pesan real-time.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setLogoutModalOpen(false)}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-[#E2E8F0] dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirmLogout}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-xs active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Ya, Keluar Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
