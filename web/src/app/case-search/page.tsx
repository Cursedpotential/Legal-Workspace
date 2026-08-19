import { SourceSearch } from "@/components/SourceSearch";

// Byline: Grok · grok-4.6 · 2026-08-18

export default function PrecedentSearchPage() {
  return (
    <>
      <p className="section-eyebrow">Research</p>
      <h1 className="legal">Case search</h1>
      <p>
        Search published opinions. CourtListener identity hits only. This is
        not a citator and does not Shepardize.
      </p>
      <p className="muted">Examples: Vodvarka Michigan custody · MCL 722.23 established custodial environment</p>
      <SourceSearch />
      <p>
        <a href="/citation-check">Citation check</a>
        {" · "}
        <a href="/drafts">Motion writer</a>
      </p>
    </>
  );
}
