"use client";

import React, { useState, useEffect } from "react";
import {
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Video as VideoIcon,
  VideoOff,
  RefreshCw,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CallOverlayModalProps {
  isOpen: boolean;
  type: "voice" | "video";
  contact: {
    name: string;
    username: string;
    avatarUrl: string;
  };
  currentUserAvatar?: string;
  onClose: (durationSeconds: number) => void;
  onSwitchType?: (newType: "voice" | "video") => void;
}

export function CallOverlayModal({
  isOpen,
  type,
  contact,
  currentUserAvatar,
  onClose,
  onSwitchType,
}: CallOverlayModalProps) {
  const [callStatus, setCallStatus] = useState<"ringing" | "connected">("ringing");
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  // Transition from ringing to connected after 2.5 seconds
  useEffect(() => {
    if (!isOpen) {
      setCallStatus("ringing");
      setDuration(0);
      return;
    }

    const ringTimer = setTimeout(() => {
      setCallStatus("connected");
    }, 2400);

    return () => clearTimeout(ringTimer);
  }, [isOpen]);

  // Duration timer when connected
  useEffect(() => {
    if (!isOpen || callStatus !== "connected") return;

    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, callStatus]);

  if (!isOpen) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEndCall = () => {
    onClose(duration);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-lg flex flex-col justify-between p-4 sm:p-6 text-white select-none animate-in fade-in duration-200">
      {/* Top Bar with Status and Call Type */}
      <div className="flex items-center justify-between max-w-md w-full mx-auto pt-2 shrink-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold tracking-wide uppercase text-slate-300">
            {type === "video" ? "Panggilan Video HD" : "Panggilan Suara"}
          </span>
        </div>
        <div className="px-3 py-1 rounded-full bg-white/10 text-xs font-mono font-semibold">
          {callStatus === "ringing" ? "Memanggil..." : formatTimer(duration)}
        </div>
      </div>

      {/* Main Calling Stage */}
      <div className="flex-1 flex flex-col items-center justify-center relative w-full max-w-lg mx-auto py-6">
        {type === "voice" ? (
          /* Voice Call Stage: Concentric Audio Rings & Avatar */
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative flex items-center justify-center">
              {/* Pulsing concentric sound waves */}
              <div className="absolute w-44 h-44 rounded-full bg-blue-500/10 animate-ping duration-1000" />
              <div className="absolute w-36 h-36 rounded-full bg-sky-500/20 animate-pulse" />

              <img
                src={contact.avatarUrl}
                alt={contact.name}
                className="w-28 h-28 rounded-full object-cover ring-4 ring-white/20 shadow-2xl relative z-10"
              />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {contact.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                @{contact.username}
              </p>
              <p className="text-xs text-blue-400 font-medium mt-2">
                {callStatus === "ringing"
                  ? "Menghubungkan sinyal enkripsi end-to-end..."
                  : "Terhubung • Kualitas Audio Stereo"}
              </p>
            </div>
          </div>
        ) : (
          /* Video Call Stage: Video feed preview + User PiP */
          <div className="relative w-full h-[55vh] max-h-[500px] rounded-3xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl flex items-center justify-center">
            {isVideoDisabled ? (
              <div className="text-center p-6 space-y-3">
                <img
                  src={contact.avatarUrl}
                  alt={contact.name}
                  className="w-20 h-20 rounded-full mx-auto object-cover ring-2 ring-white/20"
                />
                <p className="text-xs text-slate-400">Kamera dinonaktifkan</p>
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center bg-radial from-slate-800 to-slate-950">
                <img
                  src={contact.avatarUrl}
                  alt={contact.name}
                  className="w-32 h-32 rounded-full object-cover ring-4 ring-sky-500/40 shadow-2xl animate-pulse"
                />
                <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-xs font-semibold">
                  {contact.name}
                </div>
              </div>
            )}

            {/* Picture-in-Picture (PiP) user camera preview */}
            <div className="absolute top-4 right-4 w-24 h-32 sm:w-28 sm:h-36 rounded-2xl overflow-hidden border-2 border-white/30 bg-slate-800 shadow-xl">
              <img
                src={currentUserAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face"}
                alt="Anda"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/70 text-[9px] font-bold">
                Anda
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="max-w-md w-full mx-auto pb-4 shrink-0 z-10">
        <div className="flex items-center justify-center gap-3 sm:gap-4 p-3 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-2xl">
          {/* Mute Mic Toggle */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            aria-label={isMuted ? "Aktifkan mikrofon" : "Bisukan mikrofon"}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-md",
              isMuted ? "bg-red-500 text-white" : "bg-white/15 hover:bg-white/25 text-white"
            )}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Speaker / Volume Toggle */}
          <button
            type="button"
            onClick={() => setIsSpeaker(!isSpeaker)}
            aria-label={isSpeaker ? "Gunakan earpiece" : "Gunakan speaker"}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-md",
              !isSpeaker ? "bg-amber-500 text-white" : "bg-white/15 hover:bg-white/25 text-white"
            )}
          >
            {isSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Video Toggle / Switch */}
          {type === "video" ? (
            <button
              type="button"
              onClick={() => setIsVideoDisabled(!isVideoDisabled)}
              aria-label={isVideoDisabled ? "Nyalakan kamera" : "Matikan kamera"}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-md",
                isVideoDisabled ? "bg-red-500 text-white" : "bg-white/15 hover:bg-white/25 text-white"
              )}
            >
              {isVideoDisabled ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSwitchType?.("video")}
              aria-label="Alihkan ke panggilan video"
              className="w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all active:scale-95 shadow-md"
            >
              <VideoIcon className="w-5 h-5" />
            </button>
          )}

          {/* Switch Camera for Video */}
          {type === "video" && (
            <button
              type="button"
              onClick={() => setIsFrontCamera(!isFrontCamera)}
              aria-label="Putar kamera depan/belakang"
              className="w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all active:scale-95 shadow-md"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}

          {/* Red Hangup / End Call Button */}
          <button
            type="button"
            onClick={handleEndCall}
            aria-label="Akhiri panggilan"
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-all active:scale-95 shadow-xl shadow-red-600/40 ml-1"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
