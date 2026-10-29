/**
 * Client-Side Image Compression Utility
 * Mengompresi gambar dari kamera smartphone/file picker menggunakan HTML5 Canvas
 * agar ukuran base64 menjadi sangat ringan (< 50KB), mencegah QuotaExceededError di Safari
 * dan mempercepat transmisi data real-time antar perangkat di jaringan lokal.
 */

export async function compressImage(
  fileOrDataUrl: File | string,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve) => {
    // Jalankan hanya di lingkungan browser
    if (typeof window === "undefined" || typeof document === "undefined") {
      resolve(typeof fileOrDataUrl === "string" ? fileOrDataUrl : "");
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve(typeof fileOrDataUrl === "string" ? fileOrDataUrl : "");
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed);
      } catch {
        // Fallback jika terjadi kendala canvas
        resolve(typeof fileOrDataUrl === "string" ? fileOrDataUrl : "");
      }
    };

    img.onerror = () => {
      resolve(typeof fileOrDataUrl === "string" ? fileOrDataUrl : "");
    };

    if (typeof fileOrDataUrl === "string") {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          resolve("");
        }
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}

