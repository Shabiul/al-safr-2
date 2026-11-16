"use client";

import { useSyncExternalStore } from "react";
import type { Theme } from "./theme-boot";

export * from "./theme-boot";

const subscribe = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-season", "data-a11y"] });
  return () => mo.disconnect();
};

/** the theme actually showing (Auto resolved) */
export const useTheme = () =>
  useSyncExternalStore(subscribe, () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light") as Theme, () => "light" as Theme);

/** whether the CRM turned on "reduce motion" */
export const useReduceMotion = () => useSyncExternalStore(subscribe, () => (document.documentElement.dataset.a11y ?? "").includes("reduce"), () => false);
