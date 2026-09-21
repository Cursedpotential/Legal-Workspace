// Byline: Claude Code · Kimi K2.7 · 2026-08-18
// Catalog matches Cat 2 / legal-terminal groups: Assistant, Research, Contracts, Drafting, Operations.
// All paths and labels are plain English — no legal abbreviations or jargon.

export type Surface = {
  path: string;
  label: string;
  group: string;
  help?: string;
  advanced?: boolean;
  icon?: string;
};

export const CASE_PHASE_KEY = "lw-case-phase";

export const CASE_PHASES = ["Discovery", "Motions", "Hearing", "Trial"] as const;

export type CasePhase = (typeof CASE_PHASES)[number];

export const PHASE_COPY: Record<CasePhase, { label: string; help: string }> = {
  Discovery: {
    label: "Information gathering",
    help: "Evidence requests, missing evidence, evidence list, open questions.",
  },
  Motions: {
    label: "Written requests to the court",
    help: "Motion writer, your review, final review copy, filing readiness checklist.",
  },
  Hearing: {
    label: "Hearing prep",
    help: "Court dates, timeline, filing readiness checklist.",
  },
  Trial: {
    label: "Trial prep",
    help: "Evidence list, custody factors, motion writer.",
  },
};

export const SURFACES: Surface[] = [
  { path: "/", label: "Case dashboard", group: "Assistant", help: "Overview of your case.", icon: "home" },
  { path: "/assistant", label: "Ask the assistant", group: "Assistant", help: "Ask the assistant. This is not legal advice and is not filed with the court.", icon: "message" },
  { path: "/case-search", label: "Case search", group: "Research", help: "Search published court decisions. This does not check whether a case is still good law.", icon: "search" },
  { path: "/laws", label: "Laws", group: "Research", help: "Michigan laws that matter for this case.", icon: "book" },
  { path: "/citation-check", label: "Citation check", group: "Research", help: "Check that a citation is formatted correctly. This does not verify whether the case is still valid.", icon: "quote" },
  { path: "/open-questions", label: "Open questions", group: "Research", help: "Questions that need answers before you write or file anything.", icon: "search" },
  { path: "/questions", label: "Questions the judge decides", group: "Research", help: "The legal question, broken into pieces a judge decides.", icon: "scale" },
  { path: "/custody-factors", label: "What the judge must consider", group: "Research", help: "The 12 things Michigan law says the judge must weigh.", icon: "list" },
  { path: "/agreements", label: "Agreement review", group: "Contracts", help: "Review, compare, and mark up agreement language.", icon: "file" },
  { path: "/documents", label: "Document viewer", group: "Contracts", help: "Open a PDF you produced. This does not open evidence from the evidence store.", icon: "file" },
  { path: "/confidentiality-check", label: "Confidentiality check", group: "Contracts", help: "First-pass scan for words that might be private or protected. This is not a legal decision.", icon: "shield" },
  { path: "/drafts", label: "Motion writer", group: "Drafting", help: "Write the paper you may later file. Nothing here is filed until you say so.", icon: "pen" },
  { path: "/templates", label: "Starting templates", group: "Drafting", help: "Starting structure for a paper you may later file.", icon: "file" },
  { path: "/review", label: "Your review", group: "Drafting", help: "Mark what stays, what changes, and what is wrong.", icon: "eye" },
  { path: "/final-copy", label: "Final review copy", group: "Drafting", help: "A frozen copy to review before you treat it as ready to file.", icon: "package" },
  { path: "/filing-checklist", label: "Filing readiness checklist", group: "Drafting", help: "What still has to be true before you walk a paper to the clerk. This screen does not file.", icon: "clipboard" },
  { path: "/analysis-queue", label: "Analysis queue", group: "Operations", help: "Queued analysis jobs.", icon: "clock" },
  { path: "/playbooks", label: "Playbooks", group: "Operations", help: "Playbooks for recurring processes.", icon: "activity" },
  { path: "/scheduled-jobs", label: "Scheduled jobs", group: "Operations", help: "Scheduled jobs. Enable, see last run, or run now.", icon: "activity" },
  { path: "/notices", label: "Inbound notices", group: "Operations", help: "Notices this workspace has received.", icon: "mail" },
  { path: "/activity-log", label: "Activity log", group: "Operations", help: "What this workspace recorded.", icon: "list" },
  { path: "/external-sources", label: "External sources", group: "Operations", help: "External sources such as court record search.", icon: "activity" },
  { path: "/calendar", label: "Court dates", group: "Operations", help: "Hearings and deadlines for this case. Confirm with the clerk.", icon: "calendar" },
  { path: "/evidence-requests", label: "Evidence requests", group: "Operations", help: "Written questions and document requests.", icon: "folder" },
  { path: "/evidence", label: "Evidence list", group: "Operations", help: "Working list of items you might show the court.", icon: "paperclip" },
  { path: "/evidence-catalog", label: "Evidence catalog", group: "Operations", help: "Browse the Consignatio catalog: context, pending promotion, promoted evidence. Read only.", icon: "folder" },
  { path: "/missing-evidence", label: "Missing evidence", group: "Operations", help: "Track evidence you still need.", icon: "help" },
  { path: "/tasks", label: "Your tasks", group: "Operations", help: "Things only you can do.", icon: "check" },
  { path: "/timeline", label: "Timeline", group: "Operations", help: "What happened, in order.", icon: "clock" },
  { path: "/assistant-log", label: "Assistant activity log", group: "Operations", help: "Records of what the assistant was asked to do.", icon: "activity" },
  { path: "/private-notes", label: "My private notes", group: "Drafting", help: "Notes to yourself. Not for the other parent, FOC, or the court.", advanced: true, icon: "lock" },
  { path: "/challenge-draft", label: "Devil's advocate review", group: "Drafting", help: "Find weaknesses in your draft before the other side does.", advanced: true, icon: "swords" },
];

export function navLabel(item: Surface): string {
  return item.label.trim();
}

export function navHelp(item: Surface): string {
  return item.help?.trim() || item.label;
}

export function enrichSurface(row: Surface): Surface {
  const local = SURFACES.find((item) => item.path === row.path);
  return {
    ...local,
    ...row,
    label: row.label || local?.label || row.path,
    help: row.help || local?.help || row.label,
    group: row.group || local?.group || "Assistant",
    advanced: row.advanced ?? local?.advanced ?? false,
    icon: row.icon || local?.icon,
  };
}

export function enrichCatalog(rows: Surface[]): Surface[] {
  return rows.map(enrichSurface);
}

let catalog: Surface[] = SURFACES;

export function setSurfaceCatalog(rows: Surface[]): void {
  if (rows.length) catalog = enrichCatalog(rows);
}

export function surfaceCatalog(): Surface[] {
  return catalog;
}

export function pathForQuery(raw: string, rows: Surface[] = catalog): string | null {
  const text = raw.trim().toLowerCase();
  if (!text) return null;
  const byPath = rows.find((item) => item.path.toLowerCase() === text);
  if (byPath) return byPath.path;
  const byLabel = rows.find((item) => {
    const label = item.label.toLowerCase();
    return label === text || label.startsWith(text) || label.includes(text);
  });
  return byLabel?.path ?? null;
}

export function surfaceForPath(pathname: string, rows: Surface[] = catalog): Surface {
  const hit = rows.find((item) => item.path === pathname);
  return hit ?? rows[0] ?? SURFACES[0];
}

export const PHASE_PRIORITY: Record<CasePhase, readonly string[]> = {
  Discovery: ["/evidence-requests", "/missing-evidence", "/evidence", "/open-questions"],
  Motions: ["/drafts", "/review", "/final-copy", "/filing-checklist", "/custody-factors"],
  Hearing: ["/calendar", "/timeline", "/filing-checklist", "/assistant-log"],
  Trial: ["/evidence", "/custody-factors", "/drafts"],
};

export function isCasePhase(value: string | null | undefined): value is CasePhase {
  return CASE_PHASES.some((phase) => phase === value);
}

export function compareSurfacesByPhase(a: Surface, b: Surface, phase: CasePhase): number {
  const order = PHASE_PRIORITY[phase];
  const ai = order.indexOf(a.path);
  const bi = order.indexOf(b.path);
  if (ai === -1 && bi === -1) return 0;
  if (ai === -1) return 1;
  if (bi === -1) return -1;
  return ai - bi;
}

export function surfacesForPhase(phase: CasePhase, rows: Surface[] = catalog): Surface[] {
  return [...rows].sort((a, b) => compareSurfacesByPhase(a, b, phase));
}

export function isPhasePriority(path: string, phase: CasePhase): boolean {
  return PHASE_PRIORITY[phase].includes(path);
}
