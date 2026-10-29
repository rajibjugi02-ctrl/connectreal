"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Layers, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface CardCornerFanProps {
  images: string[];
  isSender?: boolean;
  onSelectImage?: (url: string, index: number) => void;
  className?: string;
}

export function CardCornerFan({
  images,
  isSender = false,
  onSelectImage,
  className,
}: CardCornerFanProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  // Jika hanya 1 gambar, tampilkan preview standar
  if (images.length === 1) {
    return (
      <div className={cn("relative group cursor-pointer overflow-hidden rounded-2xl", className)}>
        <img
          src={images[0]}
          alt="Foto terkirim"
          className="rounded-2xl max-h-72 w-full object-cover transition-transform duration-300 group-hover:scale-102"
          onClick={() => onSelectImage?.(images[0], 0)}
        />
      </div>
    );
  }

  // Sudut rotasi dan offset untuk efek kipas sudut (@amicro/card-corner-fan)
  const getFanTransform = (index: number, total: number, expanded: boolean) => {
    const center = (total - 1) / 2;
    const diff = index - center;

    if (expanded) {
      // Ketika dibuka (expanded/hover): kipas melebar rapi dari tengah
      const rotate = diff * 12;
      const x = diff * 26;
      const y = Math.abs(diff) * -6;
      return { rotate, x, y, scale: 1.02 };
    }

    // Default terkumpul rapi bertumpuk
    const rotate = diff * 6;
    const x = diff * 8;
    const y = Math.abs(diff) * -2;
    return { rotate, x, y, scale: 1 };
  };

  return (
    <div
      className={cn(
        "relative flex flex-col select-none py-1",
        isSender ? "items-end" : "items-start",
        className
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => {
        setIsExpanded(false);
        setHoveredIdx(null);
      }}
    >
      {/* Indikator Album Foto Minimalis & Bersih */}
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md shadow-xs mb-1.5 select-none",
          isSender
            ? "bg-black/50 text-white border border-white/15"
            : "bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80"
        )}
      >
        <Layers className="w-3.5 h-3.5 text-blue-500 dark:text-sky-400" />
        <span>{images.length} Foto</span>
      </div>

      {/* Fan Cards Container */}
      <div
        onClick={() => setIsExpanded((prev) => !prev)}
        className="relative h-48 sm:h-54 w-52 sm:w-60 cursor-pointer flex items-center justify-center my-0.5"
      >
        {images.map((url, idx) => {
          const transform = getFanTransform(idx, images.length, isExpanded);
          const isHovered = hoveredIdx === idx;

          return (
            <motion.div
              key={idx}
              initial={false}
              animate={{
                rotate: isHovered ? 0 : transform.rotate,
                x: isHovered ? 0 : transform.x,
                y: isHovered ? -16 : transform.y,
                scale: isHovered ? 1.08 : transform.scale,
                zIndex: isHovered ? 35 : idx + 1,
              }}
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 22,
              }}
              style={{
                transformOrigin: "bottom center",
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectImage?.(url, idx);
              }}
              className={cn(
                "absolute w-40 sm:w-44 h-40 sm:h-44 rounded-2xl overflow-hidden",
                "border-2 border-white dark:border-slate-700 shadow-xl shadow-black/25",
                "bg-slate-200 dark:bg-slate-800 cursor-pointer group"
              )}
            >
              <img
                src={url}
                alt={`Foto album ke-${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />

              {/* Number Pill Overlay */}
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white shadow-xs">
                {idx + 1}
              </div>

              {/* Hover detail preview icon */}
              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white">
                <Eye className="w-4 h-4" />
                <span className="text-[11px] font-semibold">Buka</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

