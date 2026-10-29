"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="id">
      <body className="min-h-screen bg-[#0B0F17] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center shadow-xs">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-white">
              Sistem Sedang Memuat Ulang
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Koneksi sedang disinkronkan kembali. Klik tombol di bawah untuk menyegarkan aplikasi.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.reload();
              } else {
                reset();
              }
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all active:scale-95 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Segarkan Aplikasi</span>
          </button>
        </div>
      </body>
    </html>
  );
}

