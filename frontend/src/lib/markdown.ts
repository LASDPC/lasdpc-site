import { defaultUrlTransform } from "react-markdown";
import { mediaUrl } from "@/lib/media";

export const urlTransform = (url: string) => {
  if (url.startsWith("data:")) return url;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("/") ||
    url.startsWith("#") ||
    url.startsWith("mailto:")
  ) {
    return defaultUrlTransform(url);
  }
  // Relative path that doesn't start with "/" — treat as MinIO object key
  return defaultUrlTransform(mediaUrl(url) ?? url);
};
