// Byline: Grok · grok-4.6 · 2026-08-18
import { IssueAdd } from "@/components/IssueAdd";
import { fetchIssueTree, type IssueNode } from "@/lib/api/client";

function IssueBranch({ node, depth = 0 }: { node: IssueNode; depth?: number }) {
  return (
    <article
      style={{
        marginLeft: depth ? 20 : 0,
        borderTop: "1px solid #2a2e38",
        padding: "16px 0",
      }}
    >
      <strong>{node.title}</strong>
      <div style={{ color: "#8a8476", fontSize: 13 }}>{node.governing_authority}</div>
      {node.elements.length > 0 ? (
        <ul>
          {node.elements.map((element) => (
            <li key={element.element_id ?? element.label}>
              {element.label}
              <span style={{ color: "#8a8476" }}>
                {" "}
                · supporting {element.supporting.length} · contradicting{" "}
                {element.contradicting.length}
              </span>
              {element.missing_proof.length > 0 ? (
                <ul>
                  {element.missing_proof.map((gap) => (
                    <li key={gap}>{gap}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {node.children.map((child) => (
        <IssueBranch key={child.issue_id ?? child.title} node={child} depth={depth + 1} />
      ))}
    </article>
  );
}

export default async function IssuePage() {
  let issue: IssueNode | null = null;
  let error: string | null = null;
  try {
    issue = await fetchIssueTree();
  } catch (exc) {
    error = exc instanceof Error ? exc.message : "legal-api unreachable";
  }

  return (
    <>
      <p className="section-eyebrow">Research</p>
      <h1 className="legal">Questions the judge decides</h1>
      {error ? <p className="unsupported">{error}</p> : null}
      {issue ? <IssueBranch node={issue} /> : null}
      <IssueAdd parentId={issue?.issue_id ?? ""} />
    </>
  );
}
