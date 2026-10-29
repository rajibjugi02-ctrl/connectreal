import { PostItem, TrendTopic } from "@/lib/types";

/**
 * Mengekstrak seluruh tagar (#) dari postingan asli pengguna secara dinamis.
 * Menghitung frekuensi kemunculan setiap tagar dan mengurutkannya dari yang paling tren.
 */
export function extractTrendsFromPosts(posts: PostItem[]): TrendTopic[] {
  if (!Array.isArray(posts) || posts.length === 0) {
    return [];
  }

  const counts = new Map<string, number>();

  for (const post of posts) {
    if (!post.content || typeof post.content !== "string") continue;
    const matches = post.content.match(/#[a-zA-Z0-9_]+/g);
    if (!matches) continue;

    // Hitung 1 kali per postingan agar tidak dimanipulasi oleh spam di 1 postingan
    const uniqueHashtags = new Set(matches.map((h) => h.toLowerCase()));
    for (const tag of uniqueHashtags) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }

  if (counts.size === 0) {
    return [];
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([hashtag, count], idx) => ({
      id: `trend-${idx + 1}-${hashtag.replace(/^#/, "")}`,
      category: "Tren di ConnectReal",
      hashtag: hashtag,
      postsCount: `${count} postingan`,
    }));
}

