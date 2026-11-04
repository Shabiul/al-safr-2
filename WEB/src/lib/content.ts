// Server-side content store (alsafr.content in Supabase: one JSON value per section).
// Pages read it through a cache; a CRM save invalidates the "content" tag so static pages rebuild on the next visit.
// Sections never saved from the CRM fall back to the defaults in src/data/*.
import { cacheTag } from "next/cache";
import { sql } from "./db";
import { DEFAULT_CONTENT, derive, type Content } from "./content-shared";

async function read(): Promise<Content> {
  const rows = await sql<{ key: keyof Content; value: unknown }[]>`select key, value from alsafr.content`;
  return { ...DEFAULT_CONTENT, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) };
}

export async function getContent(): Promise<Content> {
  "use cache";
  cacheTag("content");
  return read();
}

export const getSite = async () => derive(await getContent());

/** uncached, for the editor (always shows what is stored) */
export const readContent = read;

export async function writeContent<K extends keyof Content>(key: K, value: Content[K], by?: string) {
  await sql`
    insert into alsafr.content (key, value, updated_by) values (${key}, ${sql.json(value as never)}, ${by ?? null})
    on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = excluded.updated_by`;
}
