// Byline: Grok · grok-4.6 · 2026-08-18
// Catalog matches Cat 2 / legal-terminal groups: Assistant, Research, Contracts, Drafting, Operations.

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
    label: "Discovery",
    help: "Discovery, missing evidence, exhibits, research questions.",
  },
  Motions: {
    label: "Motions",
    help: "Brief Builder, review, release candidate, filing checklist.",
  },
  Hearing: {
    label: "Hearing Prep",
    help: "Docket Watch, timeline, filing checklist.",
  },
  Trial: {
    label: "Trial",
    help: "Exhibits, factors, Brief Builder.",
  },
};

export const SURFACES: Surface[] = [
  { path: "/", label: "Home", group: "Assistant", help: "Matter command center.", icon: "home" },
  { path: "/chat", label: "Paralegal", group: "Assistant", help: "F1. Workbench chat. Not a lawyer.", icon: "message" },
  { path: "/prec", label: "Precedent Search", group: "Research", help: "Search published opinions. Not a citator.", icon: "search" },
  { path: "/stat", label: "Statutes", group: "Research", help: "Michigan statutes and rules pinned for this matter.", icon: "book" },
  { path: "/cite", label: "Citations", group: "Research", help: "Validate citation structure. Does not Shepardize.", icon: "quote" },
  { path: "/rqst", label: "Research questions", group: "Research", help: "Questions still open before you write or file.", icon: "search" },
  { path: "/issue", label: "Issue tree", group: "Research", help: "The legal question, broken into pieces a judge decides.", icon: "scale" },
  { path: "/fctr", label: "Best-interest factors", group: "Research", help: "MCL 722.23 (a)–(l).", icon: "list" },
  { path: "/ctrx", label: "Contract Workbench", group: "Contracts", help: "Analyze, compare, negotiate agreement language.", icon: "file" },
  { path: "/doc", label: "Document Analyzer", group: "Contracts", help: "Owner-produced PDFs. Not Agno evidence.", icon: "file" },
  { path: "/priv", label: "Privilege Check", group: "Contracts", help: "First-pass flags. Not a legal conclusion.", icon: "shield" },
  { path: "/drft", label: "Brief Builder", group: "Drafting", help: "Write the motion. Nothing here is filed until you say so.", icon: "pen" },
  { path: "/tmpl", label: "Motion outlines", group: "Drafting", help: "Starting structure for a paper you may later file.", icon: "file" },
  { path: "/rvw", label: "Owner review", group: "Drafting", help: "Mark what stays, what changes, and what is wrong.", icon: "eye" },
  { path: "/rels", label: "Release candidate", group: "Drafting", help: "Frozen version before treating it as ready to file.", icon: "package" },
  { path: "/file", label: "Filing checklist", group: "Drafting", help: "This screen does not file.", icon: "clipboard" },
  { path: "/jobs", label: "Analysis Queue", group: "Operations", help: "Queued analysis jobs.", icon: "clock" },
  { path: "/wkfl", label: "Workflows", group: "Operations", help: "Playbooks for recurring processes.", icon: "activity" },
  { path: "/autm", label: "Automations", group: "Operations", help: "Scheduled jobs.", icon: "activity" },
  { path: "/trig", label: "Triggers", group: "Operations", help: "Inbound notices.", icon: "mail" },
  { path: "/audt", label: "Audit Log", group: "Operations", help: "What this workspace recorded.", icon: "list" },
  { path: "/live", label: "Integrations", group: "Operations", help: "CourtListener, PACER-off, provider grid.", icon: "activity" },
  { path: "/cal", label: "Docket Watch", group: "Operations", help: "This matter's hearings and deadlines.", icon: "calendar" },
  { path: "/disc", label: "Discovery", group: "Operations", help: "Interrogatories, RFPs, RFAs.", icon: "folder" },
  { path: "/exh", label: "Exhibit list", group: "Operations", help: "Working list. Evidence truth stays in Agno.", icon: "paperclip" },
  { path: "/miss", label: "Missing evidence", group: "Operations", help: "Ask Agno to look.", icon: "help" },
  { path: "/todo", label: "Tasks", group: "Operations", help: "Things only you can do.", icon: "check" },
  { path: "/timl", label: "Timeline", group: "Operations", help: "What happened, in order.", icon: "clock" },
  { path: "/agnt", label: "Agent log", group: "Operations", help: "Routed agent traces.", icon: "activity" },
  { path: "/strat", label: "Private strategy", group: "Drafting", help: "Notes to yourself.", advanced: true, icon: "lock" },
  { path: "/team", label: "Red team", group: "Drafting", help: "Attack your own draft.", advanced: true, icon: "swords" },
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
  Discovery: ["/disc", "/miss", "/exh", "/rqst"],
  Motions: ["/drft", "/rvw", "/rels", "/file", "/fctr"],
  Hearing: ["/cal", "/timl", "/file", "/agnt"],
  Trial: ["/exh", "/fctr", "/drft"],
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
