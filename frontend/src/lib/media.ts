const BASE = (import.meta.env.VITE_MINIO_PUBLIC_URL ?? "").replace(/\/$/, "");

export function mediaUrl(keyOrUrl?: string | null): string | undefined {
  if (!keyOrUrl) return undefined;
  if (
    keyOrUrl.startsWith("http://") ||
    keyOrUrl.startsWith("https://") ||
    keyOrUrl.startsWith("data:") ||
    keyOrUrl.startsWith("/uploads/")
  ) {
    return keyOrUrl;
  }
  return BASE ? `${BASE}/${keyOrUrl}` : keyOrUrl;
}
