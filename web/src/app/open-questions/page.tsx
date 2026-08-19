import { ResearchForm } from "@/components/ResearchForm";
import { legalApiBase } from "@/lib/api/client";

export default async function ResearchPage() {
  let questions: Array<{
    question_id: string;
    question: string;
    plan: string;
    adverse_notes: string;
    uncertainty: string;
    authority_ids: string[];
    status: string;
    jurisdiction: string;
  }> = [];
  let error: string | null = null;
  try {
    const response = await fetch(`${legalApiBase()}/v1/research`, { cache: "no-store" });
    if (!response.ok) throw new Error(`legal-api research ${response.status}`);
    questions = await response.json();
  } catch (exc) {
    error = exc instanceof Error ? exc.message : "legal-api unreachable";
  }

  return (
    <>
      <p style={{ letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a8476" }}>
        Open questions
      </p>
      <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 500 }}>
        Plans, adverse notes, uncertainty
      </h1>
      <p>
        Michigan by default. This is not a citator and not an answer. Do not
        invent holdings or order dates.
      </p>
      {error ? <p>{error}</p> : null}
      <ResearchForm />
      {questions.map((item) => (
        <article
          key={item.question_id}
          style={{ borderTop: "1px solid #2a2e38", padding: "16px 0" }}
        >
          <strong>
            [{item.status}] {item.question}
          </strong>
          <p>{item.plan}</p>
          {item.uncertainty ? <p style={{ color: "#8a8476" }}>{item.uncertainty}</p> : null}
          {item.adverse_notes ? <p>Adverse: {item.adverse_notes}</p> : null}
          <p style={{ color: "#8a8476" }}>
            {item.jurisdiction}
            {item.authority_ids.length ? ` · ${item.authority_ids.join("; ")}` : ""}
          </p>
        </article>
      ))}
    </>
  );
}
