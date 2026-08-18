import { PlaybookRun } from "@/components/PlaybookRun";
import { legalApiBase } from "@/lib/api/client";

// Byline: Grok · grok-4.6 · 2026-08-18

export default async function WorkflowsPage() {
  let playbooks: Array<{
    playbook_id: string;
    title: string;
    steps: string[];
    note?: string;
  }> = [];
  let error: string | null = null;
  try {
    const response = await fetch(`${legalApiBase()}/v1/automations/playbooks`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`legal-api playbooks ${response.status}`);
    playbooks = await response.json();
  } catch (exc) {
    error = exc instanceof Error ? exc.message : "legal-api unreachable";
  }

  return (
    <>
      <p className="section-eyebrow">Operations</p>
      <h1 className="legal">Workflows</h1>
      <p>Playbooks for recurring processes. Labels only. No hearing date is invented.</p>
      {error ? <p className="unsupported">{error}</p> : null}
      <PlaybookRun playbooks={playbooks} />
    </>
  );
}
