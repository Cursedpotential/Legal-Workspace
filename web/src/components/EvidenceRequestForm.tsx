// Byline amendment: Codex · GPT-5 · 2026-09-12 (Propria semantic token adoption)
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { legalApiBase } from "@/lib/api/client";

export function EvidenceRequestForm() {
  const router = useRouter();
  const [kind, setKind] = useState("rfp");
  const [text, setText] = useState("");
  const [purpose, setPurpose] = useState("");
  const [linkedIssue, setLinkedIssue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`${legalApiBase()}/v1/discovery`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind,
          text,
          purpose,
          linked_issue: linkedIssue,
        }),
      });
      if (!response.ok) throw new Error(`discovery ${response.status}`);
      setText("");
      setPurpose("");
      setLinkedIssue("");
      router.refresh();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "discovery failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      style={{ display: "grid", gap: 10, margin: "16px 0 32px" }}
    >
      <label>
        Kind
        <select
          value={kind}
          onChange={(event) => setKind(event.target.value)}
          style={{ display: "block", width: "100%", marginTop: 4 }}
        >
          <option value="rfp">rfp</option>
          <option value="interrogatory">interrogatory</option>
          <option value="rfa">rfa</option>
          <option value="subpoena">subpoena</option>
        </select>
      </label>
      <label>
        Request text
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          required
          rows={3}
          style={{ display: "block", width: "100%", marginTop: 4 }}
        />
      </label>
      <label>
        Purpose
        <input
          value={purpose}
          onChange={(event) => setPurpose(event.target.value)}
          required
          style={{ display: "block", width: "100%", marginTop: 4 }}
        />
      </label>
      <label>
        Linked issue / element
        <input
          value={linkedIssue}
          onChange={(event) => setLinkedIssue(event.target.value)}
          required
          style={{ display: "block", width: "100%", marginTop: 4 }}
        />
      </label>
      {error ? <p style={{ color: "var(--status-warn)" }}>{error}</p> : null}
      <button type="submit" disabled={busy || !text.trim()}>
        {busy ? "Saving…" : "Add discovery request"}
      </button>
    </form>
  );
}
