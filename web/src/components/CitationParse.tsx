"use client";

import { useState } from "react";
import { legalApiBase } from "@/lib/api/client";

// Byline: Grok · grok-4.6 · 2026-08-18
// Citations: validate / normalize / verify-integrity. eyecite is structure only.

type Parsed = {
  raw: string;
  normalized: string;
  reporter: string | null;
  volume: string | null;
  page: string | null;
  year: string | null;
  court: string | null;
  validated: boolean;
  known_reporter: boolean;
  is_citator_verified: boolean;
};

type Tab = "validate" | "normalize" | "verify";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "validate", label: "Validate" },
  { id: "normalize", label: "Normalize" },
  { id: "verify", label: "Verify integrity" },
];

export function CitationParse() {
  const [tab, setTab] = useState<Tab>("validate");
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Parsed[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function parse() {
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`${legalApiBase()}/v1/citations:parse`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const body = (await response.json()) as {
        citations?: Parsed[];
        detail?: string;
        is_citator_verified?: boolean;
      };
      if (!response.ok) {
        setError(typeof body.detail === "string" ? body.detail : `parse ${response.status}`);
        setRows([]);
        return;
      }
      setRows(body.citations ?? []);
      setHistory((prev) => [text.trim(), ...prev.filter((item) => item !== text.trim())].slice(0, 8));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "parse failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="tab-row" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? "tab-btn active" : "tab-btn"}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void parse();
        }}
        style={{ display: "grid", gap: 8, margin: "12px 0" }}
      >
        <label>
          Citation text
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={4}
            placeholder="Vodvarka v Grasmeyer, 259 Mich App 499 (2003)"
          />
        </label>
        <button type="submit" disabled={busy || !text.trim()}>
          {busy ? "Reading…" : "Read citation"}
        </button>
      </form>
      {error ? <p className="unsupported">{error}</p> : null}
      {tab === "validate" ? (
        <p className="muted">
          Valid here means the parser recognized a reporter and page. It is not
          a holding check.
        </p>
      ) : null}
      {tab === "normalize" ? (
        <p className="muted">Normalized string is the cleaned citation text only.</p>
      ) : null}
      {tab === "verify" ? (
        <p className="muted">
          Verify integrity is a snapshot + currentness pin. This is not
          Shepardizing. CourtListener is not a citator.
        </p>
      ) : null}
      {rows.map((row) => (
        <article key={`${row.raw}-${row.normalized}`} style={{ borderTop: "1px solid var(--border)", padding: "10px 0" }}>
          <strong>{tab === "normalize" ? row.normalized : row.raw}</strong>
          <p className="dim">
            {row.volume} {row.reporter} {row.page}
            {row.year ? ` (${row.year})` : ""}
            {row.court ? ` · ${row.court}` : ""}
          </p>
          <p className="muted">
            recognized={String(row.validated)} · citator={String(row.is_citator_verified)}
          </p>
        </article>
      ))}
      {history.length ? (
        <>
          <h2>This session</h2>
          <ul>
            {history.map((item) => (
              <li key={item}>
                <button type="button" onClick={() => setText(item)}>
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
