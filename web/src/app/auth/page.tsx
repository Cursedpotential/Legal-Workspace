import { redirect } from "next/navigation";

// Byline: Grok · grok-4.6 · 2026-08-18
// Old invented path. Catalog page is Statutes.

export default function AuthRedirectPage() {
  redirect("/stat");
}
