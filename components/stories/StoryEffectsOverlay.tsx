"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type VisualFilterId =
  | "normal"
  | "golden"
  | "cyber"
  | "vintage"
  | "noir"
  | "dreamy"
  | "emerald";

export type EffectOverlayId =
  | "none"
  | "sparkles"
  | "vhs"
  | "bokeh"
  | "film_grain";

export const VISUAL_FILTERS: Array<{
  id: VisualFilterId;
  name: string;
  cssFilter: string;
  previewColor: string;
}> = [
  { id: "normal", name: "Normal", cssFilter: "none", previewColor: "from-slate-600 to-slate-800" },
  { id: "golden", name: "Golden Hour", cssFilter: "sepia(0.35) saturate(1.45) contrast(1.1) brightness(1.05)", previewColor: "from-amber-500 to-orange-600" },
  { id: "cyber", name: "Cyberpunk", cssFilter: "contrast(1.35) saturate(1.6) hue-rotate(-20deg)", previewColor: "from-fuchsia-600 to-purple-800" },
  { id: "vintage", name: "Vintage 90s", cssFilter: "sepia(0.4) contrast(0.9) brightness(1.08) saturate(0.85)", previewColor: "from-amber-700 to-stone-800" },
  { id: "noir", name: "Noir B&W", cssFilter: "grayscale(1) contrast(1.4) brightness(0.95)", previewColor: "from-zinc-700 to-black" },
  { id: "dreamy", name: "Dreamy Glow", cssFilter: "brightness(1.12) contrast(0.98) saturate(1.25)", previewColor: "from-sky-400 to-indigo-600" },
  { id: "emerald", name: "Cinematic", cssFilter: "contrast(1.2) saturate(1.3) hue-rotate(15deg)", previewColor: "from-emerald-600 to-teal-800" },
];

export const EFFECT_OVERLAYS: Array<{
  id: EffectOverlayId;
  name: string;
  icon: string;
}> = [
  { id: "none", name: "Tanpa Efek", icon: "🚫" },
  { id: "sparkles", name: "Bintang Berkilau", icon: "✨" },
  { id: "vhs", name: "Retro VHS Cam", icon: "📼" },
  { id: "bokeh", name: "Bokeh Pendar", icon: "🫧" },
  { id: "film_grain", name: "Sinematik Grain", icon: "🎞️" },
];

interface StoryEffectsOverlayProps {
  effect?: string;
  className?: string;
}

export function StoryEffectsOverlay({ effect = "none", className }: StoryEffectsOverlayProps) {
  const [vhsTime, setVhsTime] = useState("00:00:00");

  useEffect(() => {
    if (effect !== "vhs") return;
    const interval = setInterval(() => {
      const d = new Date();
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      const s = String(d.getSeconds()).padStart(2, "0");
      setVhsTime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [effect]);

  if (!effect || effect === "none") return null;

  return (
    <div className={cn("absolute inset-0 pointer-events-none z-15 overflow-hidden", className)}>
      {/* 1. Sparkles / Glitter Shimmer Effect */}
      {effect === "sparkles" && (
        <div className="absolute inset-0">
          {[
            { top: "12%", left: "18%", delay: "0s", size: "w-5 h-5 text-amber-300" },
            { top: "25%", left: "78%", delay: "0.8s", size: "w-4 h-4 text-yellow-200" },
            { top: "45%", left: "22%", delay: "1.4s", size: "w-6 h-6 text-white" },
            { top: "60%", left: "70%", delay: "0.3s", size: "w-5 h-5 text-amber-200" },
            { top: "75%", left: "30%", delay: "1.9s", size: "w-4 h-4 text-sky-200" },
            { top: "85%", left: "80%", delay: "1.1s", size: "w-6 h-6 text-yellow-300" },
            { top: "35%", left: "50%", delay: "2.3s", size: "w-4 h-4 text-white" },
          ].map((spark, idx) => (
            <div
              key={idx}
              style={{
                top: spark.top,
                left: spark.left,
                animationDelay: spark.delay,
              }}
              className="absolute animate-pulse"
            >
              <svg
                viewBox="0 0 24 24"
                className={cn("drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] animate-spin", spark.size)}
                style={{ animationDuration: "6s" }}
                fill="currentColor"
              >
                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
              </svg>
            </div>
          ))}
        </div>
      )}

      {/* 2. Retro VHS / Camcorder Effect */}
      {effect === "vhs" && (
        <div className="absolute inset-0 flex flex-col justify-between p-4 font-mono select-none">
          {/* Subtle CRT Scanlines */}
          <div
            className="absolute inset-0 opacity-25 pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.45) 50%)",
              backgroundSize: "100% 4px",
            }}
          />

          {/* Top VHS Bar */}
          <div className="relative z-10 flex items-center justify-between text-white drop-shadow-md text-xs tracking-wider">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              <span className="font-bold text-red-500">REC</span>
              <span className="text-[10px] text-white/80">SP</span>
            </div>
            <div className="text-[11px] font-bold text-yellow-300 tracking-widest">
              PLAY ▶
            </div>
          </div>

          {/* Bottom VHS Bar */}
          <div className="relative z-10 flex items-center justify-between text-white drop-shadow-md text-[11px]">
            <div className="text-white/90 font-bold">{vhsTime}</div>
            <div className="flex items-center gap-1.5 text-[10px] text-white/80">
              <span>CH 03</span>
              <span className="border border-white/60 px-1 rounded-xs text-[9px]">HD</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Bokeh Lights Effect */}
      {effect === "bokeh" && (
        <div className="absolute inset-0">
          {[
            { top: "15%", left: "20%", size: "w-24 h-24", bg: "bg-pink-500/25", delay: "0s" },
            { top: "40%", left: "65%", size: "w-32 h-32", bg: "bg-amber-400/25", delay: "1.2s" },
            { top: "70%", left: "25%", size: "w-28 h-28", bg: "bg-sky-400/25", delay: "2.1s" },
            { top: "80%", left: "70%", size: "w-20 h-20", bg: "bg-purple-500/25", delay: "0.5s" },
          ].map((orb, idx) => (
            <div
              key={idx}
              style={{
                top: orb.top,
                left: orb.left,
                animationDelay: orb.delay,
              }}
              className={cn(
                "absolute rounded-full blur-xl animate-pulse pointer-events-none transform -translate-x-1/2 -translate-y-1/2",
                orb.size,
                orb.bg
              )}
            />
          ))}
        </div>
      )}

      {/* 4. Film Grain & Cinematic Vignette */}
      {effect === "film_grain" && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: "inset 0 0 80px rgba(0, 0, 0, 0.8)",
            background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%)",
          }}
        />
      )}
    </div>
  );
}

