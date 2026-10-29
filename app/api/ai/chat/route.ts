import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, history } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt tidak valid" }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (geminiKey) {
      // Panggilan resmi ke Google Gemini REST API
      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;

      const contents = [
        {
          role: "user",
          parts: [
            {
              text: "Anda adalah ConnectBot AI, sahabat ngobrol cerdas, hangat, dan asisten resmi platform sosial ConnectReal. Berbicaralah dalam bahasa Indonesia yang alami, hangat, empatik seperti sahabat dekat, tidak kaku, dan tidak pernah menggunakan template generik. Jika diajak curhat, dengarkan dengan penuh empati. Jika diajak bercanda, tanggapi dengan cerdas dan ramah.",
            },
          ],
        },
      ];

      if (Array.isArray(history)) {
        history.slice(-6).forEach((h: { sender: string; text: string }) => {
          contents.push({
            role: h.sender === "user" ? "user" : "model",
            parts: [{ text: h.text }],
          });
        });
      }

      contents.push({
        role: "user",
        parts: [{ text: prompt }],
      });

      const response = await fetch(geminiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 600,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return NextResponse.json({ reply: text });
        }
      }
    }

    // Jika tanpa API key, kembalikan sinyal untuk menggunakan contextual engine lokal
    return NextResponse.json({ reply: null });
  } catch (error) {
    console.error("AI route error:", error);
    return NextResponse.json({ reply: null }, { status: 500 });
  }
}

