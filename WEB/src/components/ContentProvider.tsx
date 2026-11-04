"use client";

import { createContext, use, useMemo } from "react";
import { derive, type Content, type Site } from "@/lib/content-shared";

const Ctx = createContext<Site | null>(null);

/** hands the CRM-edited content (loaded on the server) to every client component on the site */
export default function ContentProvider({ content, children }: { content: Content; children: React.ReactNode }) {
  const site = useMemo(() => derive(content), [content]);
  return <Ctx value={site}>{children}</Ctx>;
}

export function useSite() {
  const site = use(Ctx);
  if (!site) throw new Error("useSite must be used inside <ContentProvider>");
  return site;
}
