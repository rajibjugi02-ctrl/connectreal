"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ApplePulseDotsProps {
  className?: string;
  dotClassName?: string;
  size?: "xs" | "sm" | "md" | "lg";
  color?: string; // Optional custom color class, defaults to current text color
  label?: string;
}

const SIZE_MAP = {
  xs: { dot: "w-1 h-1", gap: "gap-1", container: "h-3" },
  sm: { dot: "w-1.5 h-1.5", gap: "gap-1.5", container: "h-4" },
  md: { dot: "w-2 h-2", gap: "gap-2", container: "h-5" },
  lg: { dot: "w-2.5 h-2.5", gap: "gap-2.5", container: "h-6" },
};

export function ApplePulseDots({
  className,
  dotClassName,
  size = "sm",
  color,
  label = "Sedang mengetik...",
}: ApplePulseDotsProps) {
  const currentSize = SIZE_MAP[size] || SIZE_MAP.sm;

  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center",
        currentSize.gap,
        currentSize.container,
        className
      )}
    >
      <span className="sr-only">{label}</span>
      {[0, 1, 2].map((idx) => (
        <span
          key={idx}
          style={{
            animationDelay: `${idx * 0.18}s`,
            animationDuration: "1.2s",
          }}
          className={cn(
            "rounded-full inline-block animate-pulse shrink-0 transition-transform",
            currentSize.dot,
            color || "bg-current",
            dotClassName
          )}
        />
      ))}
      <style jsx>{`
        @keyframes applePulse {
          0%, 100% {
            transform: scale(0.65);
            opacity: 0.35;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
        }
        span:not(.sr-only) {
          animation: applePulse 1.2s cubic-bezier(0.45, 0, 0.55, 1) infinite both;
        }
      `}</style>
    </div>
  );
}

export default ApplePulseDots;

