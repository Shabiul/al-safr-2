"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { randomUUID } from "node:crypto";
import { writeContent } from "@/lib/content";
import { uploadMedia } from "@/lib/storage";
import { collection, fromDraft, type Draft } from "@/lib/content-schema";
import { checkLogin, COOKIE, requireAdmin, sessionCookie } from "@/lib/admin-auth";
import { createLead, deleteLead, getLead, STAGE_LABEL, STAGES, updateLead, type Stage } from "@/lib/crm";

const text = (f: FormData, k: string, max: number) => String(f.get(k) ?? "").trim().slice(0, max);
const done = () => revalidatePath("/admin", "layout");

export async function login(_: { error?: string }, f: FormData): Promise<{ error?: string }> {
  // ponytail: no lockout after failed attempts; add rate limiting before the CRM is on a public domain
  const staff = await checkLogin(String(f.get("email") ?? ""), String(f.get("password") ?? ""));
  if (!staff) return { error: "Wrong email or password." };
  (await cookies()).set(sessionCookie(staff.id));
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
  redirect("/admin/login");
}

export async function setStage(id: string, stage: Stage) {
  const me = await requireAdmin();
  if (!STAGES.includes(stage)) return;
  const lead = await getLead(id);
  if (!lead || lead.stage === stage) return;
  await updateLead(id, { stage }, `Stage changed to ${STAGE_LABEL[stage]}`, me.name);
  done();
}

export async function addNote(id: string, f: FormData) {
  const me = await requireAdmin();
  const note = text(f, "note", 2000);
  if (note) await updateLead(id, {}, note, me.name);
  done();
}

export async function saveLead(id: string, f: FormData) {
  const me = await requireAdmin();
  const value = Number(f.get("value"));
  const travellers = Math.round(Number(f.get("travellers")));
  await updateLead(
    id,
    {
      name: text(f, "name", 100),
      email: text(f, "email", 200).toLowerCase(),
      phone: text(f, "phone", 40),
      departure: text(f, "departure", 40) || "Flexible",
      ...(travellers >= 1 && travellers <= 50 ? { travellers } : {}),
      ...(value >= 0 ? { value } : {}),
    },
    "Details updated",
    me.name,
  );
  done();
}

export async function removeLead(id: string) {
  await requireAdmin();
  await deleteLead(id);
  done();
  redirect("/admin/leads");
}

export async function addLead(f: FormData) {
  const me = await requireAdmin();
  const name = text(f, "name", 100);
  const email = text(f, "email", 200).toLowerCase();
  if (!name || !email) return;
  const travellers = Math.min(50, Math.max(1, Math.round(Number(f.get("travellers")) || 1)));
  const value = Number(f.get("value"));
  const lead = await createLead({
    name,
    email,
    phone: text(f, "phone", 40),
    source: "Added by team",
    packageSlug: text(f, "package", 120) || null,
    departure: text(f, "departure", 40) || "Flexible",
    travellers,
    notes: text(f, "notes", 2000),
    ...(value > 0 ? { value } : {}),
  }, me.name);
  done();
  redirect(`/admin/leads/${lead.id}`);
}

/* ---------- website content ---------- */

export async function saveCollection(key: string, drafts: Draft[]): Promise<{ ok: boolean; error?: string }> {
  const me = await requireAdmin();
  const c = collection(key);
  if (!c) return { ok: false, error: "Unknown section" };
  try {
    const items = drafts.map((d, i) => fromDraft(c.fields, d, `${c.single ? c.title : `#${i + 1} ${String(d[c.titleKey] || "")}`}`.trim()));
    if (key === "packages") {
      const slugs = new Set<string>();
      for (const p of items) {
        const slug = String(p.slug);
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error(`${p.title}: URL slug must be lower-case letters, numbers and dashes`);
        if (slugs.has(slug)) throw new Error(`Two packages use the slug "${slug}"`);
        slugs.add(slug);
        // the site's cards and enquiry form assume at least one stop and one date
        if (!(p.route as unknown[]).length) throw new Error(`${p.title}: add at least one route stop`);
        if (!(p.departures as unknown[]).length) throw new Error(`${p.title}: add at least one departure date`);
      }
    }
    await writeContent(c.key, (c.single ? items[0] : items) as never, me.name);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  updateTag("content");
  done();
  return { ok: true };
}

const MAX_UPLOAD = 8 * 1024 * 1024;
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "image/gif": "gif" };

export async function uploadImage(f: FormData): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  const file = f.get("file");
  if (!(file instanceof File) || !file.size) return { error: "Choose an image first." };
  const ext = EXT[file.type];
  if (!ext) return { error: "Use a JPG, PNG, WebP, AVIF or GIF image." }; // no SVG: it can carry scripts
  if (file.size > MAX_UPLOAD) return { error: "Images must be under 8 MB." };
  try {
    return { url: await uploadMedia(`${randomUUID()}.${ext}`, Buffer.from(await file.arrayBuffer()), file.type) };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
