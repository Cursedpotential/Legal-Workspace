import type { ProviderGrid } from "@/lib/api/client";
import { ConfidentialFlag } from "@/components/ConfidentialFlag";

// Byline: Grok · grok-4.6 · 2026-08-18

export function ProviderTermsGrid({
  grid,
  error,
}: {
  grid: ProviderGrid | null;
  error: string | null;
}) {
  return (
    <section className="surface-card">
      <p className="section-eyebrow">Provider terms grid</p>
      <h2>Cited snapshot. Not a privilege legal conclusion.</h2>
      <ConfidentialFlag />
      <p className="dim">
        PACER={String(grid?.pacer ?? false)} · local_ollama_as_trust_posture=
        {String(grid?.local_ollama_as_trust_posture ?? false)} · court_safe=
        {String(grid?.court_safe ?? false)}
      </p>
      <p className="muted">{grid?.disclaimer ?? "Grid unavailable."}</p>
      {error ? <p>{error}</p> : null}
      {grid ? (
        <table className="provider-grid">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Role</th>
              <th>Train</th>
              <th>Retain</th>
              <th>Confidential-eligible</th>
              <th>Use</th>
            </tr>
          </thead>
          <tbody>
            {grid.rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <strong>{row.display_name}</strong>
                  <div className="muted">{row.id}</div>
                </td>
                <td>{row.role}</td>
                <td>{row.train ? "assume yes" : "no"}</td>
                <td>{row.retain}</td>
                <td className={row.confidential_eligible ? "eligible" : "blocked"}>
                  {row.confidential_eligible ? "yes" : "no"}
                </td>
                <td>{row.use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}
