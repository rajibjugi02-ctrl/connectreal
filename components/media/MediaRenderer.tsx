"use client";

import React, { useState, useEffect } from "react";
import { getMediaBlobUrl } from "@/lib/db/mediaStorage";

interface MediaRendererProps {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  forceType?: "image" | "video";
  controls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.startsWith("idb:video_") ||
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".mov") ||
    lower.includes("video") ||
    lower.startsWith("data:video/")
  );
}

export function MediaRenderer({
  src,
  alt = "",
  className = "",
  style,
  forceType,
  controls = true,
  autoPlay = false,
  loop = false,
  muted = false,
  playsInline = true,
  onClick,
}: MediaRendererProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrlToRevoke: string | null = null;
    setHasError(false);

    if (!src || typeof src !== "string" || !src.trim() || src === "undefined" || src === "null") {
      setResolvedSrc(null);
      return;
    }

    if (src.startsWith("idb:")) {
      getMediaBlobUrl(src).then((blobUrl) => {
        if (!active) return;
        if (blobUrl) {
          objectUrlToRevoke = blobUrl;
          setResolvedSrc(blobUrl);
        } else {
          setHasError(true);
        }
      });
    } else {
      setResolvedSrc(src);
    }

    return () => {
      active = false;
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [src]);

  if (hasError || !resolvedSrc) {
    return null;
  }

  const isVideo = forceType === "video" || (forceType !== "image" && isVideoUrl(src));

  if (isVideo) {
    return (
      <video
        src={resolvedSrc}
        controls={controls}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline={playsInline}
        className={className}
        style={style}
        onClick={onClick}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      style={style}
      onClick={onClick}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
}

