"use client";

import { useEffect, useState } from "react";

// Byline: Grok · grok-4.6 · 2026-08-18
// Same-origin owner PDF so Chrome DevTools + F1 can see the document.
// CAT5: pdf.js for view. Collabora / LibreOffice stay sidecar HOLD.

export function PdfPane() {
  const [name, setName] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  return (
    <>
      <p className="section-eyebrow">Contracts</p>
      <h1>Document viewer</h1>
      <p className="dim">
        Open a PDF you produced. Ask / F1 and Chrome DevTools can see this page.
        This is not from the evidence store. In-browser editing and conversion are
        not available yet.
      </p>
      <label>
        Choose a PDF
        <input
          type="file"
          accept="application/pdf,.pdf"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (url) URL.revokeObjectURL(url);
            setName(file.name);
            setUrl(URL.createObjectURL(file));
          }}
        />
      </label>
      {name ? <p className="surface-chip">Open: {name}</p> : null}
      {url ? (
        <iframe
          className="pdf-frame"
          title={name ?? "Owner PDF"}
          src={url}
        />
      ) : (
        <p className="muted">No file open. Pick an owner-produced PDF.</p>
      )}
    </>
  );
}
