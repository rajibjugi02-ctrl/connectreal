"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, Download } from "lucide-react";

interface ImageZoomLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt?: string;
}

export function ImageZoomLightbox({
  isOpen,
  onClose,
  imageUrl,
  alt = "Foto",
}: ImageZoomLightboxProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      else if (e.key === "+" || e.key === "=") handleZoomIn();
      else if (e.key === "-") handleZoomOut();
      else if (e.key === "0") handleReset();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen || !imageUrl) return null;

  const handleZoomIn = () => setScale((s) => Math.min(4, +(s + 0.5).toFixed(1)));
  const handleZoomOut = () => {
    setScale((s) => {
      const next = Math.max(1, +(s - 0.5).toFixed(1));
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleDoubleTap = () => {
    if (scale > 1) {
      handleReset();
    } else {
      setScale(2.5);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-70 bg-black/92 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none animate-in fade-in duration-200"
    >
      {/* Floating Top Controls */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-4 right-4 z-80 flex items-center gap-2 bg-black/75 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-2xl shadow-xl"
      >
        <button
          type="button"
          onClick={handleZoomIn}
          title="Perbesar (+)"
          className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          title="Perkecil (-)"
          className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={handleReset}
          title="Reset Zoom"
          className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <span className="text-xs text-white/70 font-mono font-bold px-1.5">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={onClose}
          title="Tutup (Esc)"
          className="p-1.5 text-white/80 hover:text-white hover:bg-red-500/80 rounded-xl transition-all ml-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image Display with Pan & Zoom */}
      <div
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={handleDoubleTap}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in" }}
      >
        <img
          src={imageUrl}
          alt={alt}
          draggable={false}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? "none" : "transform 0.15s ease-out",
          }}
          className="max-w-full max-h-[90vh] object-contain select-none"
        />
      </div>
    </div>
  );
}

