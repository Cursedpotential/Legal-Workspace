import { ContractWorkbench } from "@/components/ContractWorkbench";
import { fetchDrafts } from "@/lib/api/client";

// Byline: Grok · grok-4.6 · 2026-08-18

export default async function ContractWorkbenchPage() {
  let drafts: Awaited<ReturnType<typeof fetchDrafts>> = [];
  let error: string | null = null;
  try {
    drafts = await fetchDrafts();
  } catch (exc) {
    error = exc instanceof Error ? exc.message : "legal-api unreachable";
  }

  return (
    <>
      <p className="section-eyebrow">Contracts</p>
      <h1 className="legal">Agreement review</h1>
      <p>
        Review and compare agreement language, parenting plans, and order terms.
      </p>
      {error ? <p className="unsupported">{error}</p> : null}
      <ContractWorkbench
        drafts={drafts.map((item) => ({
          section_id: item.section_id,
          heading: item.heading,
          body: item.body,
        }))}
      />
    </>
  );
}
