import { getToken } from "@/lib/api";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);
const MAX_SIZE = 2 * 1024 * 1024;

export async function uploadProfilePhoto(file: File, publicUpload = false) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Only JPG/PNG images are allowed");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("File must be under 2 MB");
  }

  const formData = new FormData();
  formData.append("file", file);
  const token = getToken();
  const res = await fetch(publicUpload ? "/api/v1/uploads/public" : "/api/v1/uploads", {
    method: "POST",
    headers: !publicUpload && token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error("Upload failed");
  return (await res.json()) as { url: string };
}
