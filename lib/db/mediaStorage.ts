/**
 * IndexedDB Media Storage Utility
 * Menyimpan file media besar (Video Banner profil, Story Video/Foto) secara permanen
 * tanpa batasan kuota localStorage (5MB) dan tidak hilang saat browser di-refresh.
 */

const DB_NAME = "connectreal_media_db";
const DB_VERSION = 1;
const STORE_NAME = "media_files";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB tidak didukung pada lingkungan ini"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Menyimpan Blob atau File ke dalam IndexedDB
 * @param key Pengenal unik media (contoh: "banner_usr-123")
 * @param data Blob, File, atau string Base64/DataURL
 * @returns Identifier string "idb:<key>"
 */
export async function saveMediaFile(key: string, data: Blob | File | string): Promise<string> {
  try {
    const db = await openDB();
    let blobToStore: Blob;

    if (typeof data === "string") {
      // Konversi dataURL / Base64 ke Blob jika perlu
      if (data.startsWith("data:")) {
        const res = await fetch(data);
        blobToStore = await res.blob();
      } else {
        blobToStore = new Blob([data], { type: "text/plain" });
      }
    } else {
      blobToStore = data;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blobToStore, key);

      req.onsuccess = () => resolve(`idb:${key}`);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("Gagal menyimpan media ke IndexedDB:", err);
    // Fallback mengembalikan string aslinya jika string
    return typeof data === "string" ? data : "";
  }
}

/**
 * Mengambil Blob dari IndexedDB dan membuat object URL aktif
 * @param key Pengenal media (tanpa prefix "idb:")
 * @returns Object URL (blob:http://...) atau null jika tidak ditemukan
 */
export async function getMediaBlobUrl(key: string): Promise<string | null> {
  try {
    const cleanKey = key.replace(/^idb:/, "");
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(cleanKey);

      req.onsuccess = () => {
        const result = req.result;
        if (!result) {
          resolve(null);
          return;
        }

        if (result instanceof Blob) {
          const url = URL.createObjectURL(result);
          resolve(url);
        } else {
          resolve(null);
        }
      };

      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("Gagal memuat media dari IndexedDB:", err);
    return null;
  }
}

/**
 * Menghapus media dari IndexedDB
 */
export async function deleteMediaFile(key: string): Promise<void> {
  try {
    const cleanKey = key.replace(/^idb:/, "");
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(cleanKey);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("Gagal menghapus media dari IndexedDB:", err);
  }
}

