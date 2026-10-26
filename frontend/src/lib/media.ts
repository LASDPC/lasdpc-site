const BUCKET = "lasdpc-media";
// A same-origin path is safe for production builds without a frontend override.
const BASE = (import.meta.env.VITE_MINIO_PUBLIC_URL || "/media").replace(/\/+$/, "");

export function mediaUrl(keyOrUrl?: string | null): string | undefined {
  if (!keyOrUrl) return undefined;
  if (keyOrUrl.startsWith("data:") || keyOrUrl.startsWith("/uploads/")) {
    return keyOrUrl;
  }

  let key = keyOrUrl;
  if (/^https?:\/\//i.test(keyOrUrl)) {
    // Only old, unsigned profile URLs from the local MinIO endpoint are portable.
    // In particular, leave signed S3 URLs and every other host untouched.
    const legacy = new URL(keyOrUrl);
    if (
      legacy.protocol !== "http:" ||
      !["localhost:9000", "127.0.0.1:9000"].includes(legacy.host) ||
      legacy.search || legacy.hash ||
      !legacy.pathname.startsWith(`/${BUCKET}/profile/`)
    ) {
      return keyOrUrl;
    }
    key = legacy.pathname.slice(`/${BUCKET}/`.length);
  } else if (keyOrUrl.startsWith("/media/")) {
    return keyOrUrl;
  } else if (keyOrUrl.startsWith("/")) {
    key = keyOrUrl.slice(1);
  }

  key = key.replace(/^\/+/, "").replace(new RegExp(`^(?:${BUCKET}/)+`), "");
  return `${BASE}/${key}`;
}
