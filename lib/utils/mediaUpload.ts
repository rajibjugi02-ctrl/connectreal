/**
 * Client-Side Media Upload Helper
 * Mengunggah berkas foto/video hingga 100MB langsung ke server LAN
 * Mengembalikan path URL publik (/api/uploads/...) yang dapat diakses oleh semua perangkat di jaringan lokal.
 */

export async function uploadMediaFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Gagal mengunggah berkas");
  }

  const data = await res.json();
  if (!data.success || !data.url) {
    throw new Error(data.error || "URL media tidak valid");
  }

  return data.url;
}

