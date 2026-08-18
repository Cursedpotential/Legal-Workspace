import { CitationParse } from "@/components/CitationParse";

// Byline: Grok · grok-4.6 · 2026-08-18

export default function CitationsPage() {
  return (
    <>
      <p className="section-eyebrow">Research</p>
      <h1 className="legal">Citations</h1>
      <p>
        Validate and normalize citation structure. This does not Shepardize.
        CourtListener is not a citator.
      </p>
      <CitationParse />
    </>
  );
}
