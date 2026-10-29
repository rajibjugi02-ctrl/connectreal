"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Music,
  X,
  Play,
  Pause,
  Search,
  Upload,
  Check,
  Volume2,
  Sparkles,
  Disc3
} from "lucide-react";
import { POPULAR_MUSIC_TRACKS } from "@/lib/music/musicLibrary";
import { MusicTrack } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MusicPickerModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSelectTrack: (track: MusicTrack) => void;
  selectedTrackId?: string;
}

export function MusicPickerModal({
  isOpen = true,
  onClose,
  onSelectTrack,
  selectedTrackId,
}: MusicPickerModalProps) {
  const [search, setSearch] = useState("");
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [activePreviewTrack, setActivePreviewTrack] = useState<MusicTrack | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const customFileInputRef = useRef<HTMLInputElement>(null);

  // Stop audio on close
  useEffect(() => {
    if (!isOpen) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingTrackId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const togglePreview = (track: MusicTrack) => {
    if (playingTrackId === track.id) {
      audioRef.current?.pause();
      setPlayingTrackId(null);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(track.audioUrl);
      } else {
        audioRef.current.pause();
        audioRef.current.src = track.audioUrl;
      }
      audioRef.current.play().catch(() => {});
      setPlayingTrackId(track.id);
      setActivePreviewTrack(track);

      audioRef.current.onended = () => {
        setPlayingTrackId(null);
      };
    }
  };

  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const audioUrl = URL.createObjectURL(file);
      const customTrack: MusicTrack = {
        id: "custom-" + Date.now(),
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: "Audio Kustom Anda",
        genre: "Berkas Lokal",
        duration: 30,
        audioUrl,
        coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&h=200&q=80",
        lyrics: [
          { time: 0, text: "♪ Musik kustom diputar..." },
          { time: 6, text: file.name },
          { time: 14, text: "Nikmati irama lagu pilihan Anda ♪" },
        ],
      };
      onSelectTrack(customTrack);
      onClose();
    }
  };

  const filteredTracks = POPULAR_MUSIC_TRACKS.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.artist.toLowerCase().includes(search.toLowerCase()) ||
      (t.genre && t.genre.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-[#0E1522] text-slate-900 dark:text-slate-100 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-4 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/60 dark:bg-[#111827]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 dark:text-sky-400 flex items-center justify-center">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                Pilih Musik & Lagu
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Lagu bebas royalti dengan lirik sinkronisasi beat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar & Custom Upload */}
        <div className="p-4 space-y-3 shrink-0 border-b border-slate-100 dark:border-slate-800/80">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul lagu, artis, atau genre..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pilihan Populer
            </span>
            <button
              type="button"
              onClick={() => customFileInputRef.current?.click()}
              className="text-xs font-semibold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah MP3 Sendiri</span>
            </button>
            <input
              ref={customFileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleCustomAudioUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Track List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredTracks.map((track) => {
            const isPlaying = playingTrackId === track.id;
            const isSelected = selectedTrackId === track.id;

            return (
              <div
                key={track.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-2xl border transition-all group",
                  isSelected
                    ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/30"
                    : "border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#131B29] hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Cover with Play/Pause overlay */}
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-xs group/cover">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className={cn(
                        "w-full h-full object-cover transition-transform duration-300",
                        isPlaying && "scale-105"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => togglePreview(track)}
                      className={cn(
                        "absolute inset-0 flex items-center justify-center bg-black/40 text-white transition-opacity",
                        isPlaying ? "opacity-100" : "opacity-0 group-hover/cover:opacity-100"
                      )}
                      aria-label={isPlaying ? "Jeda lagu" : "Putar lagu"}
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 fill-white" />
                      ) : (
                        <Play className="w-5 h-5 fill-white" />
                      )}
                    </button>
                  </div>

                  {/* Title & Artist & Synced Lyrics indicator */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                        {track.title}
                      </h4>
                      {track.lyrics && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20 shrink-0">
                          Lirik
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {track.artist} {track.genre ? `• ${track.genre}` : ""}
                    </p>
                  </div>
                </div>

                {/* Select Button */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectTrack(track);
                    onClose();
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 ml-2",
                    isSelected
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                  )}
                >
                  {isSelected ? (
                    <span className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Terpilih
                    </span>
                  ) : (
                    "Gunakan"
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
