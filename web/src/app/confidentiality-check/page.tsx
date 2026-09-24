// Byline amendment: Codex · GPT-5 · 2026-09-12 (Propria semantic token adoption)
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
      <p className="section-eyebrow">Documents and drafting</p>
      <h1 className="legal">Confidentiality check</h1>
      <p>Scan for sensitive information in a draft or pasted text.</p>
      {error ? <p>{error}</p> : null}
      <PrivilegeScanForm drafts={drafts} />
      <ProviderTermsGrid grid={grid} error={gridError} />
    </>
  );
}
