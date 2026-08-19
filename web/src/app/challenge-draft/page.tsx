import { legalApiBase } from "@/lib/api/client";

export default async function RedTeamPage() {
  let runs: Array<{
    run_id: string;
    lens: string;
    target_type: string;
    prompt_or_notes: string;
    court_safe: boolean;
    findings: Array<{ claim: string; severity: string }>;
  }> = [];
  let error: string | null = null;
  try {
    const response = await fetch(`${legalApiBase()}/v1/redteam`, { cache: "no-store" });
    if (!response.ok) throw new Error(`legal-api redteam ${response.status}`);
    runs = await response.json();
  } catch (exc) {
    error = exc instanceof Error ? exc.message : "legal-api unreachable";
  }

  return (
    <>
      <p style={{ letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a8476" }}>
        Devil's advocate review
      </p>
      <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 500 }}>
        Attack the draft before the other side does
      </h1>
      <p>
        Lenses: opposing counsel, neutral judge, FOC/referee, adverse
        authority, missing proof. Results are private evaluations, not
        findings of fact.
      </p>
      {error ? <p>{error}</p> : null}
      {runs.length === 0 && !error ? <p>No red-team runs stored yet.</p> : null}
      {runs.map((run) => (
        <article key={run.run_id} style={{ borderTop: "1px solid #2a2e38", padding: "16px 0" }}>
          <strong>
            {run.lens} → {run.target_type}
          </strong>
          <p>{run.prompt_or_notes}</p>
          <ul>
            {run.findings.map((finding) => (
              <li key={finding.claim}>
                [{finding.severity}] {finding.claim}
              </li>
            ))}
          </ul>
          <p style={{ color: "#8a8476" }}>court_safe={String(run.court_safe)}</p>
        </article>
      ))}
    </>
  );
}
