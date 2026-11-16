// Display settings (appearance, accent colour, seasonal theme, accessibility). Only the CRM changes them
// (Website content -> Display); they apply to the site and the CRM alike as data attributes on <html>.

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

// Shared by the inline boot script (before paint) and anything that needs to re-resolve, so both resolve the same way.
// Season windows: lights 15 Oct–20 Nov, winter Dec–Feb, blossom 15 Mar–30 Apr, summer Jun–Aug.
const RESOLVE = `function(p){var m=new Date(),mo=m.getMonth()+1,d=m.getDate();
var s=p.season==="auto"?((mo===10&&d>=15)||(mo===11&&d<=20)?"lights":mo===12||mo<=2?"winter":(mo===3&&d>=15)||mo===4?"blossom":mo>=6&&mo<=8?"summer":"off"):p.season;
var t=p.mode==="auto"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):p.mode;
var a=[];if(p.large)a.push("large");if(p.contrast)a.push("contrast");if(p.reduce)a.push("reduce");if(p.underline)a.push("underline");
var h=document.documentElement;h.dataset.theme=t;h.dataset.accent=p.accent;h.dataset.season=s;h.dataset.a11y=a.join(" ");}`;

/** inline script for <head>: applies the display settings chosen in the CRM before first paint ("auto" still follows the OS) */
export const themeBoot = (p: Prefs) =>
  `try{var p=${JSON.stringify({ ...DEFAULT_PREFS, ...p })},f=${RESOLVE};f(p);if(p.mode==="auto")matchMedia("(prefers-color-scheme: dark)").addEventListener("change",function(){f(p)})}catch(e){}`;

