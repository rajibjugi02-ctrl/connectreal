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
    // Fase 1: Menyiapkan ruang kerja (0 - 600ms)
    const t1 = setTimeout(() => {
      setPhase(1);
      setProgressWidth(68);
    }, 600);

    // Fase 2: Sinkronisasi data selesai & Siap (600 - 1300ms)
    const t2 = setTimeout(() => {
      setPhase(2);
      setProgressWidth(100);
    }, 1300);

    // Fase 3: Exit / Pamit melesat (1600ms)
    const t3 = setTimeout(() => {
      setPhase(3);
    }, 1600);

    // Fase 4: Overlay fade-out & trigger onComplete (1850ms)
    const t4 = setTimeout(() => {
      setIsOverlayFading(true);
      setTimeout(onComplete, 350);
    }, 1850);

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

      {/* Cyber Core Geometric Droid Character */}
      <div
        className={cn(
          "relative flex flex-col items-center will-change-transform transition-all duration-500 ease-out",
          phase === 3
            ? "-translate-y-16 scale-90 opacity-0 blur-xs"
            : "translate-y-0 scale-100 opacity-100"
        )}
      >
        {/* Floating Wrap */}
        <div className="relative animate-[float_3.5s_ease-in-out_infinite]">
          {/* Pure Inline Vector SVG */}
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-24 h-24 sm:w-28 sm:h-28"
          >
            {/* Rotating Orbit Gyro Ring */}
            <g className="origin-center animate-[spin_10s_linear_infinite]">
              <ellipse
                cx="60"
                cy="60"
                rx="52"
                ry="22"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="1.5"
                strokeDasharray="4 6"
                strokeOpacity="0.35"
                transform="rotate(-25 60 60)"
              />
              <circle
                cx="14"
                cy="42"
                r="2.5"
                fill="#38BDF8"
                className="animate-pulse"
              />
            </g>

            {/* Droid Chassis Drop Shadow In Dark Surface */}
            <defs>
              <filter id="coreGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Top Precision Signal Node */}
            <line
              x1="60"
              y1="34"
              x2="60"
              y2="24"
              stroke="#38BDF8"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="60" cy="22" r="2.5" fill="#38BDF8" />

            {/* Left & Right Lateral Ears */}
            <rect
              x="25"
              y="53"
              width="4"
              height="14"
              rx="2"
              fill="#3B82F6"
              opacity="0.8"
            />
            <rect
              x="91"
              y="53"
              width="4"
              height="14"
              rx="2"
              fill="#3B82F6"
              opacity="0.8"
            />

            {/* Main Head Chassis (Geometric Squircle) */}
            <rect
              x="31"
              y="34"
              width="58"
              height="48"
              rx="16"
              className="fill-slate-100 dark:fill-[#0F172A] stroke-sky-400"
              strokeWidth="1.5"
            />

            {/* Visor Aperture */}
            <rect
              x="38"
              y="42"
              width="44"
              height="28"
              rx="10"
              className="fill-slate-900 dark:fill-[#070A12] stroke-slate-200 dark:stroke-slate-800"
              strokeWidth="1"
            />

            {/* Vector Eyes with Natural Blink Animation */}
            <g className="animate-[blink_4s_infinite]">
              {/* Left Eye Capsule */}
              <rect
                x="46"
                y="52"
                width="8"
                height="6"
                rx="3"
                fill="#38BDF8"
              />
              {/* Right Eye Capsule */}
              <rect
                x="66"
                y="52"
                width="8"
                height="6"
                rx="3"
                fill="#38BDF8"
              />
            </g>

            {/* Geometric Torso Base */}
            <path
              d="M45 83 L50 96 H70 L75 83"
              className="fill-slate-100 dark:fill-[#0F172A] stroke-blue-500"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {/* Cyber Core Reactor */}
            <circle
              cx="60"
              cy="89"
              r="2.5"
              fill="#38BDF8"
              filter="url(#coreGlow)"
            />
            <circle
              cx="60"
              cy="89"
              r="5"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
          </svg>
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
