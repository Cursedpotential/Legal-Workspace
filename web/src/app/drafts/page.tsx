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
          style={{ borderTop: "1px solid #2a2e38", padding: "16px 0" }}
        >
          <h2>{draft.heading}</h2>
          {draft.unsupported ? (
            <p style={{ color: "#c9a227" }}>UNSUPPORTED</p>
          ) : null}
          <DraftEditor
            sectionId={draft.section_id}
            heading={draft.heading}
            body={draft.body}
          />
          <p style={{ color: "#8a8476" }}>
            Factor ({draft.factor_letter}) · {draft.citation_count} citations
            {draft.support ? ` · unsupported paragraphs: ${draft.support.unsupported_count}` : ""}
          </p>
          {draft.support
            ? draft.support.paragraphs.map((paragraph) => (
                <p
                  key={paragraph.index}
                  style={{
                    color: paragraph.state === "unsupported" ? "#c9a227" : "#8a8476",
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
