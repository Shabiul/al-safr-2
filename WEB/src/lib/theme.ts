"use client";

import { useSyncExternalStore } from "react";

// Display preferences (appearance, accent colour, seasonal theme, accessibility), modelled on the
// Lumi Hospital "Display" panel. Stored per device and applied to <html> as data attributes.

export type Theme = "light" | "dark";
export type Mode = Theme | "auto";
export type Accent = "lagoon" | "oasis" | "ember" | "twilight";
export type Season = "auto" | "off" | "lights" | "winter" | "blossom" | "summer";
export type Prefs = { mode: Mode; accent: Accent; season: Season; large: boolean; contrast: boolean; reduce: boolean; underline: boolean };

export const DEFAULT_PREFS: Prefs = { mode: "light", accent: "lagoon", season: "auto", large: false, contrast: false, reduce: false, underline: false };

export const ACCENTS: { id: Accent; name: string; light: string; dark: string }[] = [
  { id: "lagoon", name: "Lagoon", light: "#0e8fb3", dark: "#5fd4f5" },
  { id: "oasis", name: "Oasis", light: "#12936b", dark: "#4fe0b0" },
  { id: "ember", name: "Desert Ember", light: "#d4541c", dark: "#ff8a5c" },
  { id: "twilight", name: "Twilight", light: "#7a4fd6", dark: "#b69bff" },
];

export const SEASONS: { id: Exclude<Season, "auto" | "off">; name: string }[] = [
  { id: "lights", name: "Festival of Lights" },
  { id: "winter", name: "Winter escapes" },
  { id: "blossom", name: "Cherry blossom" },
  { id: "summer", name: "Summer sun" },
];

const KEY = "alsafr-display";

// Shared by the inline boot script (before paint) and the runtime, so both resolve the same way.
// Season windows: lights 15 Oct–20 Nov, winter Dec–Feb, blossom 15 Mar–30 Apr, summer Jun–Aug.
const RESOLVE = `function(p){var m=new Date(),mo=m.getMonth()+1,d=m.getDate();
var s=p.season==="auto"?((mo===10&&d>=15)||(mo===11&&d<=20)?"lights":mo===12||mo<=2?"winter":(mo===3&&d>=15)||mo===4?"blossom":mo>=6&&mo<=8?"summer":"off"):p.season;
var t=p.mode==="auto"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):p.mode;
var a=[];if(p.large)a.push("large");if(p.contrast)a.push("contrast");if(p.reduce)a.push("reduce");if(p.underline)a.push("underline");
var h=document.documentElement;h.dataset.theme=t;h.dataset.accent=p.accent;h.dataset.season=s;h.dataset.a11y=a.join(" ");}`;

export const THEME_BOOT = `try{var p=Object.assign(${JSON.stringify(DEFAULT_PREFS)},JSON.parse(localStorage.getItem("${KEY}")||"{}"));(${RESOLVE})(p)}catch(e){}`;

// the same resolver string runs inline before React; reuse it rather than duplicate the rules
const apply = new Function("p", `(${RESOLVE})(p)`) as (p: Prefs) => void;

let cache: Prefs | null = null;
const listeners = new Set<() => void>();

export function getPrefs(): Prefs {
  if (cache) return cache;
  try {
    cache = { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    cache = DEFAULT_PREFS;
  }
  return cache!;
}

export function setPrefs(patch: Partial<Prefs>) {
  cache = { ...getPrefs(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {}
  apply(cache);
  listeners.forEach((l) => l());
}

export const resetPrefs = () => setPrefs(DEFAULT_PREFS);

/** keeps "Auto" in step with the OS setting while the page is open */
if (typeof window !== "undefined") {
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => getPrefs().mode === "auto" && setPrefs({}));
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-season"] });
  return () => {
    listeners.delete(cb);
    mo.disconnect();
  };
};

export const usePrefs = () => useSyncExternalStore(subscribe, getPrefs, () => DEFAULT_PREFS);

/** the theme actually showing (Auto resolved) */
export const useTheme = () =>
  useSyncExternalStore(subscribe, () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light") as Theme, () => "light" as Theme);

/** the season actually showing (Automatic resolved by date) */
export const useSeason = () =>
  useSyncExternalStore(subscribe, () => (document.documentElement.dataset.season ?? "off") as Season, () => "off" as Season);

export const setTheme = (t: Theme) => setPrefs({ mode: t });
