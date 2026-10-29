import { MusicTrack } from "@/lib/types";

/**
 * Pustaka Musik Resmi ConnectReal
 * Trek audio bebas royalti dengan lirik sinkronisasi timestamp beat (Karaoke / Story style).
 */
export const POPULAR_MUSIC_TRACKS: MusicTrack[] = [
  {
    id: "track-1",
    title: "Golden Hour Glow",
    artist: "Aura Soundscape",
    genre: "Lo-Fi Chill",
    duration: 32,
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3",
    coverUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=200&h=200&q=80",
    lyrics: [
      { time: 0, text: "♪ Melodi santai di sore hari..." },
      { time: 4, text: "Menatap senja di balik jendela kota" },
      { time: 8, text: "Setiap detak beat membawa ketenangan" },
      { time: 13, text: "Hilangkan lelah, nikmati momen ini" },
      { time: 18, text: "Dunia berputar perlahan tapi pasti" },
      { time: 24, text: "Bersama ConnectReal, cerita takkan sunyi ♪" },
    ],
  },
  {
    id: "track-2",
    title: "Neon Jakarta Nights",
    artist: "Synthwave Batavia",
    genre: "Synthwave / Electro",
    duration: 30,
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=electronic-future-beats-117997.mp3",
    coverUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=200&h=200&q=80",
    lyrics: [
      { time: 0, text: "♪ Lampu neon menyala di jalanan..." },
      { time: 3.5, text: "Laju cepat menembus malam" },
      { time: 7.5, text: "Bass berdenyut menggetarkan langkah" },
      { time: 12.0, text: "Energi tanpa batas menyatu di udara" },
      { time: 17.0, text: "Jakarta tak pernah tidur" },
      { time: 22.5, text: "Kita ciptakan ritme kita sendiri! ⚡" },
    ],
  },
  {
    id: "track-3",
    title: "Akustik Pagi Damai",
    artist: "Senja & Kopi",
    genre: "Indie Acoustic",
    duration: 28,
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/11/06/audio_c93e43d61f.mp3?filename=acoustic-guitars-ambient-126211.mp3",
    coverUrl: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=200&h=200&q=80",
    lyrics: [
      { time: 0, text: "♪ Petikan gitar menyapa fajar..." },
      { time: 4.2, text: "Secangkir kopi hangat di genggaman" },
      { time: 9.0, text: "Langkah kecil menuju impian besar" },
      { time: 14.5, text: "Jangan lupa bersyukur hari ini" },
      { time: 20.0, text: "Semoga harimu dipenuhi kebaikan ☕" },
    ],
  },
  {
    id: "track-4",
    title: "Upbeat Summer Vibes",
    artist: "Tropical Wave",
    genre: "Pop / Upbeat",
    duration: 30,
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=tropic-summer-124687.mp3",
    coverUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=200&h=200&q=80",
    lyrics: [
      { time: 0, text: "♪ Rasakan sinar matahari tropis!" },
      { time: 3.8, text: "Angin laut berhembus ceria" },
      { time: 8.0, text: "Senyum merekah, saatnya bersenang-senang" },
      { time: 13.5, text: "Abadikan momen bersama teman-teman" },
      { time: 19.0, text: "Setiap detik adalah kenangan indah 🌴" },
    ],
  },
  {
    id: "track-5",
    title: "Cinematic Dreamscape",
    artist: "Celestial Horizon",
    genre: "Ambient Piano",
    duration: 35,
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=inspiring-cinematic-ambient-116199.mp3",
    coverUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=200&h=200&q=80",
    lyrics: [
      { time: 0, text: "♪ Denting piano melintasi angkasa..." },
      { time: 5.5, text: "Bintang-bintang bersinar dalam sunyi" },
      { time: 11.0, text: "Kisah kita terukir di cakrawala" },
      { time: 17.5, text: "Harapan yang tak pernah padam" },
      { time: 24.0, text: "Terbang bebas melampaui mimpi ✨" },
    ],
  },
];

