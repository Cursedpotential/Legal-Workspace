import { PrivilegeScanForm } from "@/components/PrivilegeScanForm";
import { ProviderTermsGrid } from "@/components/ProviderTermsGrid";
import { fetchDrafts, fetchProviders } from "@/lib/api/client";
import type { ProviderGrid } from "@/lib/api/client";

export default async function PrivilegePage() {
  let drafts: Awaited<ReturnType<typeof fetchDrafts>> = [];
  let error: string | null = null;
  let grid: ProviderGrid | null = null;
  let gridError: string | null = null;
  try {
    drafts = await fetchDrafts();
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
      <p className="section-eyebrow">Contracts</p>
      <p className="muted">Confidentiality check</p>
      <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 500 }}>
        Hypothesized markers only. Not a privilege legal conclusion.
      </h1>
      <p>
        Keyword scan. No LLM. Hits are hypothesized markers for
        attorney-client, work product, strategy, medical, and
        child-identifying language. A court decides privilege. AI
        conversations are not attorney-client privileged (
        <em>United States v. Heppner</em>, S.D.N.Y. 2026; ABA Model Rule
        1.6).
      </p>
      <p style={{ color: "#8a8476" }}>
        court_safe=false · Keyword scan does not route. Confidential Mode
        uses the cited provider grid below.
      </p>
      {error ? <p>{error}</p> : null}
      <PrivilegeScanForm drafts={drafts} />
      <ProviderTermsGrid grid={grid} error={gridError} />
    </>
  );
}
