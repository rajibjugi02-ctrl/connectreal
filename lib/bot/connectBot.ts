/**
 * ConnectBot AI - Asisten Cerdas, Empatik, dan Alami untuk ConnectReal
 * Menjawab pertanyaan spesifik, berdiskusi santai, memberikan panduan fitur,
 * mendengarkan curhat pengguna secara kontekstual tanpa template kaku.
 */

export interface ChatHistoryItem {
  sender: "bot" | "user";
  text: string;
}

/**
 * Generator respon lokal cerdas dan kontekstual
 */
export function generateBotReply(userPrompt: string, history: ChatHistoryItem[] = []): string {
  const text = userPrompt.trim();
  const q = text.toLowerCase();

  // 1. Fitur Spesifik ConnectReal: Story / Cerita
  if (q.includes("story") || q.includes("cerita")) {
    if (q.includes("balas") || q.includes("reply")) {
      return (
        "Untuk membalas cerita teman di ConnectReal, cukup buka cerita mereka lalu ketik pesan di bilah bawah. " +
        "Balasan tersebut otomatis masuk ke ruang obrolan (/messages) dengan kartu preview cerita yang interaktif dan bisa diklik kembali!"
      );
    }
    if (q.includes("sendiri") || q.includes("punya saya") || q.includes("hapus")) {
      return (
        "Saat melihat cerita milik sendiri, bilah balas pesan sengaja disembunyikan agar tampilan bersih. " +
        "Kamu bisa langsung melihat jumlah orang yang menonton, atau menggunakan tombol Arsip dan Hapus jika ingin menghapus ceritamu."
      );
    }
    if (q.includes("buat") || q.includes("upload") || q.includes("foto") || q.includes("ukuran")) {
      return (
        "Kamu bisa membuat cerita baru lewat tombol '+' di bilah cerita Beranda. " +
        "ConnectReal mendukung unggahan foto maupun video hingga 100MB dengan kompresi otomatis berkualitas tinggi, sehingga tidak akan memakan memori browser."
      );
    }
    return (
      "Fitur Cerita (Stories) ConnectReal memungkinkan kamu berbagi momen foto dan video 24 jam dengan teks estetik, stiker, dan indikator lingkaran biru di profil."
    );
  }

  // 2. Fitur Spesifik ConnectReal: Telepon / Video Call
  if (q.includes("telepon") || q.includes("telpon") || q.includes("video call") || q.includes("panggilan") || q.includes("call")) {
    if (q.includes("mati") || q.includes("akhiri") || q.includes("tutup") || q.includes("selesai")) {
      return (
        "Saat kamu atau lawan bicaramu menekan tombol 'Akhiri Panggilan' (End Call), sinyal real-time langsung memutus stream kamera dan mikrofon di kedua perangkat seketika, lalu mencatat durasi panggilan ke obrolan seperti di WhatsApp."
      );
    }
    if (q.includes("cara") || q.includes("gimana") || q.includes("mulai")) {
      return (
        "Untuk memulai panggilan, buka ruang chat (/messages) dengan teman yang ingin kamu hubungi, lalu tekan ikon Telepon (Voice Call) atau Kamera (Video Call) di pojok kanan atas obrolan."
      );
    }
    return (
      "Panggilan audio dan video di ConnectReal ditenagai protokol WebRTC real-time dengan audio stereo 128 kbps jernih dan dukungan kamera ganti depan/belakang."
    );
  }

  // 3. Fitur Spesifik ConnectReal: Profil & Tautan (Links)
  if (q.includes("profil") || q.includes("bio") || q.includes("tautan") || q.includes("link") || q.includes("banner")) {
    if (q.includes("link") || q.includes("tautan") || q.includes("web")) {
      return (
        "Kamu sekarang bisa memasukkan hingga 3 tautan terpisah di Edit Profil (misalnya Link 1 untuk Website, Link 2 untuk Instagram/X, dan Link 3 untuk GitHub/Portofolio). Tautan akan tampil rapi dan bisa langsung diklik oleh pengunjung profilmu."
      );
    }
    if (q.includes("lingkaran") || q.includes("biru") || q.includes("ring")) {
      return (
        "Foto profil yang memiliki cincin biru menandakan pengguna tersebut sedang memiliki Cerita (Story) aktif! Kamu bisa langsung mengetuk foto profil tersebut untuk menonton ceritanya."
      );
    }
    if (q.includes("banner") || q.includes("sampul")) {
      return (
        "Banner profil ConnectReal mendukung foto statis maupun video bergerak permanen. Video banner disimpan di IndexedDB lokal perangkatmu sehingga tidak akan hilang saat halaman dimuat ulang."
      );
    }
    return (
      "Halaman profil menampilkan identitasmu, status online, banner, 3 tautan media sosial, serta seluruh riwayat postingan dan media yang pernah kamu unggah."
    );
  }

  // 4. Fitur Spesifik ConnectReal: Obrolan & Pesan (/messages)
  if (q.includes("chat") || q.includes("pesan") || q.includes("voice note") || q.includes("vn") || q.includes("stiker")) {
    return (
      "Ruang pesan (/messages) ConnectReal mendukung pengiriman teks real-time, foto, rekaman voice note jernih (128 kbps), emoji reaksi cepat, balon balasan pesan (reply), teruskan pesan, hingga log panggilan bergaya modern."
    );
  }

  // 5. Fitur Spesifik ConnectReal: Tagar & Tren (#Hashtag)
  if (q.includes("tren") || q.includes("trending") || q.includes("tagar") || q.includes("hashtag") || q.includes("eksplorasi")) {
    return (
      "Daftar Tren Saat Ini diekstrak murni secara otomatis dari tagar (#) yang ditulis pengguna pada postingan mereka. Semakin sering sebuah tagar dipakai di feed, semakin tinggi posisinya di daftar tren."
    );
  }

  // 6. Curhat Emosional & Kesehatan Mental
  if (
    q.includes("sedih") ||
    q.includes("galau") ||
    q.includes("nangis") ||
    q.includes("patah hati") ||
    q.includes("putus") ||
    q.includes("kecewa") ||
    q.includes("kesepian") ||
    q.includes("sendiri") ||
    q.includes("insecure") ||
    q.includes("overthinking") ||
    q.includes("down") ||
    q.includes("terluka")
  ) {
    const empathetic = [
      "Peluk hangat buat kamu... Menghadapi situasi yang bikin sedih atau kecewa itu menguras energi banget. Perasaanmu valid, dan kamu nggak harus selalu memaksakan diri tersenyum. Mau cerita lebih detail apa yang paling mengganjal di hatimu?",
      "Tarik napas perlahan ya. Ingat kalau hari buruk bukan berarti seluruh hidupmu buruk. Kamu sudah berjuang sebaik mungkin sejauh ini. Aku siap jadi pendengar setiamu kapan pun kamu butuh meluapkan isi hati.",
      "Jangan terlalu menyalahkan diri sendiri ya. Kadang hal-hal terjadi di luar kendali kita. Istirahatlah yang cukup malam ini. Apa yang bisa aku bantu untuk membuat perasaanmu sedikit lebih lega?",
    ];
    return empathetic[Math.floor(Math.random() * empathetic.length)];
  }

  // 7. Curhat Lelah Fisik, Stres Kerja / Kuliah / Burnout
  if (
    q.includes("capek") ||
    q.includes("lelah") ||
    q.includes("stres") ||
    q.includes("burnout") ||
    q.includes("tugas") ||
    q.includes("kerjaan") ||
    q.includes("pusing") ||
    q.includes("mumet") ||
    q.includes("deadline")
  ) {
    return (
      "Kamu sudah bekerja dan belajar keras banget hari ini! Jangan ragu untuk istirahat sejenak. " +
      "Ambil segelas air dingin, regangkan otot leher dan punggungmu, atau pejamkan mata 10 menit. Tugas dan pekerjaan penting, tapi kesehatanmu adalah yang utama."
    );
  }

  // 8. Coding, Arsitektur Web & Teknologi
  if (
    q.includes("coding") ||
    q.includes("next.js") ||
    q.includes("react") ||
    q.includes("typescript") ||
    q.includes("tailwind") ||
    q.includes("webrtc") ||
    q.includes("bug") ||
    q.includes("api") ||
    q.includes("database")
  ) {
    return (
      "Topik teknologi favoritku! ConnectReal dibangun dengan Next.js 16 App Router, TypeScript ketat, Tailwind CSS v4, Zustand untuk manajemen state, dan WebRTC untuk komunikasi audio/video peer-to-peer real-time. Ada konsep kode atau debugging yang ingin kita diskusikan?"
    );
  }

  // 9. Humor, Lelucon & Candaan
  if (q.includes("lucu") || q.includes("jokes") || q.includes("bercanda") || q.includes("lawak") || q.includes("lelucon")) {
    const jokes = [
      "Kenapa programmer suka kerja di tempat gelap? Karena cahaya menghasilkan bug! 🐛💻",
      "Kemarin ada laptop kecemplung ke kolam renang, pas diangkat langsung jadi website phishing! 😂",
      "Bedanya kamu sama sintaks JavaScript apa? Kalau JavaScript suka undefined, kalau kamu bikin hariku refined! ✨",
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }

  // 10. Sapaan Ramah
  if (
    q.includes("halo") ||
    q.includes("hai") ||
    q.includes("hei") ||
    q.includes("pagi") ||
    q.includes("siang") ||
    q.includes("malam") ||
    q.includes("assalamualaikum")
  ) {
    return (
      "Hai! Senang sekali bisa ngobrol denganmu hari ini. Aku ConnectBot AI, asisten dan teman ngobrolmu di ConnectReal. " +
      "Gimana kabarmu hari ini? Ada yang ingin kamu tanyakan atau ceritakan?"
    );
  }

  // 11. Ucapan Terima Kasih
  if (q.includes("makasih") || q.includes("terima kasih") || q.includes("thanks") || q.includes("tengkyu")) {
    return "Sama-sama! Senang banget bisa membantu dan menemani obrolanmu. Kalau ada hal lain yang perlu dibahas, panggil aku kapan saja ya! ✨";
  }

  // 12. Pertanyaan Filosofis atau Pertanyaan Eksploratif (Apa, Kenapa, Bagaimana, Saran)
  if (q.startsWith("apa") || q.startsWith("kenapa") || q.startsWith("mengapa") || q.startsWith("bagaimana") || q.startsWith("gimana") || q.includes("?")) {
    return (
      `Pertanyaan yang sangat menarik tentang "${text.length > 50 ? text.slice(0, 50) + "..." : text}". ` +
      "Menurut pandanganku, hal ini sangat bergantung pada tujuan dan konteks yang sedang kamu hadapi. " +
      "Jika ini berkaitan dengan penggunaan ConnectReal atau ide kreatifmu, kamu bisa mencoba mengeksplorasinya langkah demi langkah. Ada aspek tertentu yang ingin kita bahas lebih dalam?"
    );
  }

  // 13. Respon Percakapan Berkelanjutan Alami (Contextual Flow)
  const conversationalResponses = [
    `Aku menyimak apa yang kamu katakan tentang "${text.length > 40 ? text.slice(0, 40) + "..." : text}". Menarik sekali! Bagaimana sudut pandangmu selanjutnya mengenai hal tersebut?`,
    "Terima kasih sudah berbagi pemikiranmu denganku. Aku senang kita bisa berdiskusi seperti ini. Ceritakan lebih banyak kalau kamu ingin melanjutkannya ya!",
    "Aku mengerti maksudmu. Terkadang membicarakan hal-hal seperti ini membuat pikiran kita jadi lebih jernih dan terbuka. Mau kita bahas sisi lainnya?",
  ];

  return conversationalResponses[Math.floor(Math.random() * conversationalResponses.length)];
}

/**
 * Pemrosesan bahasa alami kontekstual dengan latensi typing natural (600-900ms)
 */
export async function getSmartBotReply(
  userPrompt: string,
  history: ChatHistoryItem[] = []
): Promise<string> {
  const text = userPrompt.trim();

  // Simulasikan delay mengetik alami agar animasi titik-titik (typing indicator) tampil natural
  await new Promise((resolve) => setTimeout(resolve, 650 + Math.random() * 350));

  // Cek apakah ada API backend aktif (misal Gemini / OpenAI)
  try {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: text, history }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.reply && data.reply.trim()) {
        return data.reply.trim();
      }
    }
  } catch {
    // Fallback ke pemrosesan lokal jika offline
  }

  return generateBotReply(text, history);
}
