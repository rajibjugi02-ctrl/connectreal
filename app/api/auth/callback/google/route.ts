import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Pastikan origin konsisten: http://localhost:3000 untuk lokal, atau HTTPS domain resmi untuk hosting
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const isLocal =
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    host.includes("0.0.0.0") ||
    origin.includes("localhost") ||
    origin.includes("127.0.0.1");

  let baseOrigin = isLocal ? "http://localhost:3000" : origin;
  if (!isLocal && host) {
    const proto = req.headers.get("x-forwarded-proto") || "https";
    baseOrigin = `${proto}://${host}`;
  }

  if (error || !code) {
    return NextResponse.redirect(
      `${baseOrigin}/auth?error=${encodeURIComponent(error || "Google login dibatalkan atau gagal.")}`
    );
  }

  try {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
    const redirectUri = `${baseOrigin}/api/auth/callback/google`;

    // 1. Tukar authorization code dengan Access Token & ID Token dari server Google
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Google token exchange error:", tokenData);
      const errMsg =
        tokenData.error_description ||
        tokenData.error ||
        "Gagal menukar token dengan Google.";
      return NextResponse.redirect(
        `${baseOrigin}/auth?error=${encodeURIComponent(errMsg)}`
      );
    }

    // 2. Ambil data profil pengguna asli dari Google API
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const googleUser = await userRes.json();

    if (!googleUser.email) {
      return NextResponse.redirect(
        `${baseOrigin}/auth?error=${encodeURIComponent("Gagal mengambil email dari akun Google Anda.")}`
      );
    }

    // 3. Arahkan kembali ke /auth dengan data terverifikasi
    const authSuccessUrl = new URL(`${baseOrigin}/auth`);
    authSuccessUrl.searchParams.set("google_success", "true");
    authSuccessUrl.searchParams.set("name", googleUser.name || "Pengguna Google");
    authSuccessUrl.searchParams.set("email", googleUser.email);
    authSuccessUrl.searchParams.set("avatar", googleUser.picture || "");

    return NextResponse.redirect(authSuccessUrl.toString());
  } catch (err: unknown) {
    console.error("Google OAuth server error:", err);
    return NextResponse.redirect(
      `${baseOrigin}/auth?error=${encodeURIComponent("Terjadi kesalahan pada server saat login Google.")}`
    );
  }
}
