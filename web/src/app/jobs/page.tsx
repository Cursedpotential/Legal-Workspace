import { legalApiBase } from "@/lib/api/client";

// Byline: Grok · grok-4.6 · 2026-08-18

export default async function AnalysisQueuePage() {
  let jobs: Array<{ id: string; next_run_time: string | null; trigger: string }> = [];
  let error: string | null = null;
  try {
    const response = await fetch(`${legalApiBase()}/v1/automations/jobs`, { cache: "no-store" });
    if (!response.ok) throw new Error(`legal-api jobs ${response.status}`);
    jobs = await response.json();
  } catch (exc) {
    error = exc instanceof Error ? exc.message : "legal-api unreachable";
  }

  return (
    <>
      <p className="section-eyebrow">Operations</p>
      <h1 className="legal">Analysis Queue</h1>
      <p>Queued analysis jobs. Enable, last-run, and run-now live on Automations.</p>
      {error ? <p className="unsupported">{error}</p> : null}
      {jobs.length === 0 && !error ? <p className="muted">No jobs queued.</p> : null}
      <table className="work-sheet">
        <thead>
          <tr>
            <th>Job</th>
            <th>Next run</th>
            <th>Schedule</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <td>{job.id}</td>
              <td>{job.next_run_time ?? "—"}</td>
              <td>{job.trigger}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        <a href="/autm">Automations</a>
      </p>
    </>
  );
}
