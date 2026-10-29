"use client";

import React from "react";
import { X, ExternalLink, Globe } from "lucide-react";

interface LinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  links: string[];
  title?: string;
}

export function LinksModal({
  isOpen,
  onClose,
  links,
  title = "Daftar Tautan Profil",
}: LinksModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600 dark:text-sky-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            aria-label="Tutup daftar tautan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {links.map((link, idx) => {
            const formatted = link.startsWith("http") ? link : `https://${link}`;
            return (
              <a
                key={idx}
                href={formatted}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/80 dark:border-slate-700/60 transition-colors group"
              >
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-sky-400 truncate max-w-[240px]">
                  {link.replace(/^https?:\/\//, "")}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-sky-400 shrink-0" />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

