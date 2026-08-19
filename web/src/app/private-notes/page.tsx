import { legalApiBase } from "@/lib/api/client";

async function fetchStrategy() {
  const response = await fetch(`${legalApiBase()}/v1/strategy`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`legal-api strategy ${response.status}`);
  }
  return response.json() as Promise<
    Array<{
      note_id: string;
      kind: string;
      title: string;
      body: string;
      disclosure: string;
      court_safe: boolean;
    }>
  >;
}

export default async function StrategyPage() {
  let notes: Awaited<ReturnType<typeof fetchStrategy>> = [];
  let error: string | null = null;
  try {
    notes = await fetchStrategy();
  } catch (exc) {
    error = exc instanceof Error ? exc.message : "legal-api unreachable";
  }

  return (
    <>
      <p style={{ letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a8476" }}>
        My private notes
      </p>
      <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 500 }}>
        Theories, directions, scratch
      </h1>
      <p>
        This store is not evidence, not authority, and not court-safe. Nothing
        here is exportable to a filing package.
      </p>
      {error ? <p>{error}</p> : null}
      {notes.length === 0 && !error ? <p>No strategy notes yet.</p> : null}
      {notes.map((note) => (
        <article
          key={note.note_id}
          style={{ borderTop: "1px solid #2a2e38", padding: "16px 0" }}
        >
          <strong>
            [{note.kind}] {note.title}
          </strong>
          <p>{note.body}</p>
          <p style={{ color: "#8a8476" }}>
            {note.disclosure} · court_safe={String(note.court_safe)}
          </p>
        </article>
      ))}
    </>
  );
}
