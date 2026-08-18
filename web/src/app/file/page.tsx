import { legalApiBase } from "@/lib/api/client";

export default async function FilingPage() {
  let report: {
    ready: boolean;
    filed: boolean;
    blocking_count: number;
    checks: Array<{
      check_id: string;
      label: string;
      state: string;
      reason: string;
      human: boolean;
    }>;
  } | null = null;
  let error: string | null = null;
  try {
    const response = await fetch(`${legalApiBase()}/v1/filing-readiness`, { cache: "no-store" });
    if (!response.ok) throw new Error(`legal-api filing ${response.status}`);
    report = await response.json();
  } catch (exc) {
    error = exc instanceof Error ? exc.message : "legal-api unreachable";
  }

  return (
    <>
      <p style={{ letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a8476" }}>
        Filing checklist
      </p>
      <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 500 }}>
        This screen cannot file or serve
      </h1>
      <p>
        A green checklist is not a filing. Agents cannot mark anything filed.
      </p>
      {error ? <p>{error}</p> : null}
      {report ? (
        <>
          <p>
            Ready: {String(report.ready)} · Filed: {String(report.filed)} ·
            Blocking: {report.blocking_count}
          </p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {report.checks.map((check) => (
              <li
                key={check.check_id}
                style={{ borderTop: "1px solid #2a2e38", padding: "12px 0" }}
              >
                <strong>
                  [{check.state}] {check.label}
                </strong>
                <div style={{ color: "#8a8476" }}>
                  {check.reason}
                  {check.human ? " · owner verification required" : ""}
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}
