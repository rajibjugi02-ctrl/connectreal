"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface LoginWelcomeTransitionProps {
  userName?: string;
  onComplete: () => void;
}

export function LoginWelcomeTransition({ onComplete }: LoginWelcomeTransitionProps) {
  // 0: Initializing, 1: Syncing, 2: Ready, 3: Departing/Exit
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);
  const [progressWidth, setProgressWidth] = useState(18);
  const [isOverlayFading, setIsOverlayFading] = useState(false);

  useEffect(() => {
    // Fase super cepat & responsif (Total 450ms - 550ms)
    const t1 = setTimeout(() => {
      setPhase(1);
      setProgressWidth(70);
    }, 120);

    const t2 = setTimeout(() => {
      setPhase(2);
      setProgressWidth(100);
    }, 280);

    const t3 = setTimeout(() => {
      setPhase(3);
    }, 420);

    const t4 = setTimeout(() => {
      setIsOverlayFading(true);
      setTimeout(onComplete, 120);
    }, 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-0 z-100 flex flex-col items-center justify-center overflow-hidden transition-opacity duration-350 ease-out select-none",
        "bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-100",
        isOverlayFading ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
    >
      {/* Ambient Radial Subtle Glow */}
      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.06)_0%,transparent_65%)] dark:bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.07)_0%,transparent_70%)]"
        aria-hidden="true"
      />

      {/* Minimalist Brand Emblem */}
      <div
        className={cn(
          "relative flex flex-col items-center will-change-transform transition-all duration-500 ease-out",
          phase === 3
            ? "-translate-y-16 scale-90 opacity-0 blur-xs"
            : "translate-y-0 scale-100 opacity-100"
        )}
      >
        {/* Ambient Halo */}
        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 via-sky-500 to-indigo-600 text-white font-black text-3xl shadow-2xl shadow-blue-500/30 ring-4 ring-sky-400/20 animate-pulse">
          CR
          {/* Subtle spinning border ring */}
          <div className="absolute -inset-2 rounded-[28px] border border-sky-400/30 animate-[spin_8s_linear_infinite] pointer-events-none" />
        </div>
      </div>

      {/* Minimalist Progress Bar & Clean Typography */}
      <div className="mt-7 flex flex-col items-center space-y-3 z-10">
        {/* Status Label (Clean, tracking-widest, uppercase, no slop) */}
        <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400 h-4 transition-all duration-300">
          {phase === 0 && "Menyiapkan ruang kerja..."}
          {phase === 1 && "Sinkronisasi data..."}
          {phase >= 2 && "Siap"}
        </p>

        {/* Thin 2px Horizontal Progress Bar */}
        <div
          className="w-[180px] h-[2px] rounded-full overflow-hidden bg-slate-200 dark:bg-[#1E293B]"
          aria-hidden="true"
        >
          <div
            style={{ width: `${progressWidth}%` }}
            className="h-full bg-[#38BDF8] rounded-full transition-all duration-500 ease-out will-change-[width]"
          />
        </div>
      </div>

      {/* Keyframe Styles for Smooth Floating & Eye Blink */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        @keyframes blink {
          0%, 46%, 50%, 100% {
            transform: scaleY(1);
          }
          48% {
            transform: scaleY(0.1);
          }
        }
      `}</style>
    </div>
  );
}
