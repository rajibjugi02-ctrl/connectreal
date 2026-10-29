import React, { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "ConnectReal — Real-Time Social & Messaging",
  description: "Aplikasi web sosial dan pengiriman pesan real-time berkinerja tinggi.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var s = localStorage.getItem('connectreal-storage');
                if (s) {
                  var p = JSON.parse(s);
                  if (p && p.state && p.state.theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else if (p && p.state && p.state.theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  }
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100">
        <Suspense
          fallback={
            <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100">
              <div className="w-8 h-8 rounded-full border-2 border-blue-600 dark:border-sky-400 border-t-transparent animate-spin mb-3" />
              <span className="text-xs font-semibold text-slate-400 tracking-wide">ConnectReal</span>
            </div>
          }
        >
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
