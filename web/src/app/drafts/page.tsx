// Byline amendment: Codex · GPT-5 · 2026-09-12 (Propria semantic token adoption)
import { DraftEditor } from "@/components/DraftEditor";
import { fetchDrafts } from "@/lib/api/client";

export default async function DraftPage() {
  let drafts: Awaited<ReturnType<typeof fetchDrafts>> = [];
  let error: string | null = null;
  try {
    drafts = await fetchDrafts();
  } catch (exc) {
    error = exc instanceof Error ? exc.message : "legal-api unreachable";
  }

  return (
    <>
      <p className="section-eyebrow">Drafting</p>
      <h1 className="legal">Motion writer</h1>
      <p>
        Write the motion here. Released sections fork a new draft instead of
        rewriting history. UNSUPPORTED means the citation gate failed.
      </p>
      {error ? <p>{error}</p> : null}
      {drafts.length === 0 && !error ? (
        <p>No draft sections yet. Import a package, link a factor citation, then POST /v1/drafts.</p>
      ) : null}
      {drafts.map((draft) => (
        <article
          key={draft.section_id}
          style={{ borderTop: "1px solid var(--border)", padding: "16px 0" }}
        >
          <h2>{draft.heading}</h2>
          {draft.unsupported ? (
            <p style={{ color: "var(--status-warn)" }}>UNSUPPORTED</p>
          ) : null}
          <DraftEditor
            sectionId={draft.section_id}
            heading={draft.heading}
            body={draft.body}
          />
          <p style={{ color: "var(--text-muted)" }}>
            Factor ({draft.factor_letter}) · {draft.citation_count} citations
            {draft.support ? ` · unsupported paragraphs: ${draft.support.unsupported_count}` : ""}
          </p>
          {draft.support
            ? draft.support.paragraphs.map((paragraph) => (
                <p
                  key={paragraph.index}
                  style={{
                    color: paragraph.state === "unsupported" ? "var(--status-warn)" : "var(--text-muted)",
                    fontSize: 13,
                  }}
                >
                  [{paragraph.state}] {paragraph.text}
                </p>
              ))
            : null}
        </article>
      ))}
    </>
  );
}
