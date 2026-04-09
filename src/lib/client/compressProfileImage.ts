"use client";

import imageCompression from "browser-image-compression";

const PROFILE_COMPRESSION_OPTIONS = {
  maxSizeMB: 1.2,
  maxWidthOrHeight: 1600,
  useWebWorker: true,
  initialQuality: 0.8,
} as const;

export async function compressProfileImage(file: File) {
  if (!(file instanceof File)) return file;
  if (!String(file.type ?? "").toLowerCase().startsWith("image/")) return file;

  try {
    const compressed = await imageCompression(file, PROFILE_COMPRESSION_OPTIONS);
    if (!(compressed instanceof File)) return file;
    if (compressed.size >= file.size) return file;
    return new File([compressed], file.name, {
      type: compressed.type || file.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error("Profile image compression failed:", error);
    return file;
  }
}
