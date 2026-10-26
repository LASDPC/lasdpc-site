import { afterEach, describe, expect, it, vi } from "vitest";

async function resolve(value?: string | null, base = "https://lasdpc.icmc.usp.br/media") {
  vi.stubEnv("VITE_MINIO_PUBLIC_URL", base);
  vi.resetModules();
  const { mediaUrl } = await import("@/lib/media");
  return mediaUrl(value);
}

afterEach(() => vi.unstubAllEnvs());

describe("mediaUrl", () => {
  it("resolves relative keys and removes duplicate bucket prefixes", async () => {
    expect(await resolve("profile/photo.png")).toBe("https://lasdpc.icmc.usp.br/media/profile/photo.png");
    expect(await resolve("/lasdpc-media/lasdpc-media/profile/photo.png", "https://lasdpc.icmc.usp.br/media///"))
      .toBe("https://lasdpc.icmc.usp.br/media/profile/photo.png");
  });

  it("rewrites only unsigned legacy local profile URLs", async () => {
    expect(await resolve("http://localhost:9000/lasdpc-media/profile/photo.png"))
      .toBe("https://lasdpc.icmc.usp.br/media/profile/photo.png");
    expect(await resolve("http://127.0.0.1:9000/lasdpc-media/profile/photo.png"))
      .toBe("https://lasdpc.icmc.usp.br/media/profile/photo.png");
    const signed = "http://localhost:9000/lasdpc-media/profile/photo.png?X-Amz-Signature=abc";
    expect(await resolve(signed)).toBe(signed);
    const other = "http://localhost:9000/lasdpc-media/markdown/private.png";
    expect(await resolve(other)).toBe(other);
  });

  it("preserves external URLs and existing media formats", async () => {
    expect(await resolve("https://images.example.org/photo.png")).toBe("https://images.example.org/photo.png");
    expect(await resolve("data:image/png;base64,abc")).toBe("data:image/png;base64,abc");
    expect(await resolve("/uploads/photo.png")).toBe("/uploads/photo.png");
    expect(await resolve("/media/profile/photo.png")).toBe("/media/profile/photo.png");
    expect(await resolve("banner/cover.png")).toBe("https://lasdpc.icmc.usp.br/media/banner/cover.png");
    expect(await resolve(null)).toBeUndefined();
    expect(await resolve(undefined)).toBeUndefined();
  });
});
