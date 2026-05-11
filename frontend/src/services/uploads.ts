import { getToken } from "@/lib/api";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 2 * 1024 * 1024;

export type UploadPrefix = "profile" | "blog" | "markdown";

export async function uploadMedia(
  file: File,
  prefix: UploadPrefix,
  publicUpload = false,
): Promise<{ key: string }> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Only JPEG, PNG or WebP images are allowed");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("File must be under 2 MB");
  }

  const formData = new FormData();
  formData.append("file", file);

  // Profile uploads have dedicated endpoints (one autenticado, um público para registro).
  // Blog/markdown vão pelo endpoint genérico /uploads/{prefix} (admin-only no backend).
  let endpoint: string;
  if (prefix === "profile") {
    endpoint = publicUpload ? "/api/v1/uploads/public" : "/api/v1/uploads";
  } else {
    endpoint = `/api/v1/uploads/${prefix}`;
  }

  const token = getToken();
  const headers: Record<string, string> = {};
  if (!publicUpload && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(endpoint, { method: "POST", headers, body: formData });
  if (!res.ok) throw new Error("Upload failed");
  return (await res.json()) as { key: string };
}

export async function uploadProfilePhoto(file: File, publicUpload = false) {
  return uploadMedia(file, "profile", publicUpload);
}
