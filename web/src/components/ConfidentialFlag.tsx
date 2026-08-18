"use client";

import { useEffect, useState } from "react";

// Byline: Grok · grok-4.6 · 2026-08-18
// Reads the shell toggle key. Does not decide privilege.

export const CONFIDENTIAL_KEY = "lw-confidential";

export function readConfidential(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CONFIDENTIAL_KEY) === "1";
  } catch {
    return false;
  }
}

export function ConfidentialFlag() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(readConfidential());
  }, []);
  return (
    <p className="dim">
      Confidential Mode: {on ? "on" : "off"} · not a privilege legal conclusion
    </p>
  );
}
