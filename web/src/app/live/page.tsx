import { ProviderTermsGrid } from "@/components/ProviderTermsGrid";
import { fetchProviders, legalApiBase } from "@/lib/api/client";

// Byline: Grok · grok-4.6 · 2026-08-18

export default async function IntegrationsPage() {
  let sources: Array<{ id: string; display_name?: string; may_cost_money?: boolean }> = [];
  let error: string | null = null;
  let grid = null;
  let gridError: string | null = null;
  try {
    const response = await fetch(`${legalApiBase()}/v1/sources`, { cache: "no-store" });
    if (!response.ok) throw new Error(`legal-api sources ${response.status}`);
    sources = await response.json();
  } catch (exc) {
    error = exc instanceof Error ? exc.message : "legal-api unreachable";
  }
  try {
    grid = await fetchProviders();
  } catch (exc) {
    gridError = exc instanceof Error ? exc.message : "legal-api providers unreachable";
  }

  return (
    <>
      <p className="section-eyebrow">Operations</p>
      <h1 className="legal">Integrations</h1>
      <p className="unsupported">
        PACER is off. PACER charges per page. Do not turn it on from this
        screen.
      </p>
      {error ? <p className="unsupported">{error}</p> : null}
      {sources.map((source) => (
        <article key={source.id} className="surface-card">
          <h2>{source.display_name ?? source.id}</h2>
          <p className="muted">
            {source.id}
            {source.may_cost_money ? " · may cost money" : " · no per-page fee listed"}
          </p>
        </article>
      ))}
      <ProviderTermsGrid grid={grid} error={gridError} />
    </>
  );
}
