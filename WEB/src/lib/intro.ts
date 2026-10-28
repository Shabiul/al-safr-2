"use client";

import { useSyncExternalStore } from "react";

// one-shot flag: flips to true when the preloader finishes, never resets
let done = false;
const listeners = new Set<() => void>();

export function finishIntro() {
  done = true;
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useIntroDone = () =>
  useSyncExternalStore(subscribe, () => done, () => false);
