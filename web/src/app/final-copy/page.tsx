// Byline amendment: Codex · GPT-5 · 2026-09-12 (Propria semantic token adoption)
import { ReleaseForm } from "@/components/ReleaseForm";
import { legalApiBase } from "@/lib/api/client";

export default async function ReleasePage() {
  let releases: Array<{
    release_id: string;
    content_hash: string;
    state: string;
    cited_assertion_ids: string[];
    omitted_private: string[];
    filed: boolean;
  }> = [];
  let drafts: Array<{ section_id: string; heading: string }> = [];
  let error: string | null = null;
  try {
    const [releaseResponse, draftResponse] = await Promise.all([
      fetch(`${legalApiBase()}/v1/releases`, { cache: "no-store" }),
      fetch(`${legalApiBase()}/v1/drafts`, { cache: "no-store" }),
    ]);
    if (!releaseResponse.ok) throw new Error(`legal-api releases ${releaseResponse.status}`);
    if (!draftResponse.ok) throw new Error(`legal-api drafts ${draftResponse.status}`);
    releases = await releaseResponse.json();
    drafts = await draftResponse.json();
  } catch (exc) {
    error = exc instanceof Error ? exc.message : "legal-api unreachable";
  }

  return (
    <>
      <p style={{ letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
        Final review copy
      </p>
      <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 500 }}>
        Deterministic manifest, not a filing
      </h1>
      <p>
        Strategy, red-team, todos, and review rationale stay out of the payload.
        This is not filed, served, or transmitted.
      </p>
      {error ? <p>{error}</p> : null}
      <ReleaseForm sections={drafts} />
      {releases.length === 0 && !error ? <p>No release candidates yet.</p> : null}
      {releases.map((release) => (
        <article
          key={release.release_id}
          style={{ borderTop: "1px solid var(--border)", padding: "16px 0" }}
        >
          <strong>
            [{release.state}] {release.content_hash}
          </strong>
          <p>
            Assertions: {release.cited_assertion_ids.length} · filed=
            {String(release.filed)}
          </p>
          <p style={{ color: "var(--text-muted)" }}>
            omitted: {release.omitted_private.join(", ")}
          </p>
        </article>
      ))}
    </>
  );
}
