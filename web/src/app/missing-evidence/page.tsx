// Byline amendment: Codex · GPT-5 · 2026-09-12 (Propria semantic token adoption)
// Byline: Grok · grok-4.6 · 2026-08-18
import { InvestigationForm } from "@/components/InvestigationForm";
import { legalApiBase } from "@/lib/api/client";

export default async function MissingProofPage() {
  let requests: Array<{
    request_id: string;
    kind: string;
    needed: string;
    why: string;
    linked_issue: string;
    factor_letter: string | null;
    contradiction: string;
    status: string;
    court_safe: boolean;
    event_type: string;
  }> = [];
  let error: string | null = null;
  try {
    const response = await fetch(`${legalApiBase()}/v1/investigations`, { cache: "no-store" });
    if (!response.ok) throw new Error(`legal-api investigations ${response.status}`);
    requests = await response.json();
  } catch (exc) {
    error = exc instanceof Error ? exc.message : "legal-api unreachable";
  }

  return (
    <>
      <p style={{ letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
        Missing evidence
      </p>
      <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 500 }}>
        Missing proof goes back to Agno
      </h1>
      <p>
        This is not a second evidence store and not a docket. Name the gap.
        Do not invent a hearing date or an established fact. court_safe=false.
      </p>
      {error ? <p>{error}</p> : null}
      <InvestigationForm />
      {requests.length === 0 && !error ? <p>No investigation requests yet.</p> : null}
      {requests.map((item) => (
        <article
          key={item.request_id}
          style={{ borderTop: "1px solid var(--border)", padding: "16px 0" }}
        >
          <strong>
            [{item.status}] {item.kind}
          </strong>
          <p>{item.needed}</p>
          <p style={{ color: "var(--text-muted)" }}>
            {item.why}
            {item.linked_issue ? ` · ${item.linked_issue}` : ""}
            {item.factor_letter ? ` · factor (${item.factor_letter})` : ""}
          </p>
          {item.contradiction ? <p>Contradiction: {item.contradiction}</p> : null}
          <p style={{ color: "var(--text-muted)" }}>
            {item.event_type} · court_safe={String(item.court_safe)}
          </p>
        </article>
      ))}
    </>
  );
}
