"use client";

import React from "react";
import { Trash2, AlertTriangle, X, UserX, Users } from "lucide-react";
import { MessageItem } from "@/lib/types";

interface DeleteMessageModalProps {
  isOpen: boolean;
  message: MessageItem | null;
  currentUserId: string;
  onClose: () => void;
  onDeleteForEveryone: () => void;
  onDeleteForMe: () => void;
}

export function DeleteMessageModal({
  isOpen,
  message,
  currentUserId,
  onClose,
  onDeleteForEveryone,
  onDeleteForMe,
}: DeleteMessageModalProps) {
  if (!isOpen || !message) return null;

  const isSender = message.senderId === currentUserId;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shadow-xs">
            <Trash2 className="w-5 h-5" />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            Hapus Pesan?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Pilih bagaimana Anda ingin menghapus pesan ini dari obrolan.
          </p>
        </div>

        {/* Message preview snippet */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 italic truncate">
          "{message.content || message.fileName || (message.type === "audio" ? "Pesan Suara" : "Lampiran Media")}"
        </div>

        <div className="space-y-2 pt-1">
          {/* Opsi 1: Hapus untuk Semua Orang (Hanya aktif untuk pesan pengirim) */}
          {isSender && (
            <button
              type="button"
              onClick={() => {
                onDeleteForEveryone();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-all active:scale-95 shadow-sm"
            >
              <Users className="w-4 h-4" />
              <span>Hapus untuk Semua Orang</span>
            </button>
          )}

          {/* Opsi 2: Hapus untuk Saya (Bisa untuk semua pesan) */}
          <button
            type="button"
            onClick={() => {
              onDeleteForMe();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-all active:scale-95"
          >
            <UserX className="w-4 h-4" />
            <span>Hapus untuk Saya</span>
          </button>

          {/* Opsi 3: Batal */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-center text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

