// Byline: Claude Code · Fable 5.1 · 2026-09-21
import { FileTools } from "@/components/FileTools";

export default function FileToolsPage() {
  return (
    <>
      <p className="section-eyebrow">Contracts</p>
      <p className="muted">File tools</p>
      <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 500 }}>
        Metadata, original timestamps, screenshot text, PDF conversion.
      </h1>
      <p>
        Pick one file or a whole series. Reading never changes a file and uploads are not kept. To order
        screenshots of one conversation, select them all (add any Google Takeout <code>.json</code> sidecars
        beside them) and use <em>Put images in time order</em>.
      </p>
      <p style={{ color: "var(--text-muted)" }}>
        court_safe=false · A resolved time is a lead with a named source, not a finding. Conversions and scrubbed
        copies are work product, never evidence originals.
      </p>
      <FileTools />
    </>
  );
}
