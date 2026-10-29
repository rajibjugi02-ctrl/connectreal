"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, PhoneOff, Video } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { pushToServer, dismissedCallIds } from "@/lib/sync/clientSync";
import { ringtonePlayer } from "@/lib/utils/ringtonePlayer";

export function IncomingCallModal() {
  const router = useRouter();
  const { incomingCall, setIncomingCall, currentUser, sendMessage } = useAppStore();
  const [ringingTime, setRingingTime] = useState(0);

  useEffect(() => {
    if (!incomingCall) {
      ringtonePlayer.stop();
      setRingingTime(0);
      return;
    }

    // Bunyikan nada dering telepon digital
    ringtonePlayer.start();

    // Beritahukan pemanggil bahwa perangkat penerima sudah berdering ("ringing")
    const callerUser =
      (incomingCall as any).fromUsername ||
      incomingCall.callerName?.toLowerCase().replace(/\s+/g, "") ||
      "";
    const convId =
      (incomingCall as any).convId ||
      (callerUser
        ? `dm_${[currentUser.username.toLowerCase(), callerUser.toLowerCase()].sort().join("_")}`
        : "");

    pushToServer("CALL_SIGNAL", {
      from: currentUser.id,
      fromUsername: (currentUser.username || "").toLowerCase(),
      to: incomingCall.from,
      toUsername: callerUser,
      targetUsername: callerUser,
      type: "ringing",
      convId,
    });

    const timer = setInterval(() => {
      setRingingTime((prev) => {
        // Otomatis timeout (Panggilan Tak Terjawab / Missed Call) setelah 35 detik jika tidak diangkat
        if (prev >= 35) {
          handleTimeout();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      ringtonePlayer.stop();
    };
  }, [incomingCall]);

  if (!incomingCall) return null;

  const handleDecline = () => {
    ringtonePlayer.stop();
    if (incomingCall && currentUser) {
      dismissedCallIds.add(incomingCall.id);
      if (incomingCall.convId) dismissedCallIds.add(incomingCall.convId);

      const callerUser =
        (incomingCall as any).fromUsername ||
        incomingCall.callerName?.toLowerCase().replace(/\s+/g, "") ||
        "";
      const convId =
        (incomingCall as any).convId ||
        (callerUser
          ? `dm_${[currentUser.username.toLowerCase(), callerUser.toLowerCase()].sort().join("_")}`
          : "");

      pushToServer("CALL_SIGNAL", {
        from: currentUser.id,
        fromUsername: (currentUser.username || "").toLowerCase(),
        to: incomingCall.from,
        toUsername: callerUser,
        targetUsername: callerUser,
        type: "decline",
        convId,
      });

      if (convId) {
        sendMessage(convId, "Panggilan ditolak", {
          type: "call_log",
          callLog: {
            callType: incomingCall.callType || "voice",
            status: "declined",
          },
        });
      }
    }
    setIncomingCall(null);
  };

  const handleTimeout = () => {
    ringtonePlayer.stop();
    if (incomingCall && currentUser) {
      dismissedCallIds.add(incomingCall.id);
      if (incomingCall.convId) dismissedCallIds.add(incomingCall.convId);

      const callerUser =
        (incomingCall as any).fromUsername ||
        incomingCall.callerName?.toLowerCase().replace(/\s+/g, "") ||
        "";
      const convId =
        (incomingCall as any).convId ||
        (callerUser
          ? `dm_${[currentUser.username.toLowerCase(), callerUser.toLowerCase()].sort().join("_")}`
          : "");

      pushToServer("CALL_SIGNAL", {
        from: currentUser.id,
        fromUsername: (currentUser.username || "").toLowerCase(),
        to: incomingCall.from,
        toUsername: callerUser,
        targetUsername: callerUser,
        type: "decline",
        convId,
      });

      if (convId) {
        sendMessage(convId, "Panggilan tak terjawab", {
          type: "call_log",
          callLog: {
            callType: incomingCall.callType || "voice",
            status: "missed",
          },
        });
      }
    }
    setIncomingCall(null);
  };

  const handleAccept = () => {
    ringtonePlayer.stop();
    if (!incomingCall) return;

    // Buka batasan autoplay audio WebKit/Safari dengan resume AudioContext pada user-gesture
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        ctx.resume().catch(() => {});
      }
    } catch {}

    dismissedCallIds.add(incomingCall.id);
    if (incomingCall.convId) dismissedCallIds.add(incomingCall.convId);

    const callType = incomingCall.callType || "video";
    const callerUser =
      (incomingCall as any).fromUsername ||
      incomingCall.callerName?.toLowerCase().replace(/\s+/g, "") ||
      "";
    const convId =
      (incomingCall as any).convId ||
      (callerUser
        ? `dm_${[currentUser.username.toLowerCase(), callerUser.toLowerCase()].sort().join("_")}`
        : "conv-dm");

    // Kirim sinyal terima ke penelepon
    pushToServer("CALL_SIGNAL", {
      from: currentUser.id,
      fromUsername: (currentUser.username || "").toLowerCase(),
      to: incomingCall.from,
      toUsername: callerUser,
      targetUsername: callerUser,
      type: "accept",
      convId,
    });

    setIncomingCall(null);
    router.push(
      `/call?type=${callType}&convId=${convId}&partner=${encodeURIComponent(callerUser)}&isReceiver=true`
    );
  };

  const isVideo = incomingCall.callType === "video";
  const callerName = incomingCall.callerName || "Pengguna";
  const callerAvatar =
    incomingCall.callerAvatar ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Panggilan Masuk"
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none"
    >
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 p-6 text-center text-white shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
        <div className="relative flex items-center justify-center pt-2">
          {/* Animated soundwave ripple rings */}
          <div className="absolute w-32 h-32 rounded-full bg-emerald-500/20 animate-ping duration-1000" />
          <div className="absolute w-24 h-24 rounded-full bg-emerald-500/30 animate-pulse" />
          <img
            src={callerAvatar}
            alt={callerName}
            className="w-20 h-20 rounded-full object-cover ring-4 ring-emerald-500 relative z-10 shadow-xl"
          />
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold text-xs mb-2">
            {isVideo ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
            <span>{isVideo ? "Panggilan Video HD Masuk" : "Panggilan Suara Masuk"}</span>
          </span>
          <h3 className="font-bold text-lg text-white truncate px-2">{callerName}</h3>
          <p className="text-xs text-slate-400 mt-1">Memanggil Anda secara langsung...</p>
        </div>

        <div className="flex items-center justify-center gap-6 pt-2">
          {/* Tombol Tolak */}
          <button
            type="button"
            onClick={handleDecline}
            aria-label="Tolak panggilan"
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-lg shadow-red-600/30 transition-all active:scale-90">
              <PhoneOff className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-red-400">Tolak</span>
          </button>

          {/* Tombol Terima */}
          <button
            type="button"
            onClick={handleAccept}
            aria-label="Terima panggilan"
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/40 transition-all active:scale-90 animate-bounce">
              <Phone className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-emerald-400">Terima</span>
          </button>
        </div>
      </div>
    </div>
  );
}

