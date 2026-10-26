import { defaultUrlTransform } from "react-markdown";
import { mediaUrl } from "@/lib/media";

export const urlTransform = (url: string) => {
  if (url.startsWith("data:")) return url;
  if (
    url.startsWith("/") ||
    url.startsWith("#") ||
    url.startsWith("mailto:")
  ) {
    return defaultUrlTransform(url);
  }
  // Absolute URLs retain their host unless they are known legacy profile images.
  // Relative paths are MinIO object keys.
  return defaultUrlTransform(mediaUrl(url) ?? url);
};
