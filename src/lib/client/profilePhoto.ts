"use client";

export const PROFILE_PHOTO_UPDATED_EVENT = "profile-photo-updated";

export type ProfilePhotoUpdatedDetail = {
  path: string;
  at: number;
};

function normalizePhotoPath(value: string) {
  const trimmed = value.replace(/\\/g, "/").trim();
  return trimmed
    .replace(/^\.\/+/, "")
    .replace(/^\/?public\//i, "");
}

export function resolveAgentPhotoSrc(value: string | null | undefined, cacheToken?: number) {
  const raw = normalizePhotoPath(String(value ?? ""));
  if (!raw) return undefined;

  let base: string;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("/")) {
    base = raw.startsWith("/") ? `/${raw.replace(/^\/+/, "")}` : raw;
  } else if (/^agent-photos\//i.test(raw)) {
    base = `/${raw}`;
  } else {
    base = `/agent-photos/${raw}`;
  }

  if (!cacheToken) return base;

  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}v=${cacheToken}`;
}

export function emitProfilePhotoUpdated(path: string | null | undefined) {
  if (typeof window === "undefined") return;
  const nextPath = String(path ?? "").trim();
  if (!nextPath) return;

  const detail: ProfilePhotoUpdatedDetail = {
    path: nextPath,
    at: Date.now(),
  };
  window.dispatchEvent(new CustomEvent(PROFILE_PHOTO_UPDATED_EVENT, { detail }));
}
