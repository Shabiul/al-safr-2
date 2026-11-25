// Server-only CRM store: enquiries from the site become leads that move through a sales pipeline.
// Backed by the alsafr schema in Supabase Postgres (see db/schema.sql).
import { sql } from "./db";
import { readContent } from "./content";
import type { Lead, LeadInput } from "./crm-shared";

export * from "./crm-shared";

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// activity comes back as JSON, newest first
const withActivity = () => sql`
  select l.*, coalesce((
    select json_agg(json_build_object('at', a.at, 'text', a.text, 'staffName', a.staff_name) order by a.at desc, a.id desc)
    from alsafr.lead_activity a where a.lead_id = l.id
  ), '[]') as activity,
  coalesce((
    select array_agg(c.code || case when c.discount <> '' then ' (' || c.discount || ')' else '' end || ' on ' || c.used_on order by c.created_at)
    from alsafr.coupon_uses c where c.lead_id = l.id
  ), '{}') as coupons
  from alsafr.leads l`;

export const listLeads = async () => [...(await sql<Lead[]>`${withActivity()} order by l.created_at desc`)];

export async function getLead(id: string) {
  if (!UUID.test(id)) return null;
  const [lead] = await sql<Lead[]>`${withActivity()} where l.id = ${id}`;
  return lead ?? null;
}

export async function createLead(input: LeadInput, staffName?: string) {
  const { packages } = await readContent();
  const pkg = input.packageSlug ? packages.find((p) => p.slug === input.packageSlug) : undefined;
  const row = {
    name: input.name,
    email: input.email,
    phone: input.phone,
    source: input.source,
    packageSlug: pkg?.slug ?? null,
    packageTitle: pkg ? `${pkg.title}, ${pkg.country}` : null,
    departure: input.departure,
    travellers: input.travellers,
    // price comes from our catalogue, never from the visitor's browser
    value: input.value ?? (pkg ? pkg.price * input.travellers : 0),
    notes: input.notes,
  };
  const text = input.source === "Added by team" ? "Lead added by the team" : `Request received from the website (${input.source})`;
  const [lead] = await sql<{ id: string }[]>`
    with l as (insert into alsafr.leads ${sql(row)} returning id)
    insert into alsafr.lead_activity (lead_id, text, staff_name) select id, ${text}, ${staffName ?? null} from l
    returning lead_id as id`;
  if (input.coupon) {
    const k = input.coupon;
    await sql`insert into alsafr.coupon_uses ${sql({ leadId: lead.id, code: k.code, discount: k.discount, usedOn: k.usedOn, packageSlug: row.packageSlug, packageTitle: row.packageTitle })}`;
  }
  return lead;
}

type Patch = Partial<Pick<Lead, "name" | "email" | "phone" | "departure" | "travellers" | "value" | "stage">>;

export async function updateLead(id: string, patch: Patch, note?: string, staffName?: string) {
  if (!UUID.test(id)) return;
  const keys = Object.keys(patch) as (keyof Patch)[];
  if (keys.length) await sql`update alsafr.leads set ${sql(patch, keys)}, updated_at = now() where id = ${id}`;
  if (note) await sql`insert into alsafr.lead_activity (lead_id, text, staff_name) values (${id}, ${note}, ${staffName ?? null})`;
}

export async function deleteLead(id: string) {
  if (UUID.test(id)) await sql`delete from alsafr.leads where id = ${id}`;
}
