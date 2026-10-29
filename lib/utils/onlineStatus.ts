import { UserProfile, RegisteredUser } from "@/lib/types";

/**
 * Mengevaluasi visibilitas status kehadiran online (titik hijau vs abu-abu)
 * secara real-time antar perangkat.
 *
 * Sesuai aturan:
 * 1. Target offline / toggle mati (showOnlineStatus === false) / memilih "nobody": Titik Abu-abu.
 * 2. Target online & memilih "everyone": Titik Hijau untuk semua.
 * 3. Target online & memilih "followers": Titik Hijau hanya jika viewer mengikuti (isFollowing), selain itu Abu-abu.
 */
export function canSeeOnlineStatus(
  targetUser?: Partial<UserProfile & RegisteredUser> | null,
  viewerUser?: Partial<UserProfile & RegisteredUser> | null,
  isFollowing: boolean = false
): boolean {
  if (!targetUser) return false;

  // Akun sendiri selalu melihat indikator aktif jika sedang terhubung
  if (viewerUser?.id && targetUser.id === viewerUser.id) {
    return targetUser.isOnline !== false;
  }

  // Jika target sedang offline
  if (targetUser.isOnline === false) return false;

  // Jika target mematikan fitur status kehadiran
  if (targetUser.showOnlineStatus === false) return false;

  // Evaluasi opsi visibilitas
  const visibility = targetUser.onlineVisibility || "everyone";
  if (visibility === "nobody") return false;

  if (visibility === "followers" || visibility === "contacts") {
    return Boolean(isFollowing);
  }

  return true;
}

export function getOnlineDotClass(isVisible: boolean): string {
  return isVisible
    ? "bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
    : "bg-slate-400 dark:bg-slate-500 ring-2 ring-white dark:ring-slate-900";
}
