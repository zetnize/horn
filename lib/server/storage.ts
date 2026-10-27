import "server-only";
const bucket = "northia-media";
export function storageConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("STORAGE_NOT_CONFIGURED");
  const parsed = new URL(url);
  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/"
  )
    throw new Error("INVALID_STORAGE_URL");
  return { url: parsed.origin, key };
}
export async function uploadMedia(name: string, bytes: Buffer, mime: string) {
  const { url, key } = storageConfig();
  const result = await fetch(`${url}/storage/v1/object/${bucket}/${name}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": mime,
      "x-upsert": "false",
    },
    body: new Uint8Array(bytes),
    signal: AbortSignal.timeout(15000),
  });
  if (!result.ok) throw new Error("STORAGE_UPLOAD_FAILED");
}
export async function readMedia(name: string) {
  const { url, key } = storageConfig();
  return fetch(`${url}/storage/v1/object/authenticated/${bucket}/${name}`, {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
}
