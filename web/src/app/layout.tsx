// Byline: Grok · grok-4.6 · 2026-08-18
// Self-hosted SIL OFL fonts. No Google Fonts CDN.
import "@fontsource/playfair-display/400.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import type { ReactNode } from "react";
import { TerminalShell } from "@/components/TerminalShell";
import "./globals.css";

export const metadata = {
  title: "Legal Workspace",
  description: "Matter command center for the Genesee custody case.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <TerminalShell>{children}</TerminalShell>
      </body>
    </html>
  );
}
