import { TemplateForm } from "@/components/TemplateForm";
import { legalApiBase } from "@/lib/api/client";

export default async function TemplatePage() {
  let templates: Array<{
    template_id: string;
    title: string;
    kind: string;
    governing_authority: string;
    notes: string;
    official_form_url: string | null;
    outline: string[];
  }> = [];
  let error: string | null = null;
  try {
    const response = await fetch(`${legalApiBase()}/v1/templates`, { cache: "no-store" });
    if (!response.ok) throw new Error(`legal-api templates ${response.status}`);
    templates = await response.json();
  } catch (exc) {
    error = exc instanceof Error ? exc.message : "legal-api unreachable";
  }

  return (
    <>
      <p style={{ letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a8476" }}>
        Motion outlines
      </p>
      <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 500 }}>
        Not official forms. Not filing-ready.
      </h1>
      <p>
        Genesee postjudgment posture only. Dates, docket, and judge stay blank.
        Official SCAO PDFs stay on the court site.
      </p>
      {error ? <p>{error}</p> : null}
      <TemplateForm templates={templates} />
      {templates.map((template) => (
        <article
          key={template.template_id}
          style={{ borderTop: "1px solid #2a2e38", padding: "16px 0" }}
        >
          <strong>
            [{template.kind}] {template.title}
          </strong>
          <p>{template.governing_authority}</p>
          <p style={{ color: "#8a8476" }}>{template.notes}</p>
          <ol>
            {template.outline.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </article>
      ))}
    </>
  );
}
