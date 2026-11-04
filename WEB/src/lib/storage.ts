// Supabase Storage over its REST API. Server-only: uses the secret key.
//   alsafr-media      public  — website photos (packages, hero, news), rendered straight on the site
//   alsafr-documents  private — booking paperwork, handed out as 5-minute signed links
const base = () => `${process.env.SUPABASE_URL}/storage/v1`;
const auth = () => ({ apikey: process.env.SUPABASE_SECRET_KEY!, Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}` });

async function put(bucket: string, path: string, body: Buffer, type: string) {
  const r = await fetch(`${base()}/object/${bucket}/${path}`, { method: "POST", headers: { ...auth(), "Content-Type": type, "x-upsert": "false" }, body: new Uint8Array(body) });
  if (!r.ok) throw new Error(`Upload failed (${r.status}): ${await r.text()}`);
}

export async function uploadMedia(path: string, body: Buffer, type: string) {
  await put("alsafr-media", path, body, type);
  return `${base()}/object/public/alsafr-media/${path}`;
}

export const uploadDocument = (path: string, body: Buffer, type: string) => put("alsafr-documents", path, body, type);

export async function documentLink(path: string) {
  const r = await fetch(`${base()}/object/sign/alsafr-documents/${path}`, { method: "POST", headers: { ...auth(), "Content-Type": "application/json" }, body: JSON.stringify({ expiresIn: 300 }) });
  if (!r.ok) throw new Error(`Could not sign link (${r.status})`);
  const { signedURL } = (await r.json()) as { signedURL: string };
  return `${base()}${signedURL}`;
}

export async function removeDocument(path: string) {
  await fetch(`${base()}/object/alsafr-documents`, { method: "DELETE", headers: { ...auth(), "Content-Type": "application/json" }, body: JSON.stringify({ prefixes: [path] }) });
}
