"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Camera, Upload, Trash2, Image as ImageIcon, Video, MapPin, Link as LinkIcon } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { saveMediaFile, getMediaBlobUrl } from "@/lib/db/mediaStorage";
import { compressImage } from "@/lib/utils/imageCompressor";

const isVideoUrl = (url?: string) => {
  if (!url) return false;
  return (
    url.startsWith("data:video/") ||
    url.endsWith(".mp4") ||
    url.endsWith(".webm") ||
    url.endsWith(".ogg") ||
    url.startsWith("blob:") ||
    url.includes("video")
  );
};

export function EditProfileModal() {
  const { isEditProfileOpen, setEditProfileOpen, currentUser, updateCurrentUser } = useAppStore();

  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio || "");
  const [location, setLocation] = useState(currentUser.location || "");
  const [link1, setLink1] = useState(currentUser.links?.[0] || "");
  const [link2, setLink2] = useState(currentUser.links?.[1] || "");
  const [link3, setLink3] = useState(currentUser.links?.[2] || "");
  const [avatarPreview, setAvatarPreview] = useState(currentUser.avatarUrl);
  const [bannerPreview, setBannerPreview] = useState(currentUser.bannerUrl || "");
  const [bannerType, setBannerType] = useState<"image" | "video">(currentUser.bannerType || "image");
  const [pendingBannerId, setPendingBannerId] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditProfileOpen) {
      setName(currentUser.name);
      setBio(currentUser.bio || "");
      setLocation(currentUser.location || "");
      setLink1(currentUser.links?.[0] || "");
      setLink2(currentUser.links?.[1] || "");
      setLink3(currentUser.links?.[2] || "");
      setAvatarPreview(currentUser.avatarUrl);
      setBannerType(currentUser.bannerType || "image");
      setPendingBannerId(null);

      if (currentUser.bannerUrl?.startsWith("idb:")) {
        getMediaBlobUrl(currentUser.bannerUrl).then((url) => {
          if (url) setBannerPreview(url);
          else setBannerPreview(currentUser.bannerUrl || "");
        });
      } else {
        setBannerPreview(currentUser.bannerUrl || "");
      }
    }
  }, [isEditProfileOpen, currentUser]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isEditProfileOpen) {
        setEditProfileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditProfileOpen, setEditProfileOpen]);

  if (!isEditProfileOpen) return null;

  // Handle local avatar file selection dengan kompresi instan
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 360, 360, 0.85);
      if (compressed) {
        setAvatarPreview(compressed);
      }
    }
  };

  // Handle local banner file selection (gambar terkompresi atau video dengan IndexedDB)
  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("video/")) {
      const bannerKey = `banner_${currentUser.id}`;
      const storedId = await saveMediaFile(bannerKey, file);
      const videoBlobUrl = URL.createObjectURL(file);
      setBannerPreview(videoBlobUrl);
      setBannerType("video");
      setPendingBannerId(storedId);
    } else {
      const compressed = await compressImage(file, 1280, 480, 0.82);
      if (compressed) {
        setBannerPreview(compressed);
        setBannerType("image");
        setPendingBannerId(null);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLinks = [link1, link2, link3]
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const finalBanner = pendingBannerId || bannerPreview;

    try {
      updateCurrentUser({
        name: name.trim() || currentUser.name,
        bio: bio.trim(),
        location: location.trim(),
        links: parsedLinks,
        avatarUrl: avatarPreview,
        bannerUrl: finalBanner,
        bannerType: bannerType,
      });
    } catch (err) {
      console.error("Gagal memperbarui profil:", err);
    } finally {
      setEditProfileOpen(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
      onClick={() => setEditProfileOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-[#E2E8F0] dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] dark:border-slate-700">
          <h3 id="edit-profile-title" className="text-lg font-bold">
            Edit Profil Akun
          </h3>
          <button
            onClick={() => setEditProfileOpen(false)}
            aria-label="Tutup form edit profil"
            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {/* Banner Upload Area (Mendukung Foto & Video ala TikTok) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">
                Sampul Profil (Banner Foto / Video)
              </label>
              <span className="text-[11px] font-semibold text-blue-600 dark:text-sky-400 flex items-center gap-1">
                <Video className="w-3.5 h-3.5" /> Mendukung Video ala TikTok
              </span>
            </div>
            <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-[#E2E8F0] dark:border-slate-700 bg-slate-900 group">
              {bannerPreview ? (
                isVideoUrl(bannerPreview) ? (
                  <video
                    src={bannerPreview}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={bannerPreview}
                    alt="Pratinjau sampul"
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="w-full h-full bg-linear-to-r from-blue-900 to-indigo-950 flex items-center justify-center text-xs text-white/70">
                  Belum ada sampul (Foto/Video)
                </div>
              )}

              {/* Upload Overlay Button */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-white/90 text-[#0F172A] hover:bg-white shadow-md transition-all active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Unggah Foto/Video</span>
                </button>
                {bannerPreview && (
                  <button
                    type="button"
                    onClick={() => setBannerPreview("")}
                    aria-label="Hapus sampul"
                    className="p-1.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Hidden file input for banner */}
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleBannerFileChange}
                className="hidden"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              Pilih foto atau video dari perangkat Anda untuk dipasang sebagai sampul profil.
            </p>
          </div>

          {/* Avatar Upload Area */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              Foto Profil (Avatar)
            </label>
            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                <img
                  src={avatarPreview}
                  alt={name || "Avatar"}
                  className="w-20 h-20 rounded-full object-cover border-2 border-blue-500/30 ring-4 ring-white dark:ring-slate-800 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  aria-label="Ganti foto profil"
                  className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                >
                  <Camera className="w-5 h-5" />
                </button>

                {/* Hidden file input for avatar */}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
              </div>

              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all text-slate-900 dark:text-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Upload className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                  <span>Pilih Berkas Foto</span>
                </button>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Format JPG, PNG, atau WEBP dari penyimpanan lokal.
                </p>
              </div>
            </div>
          </div>

          {/* Input Nama Lengkap */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500"
              required
            />
          </div>

          {/* Input Bio Ringkas */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Bio Ringkas
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500 resize-none"
              placeholder="Ceritakan minat teknis atau keahlian Anda..."
            />
          </div>

          {/* Input Lokasi */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              <span>Lokasi</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Contoh: Jakarta, Indonesia"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>

          {/* Input 3 Tautan Profil Terpisah */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
                <span>Tautan Profil (3 Form Terpisah)</span>
              </label>
              <span className="text-[10px] text-slate-400">
                Website, Instagram, GitHub, Portofolio
              </span>
            </div>

            <div className="space-y-2">
              <div className="relative flex items-center">
                <span className="absolute left-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                  Link 1
                </span>
                <input
                  type="text"
                  value={link1}
                  onChange={(e) => setLink1(e.target.value)}
                  placeholder="https://websiteanda.com atau portofolio"
                  className="w-full pl-16 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500 font-mono"
                />
              </div>

              <div className="relative flex items-center">
                <span className="absolute left-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                  Link 2
                </span>
                <input
                  type="text"
                  value={link2}
                  onChange={(e) => setLink2(e.target.value)}
                  placeholder="https://instagram.com/username atau twitter"
                  className="w-full pl-16 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500 font-mono"
                />
              </div>

              <div className="relative flex items-center">
                <span className="absolute left-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                  Link 3
                </span>
                <input
                  type="text"
                  value={link3}
                  onChange={(e) => setLink3(e.target.value)}
                  placeholder="https://github.com/username atau linkedin"
                  className="w-full pl-16 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0] dark:border-slate-700">
            <button
              type="button"
              onClick={() => setEditProfileOpen(false)}
              className="px-4 py-2.5 text-xs font-bold rounded-xl border border-[#E2E8F0] dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all text-slate-900 dark:text-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white active:scale-95 transition-all shadow-xs focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Simpan Profil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
