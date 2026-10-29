"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CallRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/messages");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] text-slate-500 text-sm">
      <p>Mengalihkan ke pesan...</p>
    </div>
  );
}
