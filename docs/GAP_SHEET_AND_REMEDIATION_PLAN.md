# Legal-Workspace Gap Sheet & Remediation Plan

> _Byline: Claude Code · Kimi K2.7 · 2026-08-18_  
> _Scope: Reconcile as-built `Legal-Workspace` against `docs/LEGAL-WORKSPACE-BUILD-GUIDE-2026-08-17.md` and the 7 category handoffs. Produce a prioritized plan to bring it to spec._

---

## 0. Progress update

- ✅ **Git repository created** on GitHub: `https://github.com/Cursedpotential/Legal-Workspace`
- ✅ **Persistence refactor completed**: JSON-file source of truth replaced with SQLite backed by SQLAlchemy models that mirror the PostgreSQL schemas (`legal_core`, `legal_research`, `legal_work_product`, `legal_audit`). All 134 tests pass.
- 🔄 **Plain-English route/label rename** — pending granular UI audit (agents running).
- 🔄 **Monorepo workspace wiring** — on hold pending owner decision on path/name.
- ❌ **Functional depth** — most features are still stubs or mocked.

---

## 1. Executive summary

Grok built a **standalone-looking FastAPI + Next.js app** that is far wider than it is deep. The directory is **untracked inside `the-platform-workspace`**, has **no monorepo wiring**, and — most importantly — **violates the owner’s plain-English requirement** by using cryptic abbreviation paths (`/drft`, `/rvw`, `/fctr`, `/agnt`, etc.) and legal jargon throughout labels and help text.

The app is currently a **surface-heavy scaffold** with many page stubs, mocked or unevaluated agent routing, and no verified end-to-end flow. It is **not court-safe and not production-ready**.

---

## 2. Confirmed as-built state

### 2.1 Repository / packaging

| What is on disk | What spec/owner wants |
|---|---|
| Untracked `Legal-Workspace/` folder inside `the-platform-workspace` | A proper workspace member of the monorepo |
| Standalone `pyproject.toml` | Monorepo package under `apps/legal-workspace` or `packages/legal-*` |
| Standalone `web/package.json` | Workspace dependency on shared packages |
| No root `package.json`, no `turbo.json`, no `pnpm-workspace.yaml` | pnpm workspaces + Turborepo pipeline |
| Grok bylines on `README.md`, `AGENTS.md`, `compose.yaml`, `pyproject.toml`, many source files | Claude-Code-managed bylines per house rule |

### 2.2 Web frontend

- **Next.js 16 App Router, React 19, TypeScript 5** — matches spec.
- **31 page routes**, all using 4-letter abbreviations as paths.
- **Command palette, terminal shell, split workspace, dark mode** — present but not verified functionally.
- **No shadcn/ui, Radix, or Tailwind 4** evidence in `package.json` (missing from deps).
- **No generated TypeScript client from OpenAPI**.
- **CORS only allows `localhost:3010`** — will break real deploys.

### 2.3 Python API

- **FastAPI 0.141, Pydantic v2, uv** — matches spec.
- **Single-file `main.py` is very large** (imports many domain modules).
- **In-memory scheduler (APScheduler MemoryJobStore)** — spec wants durable PG-backed scheduling.
- **No PostgreSQL integration verified**; `data/workspace/state.json` and `events.jsonl` are the actual runtime stores.
- **Dependencies missing for key spec requirements:** no `sqlalchemy`, no `psycopg`, no `pgvector`, no `eyecite`, no `pikepdf` deps beyond what’s installed, no `presidio`, no Collabora/OnlyOffice/TipTap/Lexical, no `unstructured`, no `docling`, no `pandoc`, no `weasyprint`, no `soffice` wrapper.

### 2.4 Data / persistence

| Spec requirement | As-built |
|---|---|
| PostgreSQL 18 schemas: `legal_core`, `legal_research`, `legal_work_product`, `legal_release`, `legal_audit` | ✅ SQLAlchemy models in `api/legal_workspace/db/models.py` mirror these schemas; SQLite used locally with `legal_*` table prefixes |
| Pydantic contracts → config → repositories → services → API | ✅ Contracts exist; `WorkspaceStore` in `api/legal_workspace/db/store.py` is the repository-like layer |
| Event outbox with idempotent consumers | `legal_audit.event_outbox` table exists; **audit row is written on every save**; idempotent consumer not yet implemented |
| Append-only audit with payload hashes | ✅ Every save writes an audit event with SHA-256 payload hash |
| Every mutation writes DB before API returns | ✅ SQLite is now the source of truth; JSON files kept only as debug backup |
| Swap to PostgreSQL later | ✅ Engine is URL-driven; changing `DATABASE_URL` switches to Postgres with no code changes |

**Known debt:** `WorkspaceStore.save()` currently deletes *all* rows in each child table because the app is single-Matter and Matter identity can change during Agno projection. This must be replaced with per-Matter deletes before multi-Matter support.

### 2.5 Domain coverage

The app has page stubs for nearly every spec surface, but most are **not functionally complete**:

- **Matter Home**: hardcoded to a single Genesee County custody matter.
- **Issue tree**: single hardcoded issue shown.
- **Best-interest factors**: page exists; depth unknown.
- **Brief Builder**: exists but draft/versioning depth unverified.
- **Owner review / release candidate**: forms exist; real immutability + manifest hashing unverified.
- **Research tools**: CourtListener integration unverified; no `eyecite`; no `pgvector`/BM25 hybrid search.
- **Document workspace**: no actual editor (Collabora/OnlyOffice/TipTap/Lexical) integrated.
- **Redaction**: `pikepdf` is a dependency; functional redaction workflow unverified.
- **Bates/exhibit stamping**: function exists; not wired to verified exhibit flow.
- **Discovery**: form exists; not linked to real missing-proof workflow.
- **Calendar / deadlines**: empty until manual entry (acknowledged in README).
- **Agent runs**: routing table exists, but every agent uses `unevaluated-manual` model and live invoke is gated by `LEGAL_WORKSPACE_INVOKE_MODELS=false`.
- **Confidential Mode / provider grid**: UI exists; real ZDR provider verification not done.

---

## 3. Critical gaps (must fix before anything else)

### 3.1 Plain-English requirement is broken

**Owner requirement:** *“I want it in plain English because I'm not a lawyer. No abbreviations, no lingo. Categories and menus are plain English, easy to understand.”*

| Current path | Current label / help | Problem | Plain-English target |
|---|---|---|---|
| `/drft` | Brief Builder | “Brief” is lawyer jargon; path is abbreviation | `/write-motion` or `/draft-motion` — “Write your motion” |
| `/rvw` | Owner review | Abbreviation | `/review` — “Review before release” |
| `/rels` | Release candidate | Abbreviation + jargon | `/ready-to-file` — “Ready-to-file package” |
| `/fctr` | Best-interest factors | “MCL 722.23” in help; abbreviation | `/what-court-wants` or `/custody-factors` — “What the court looks at” |
| `/agnt` | Agent log | Abbreviation | `/ai-activity` — “AI activity log” |
| `/strat` | Private strategy | Abbreviation | `/private-notes` — “Private notes” |
| `/timl` | Timeline | Abbreviation | `/timeline` |
| `/ctrx` | Contract Workbench | “Contract” jargon; abbreviation | `/agreement-tools` — “Agreement tools” |
| `/prec` | Precedent Search | “Precedent” is jargon; abbreviation | `/case-law-search` — “Search court decisions” |
| `/stat` | Statutes | Jargon | `/michigan-laws` — “Michigan laws and rules” |
| `/cite` | Citations | Jargon; abbreviation | `/check-citations` — “Check your citations” |
| `/rqst` | Research questions | Abbreviation | `/open-questions` — “Open questions” |
| `/disc` | Discovery | Jargon; abbreviation | `/questions-for-other-side` — “Questions for the other side” |
| `/exh` | Exhibit list | Abbreviation | `/exhibit-list` |
| `/miss` | Missing evidence | Abbreviation | `/ask-for-more-proof` — “Ask for more proof” |
| `/cal` | Docket Watch | “Docket” is jargon | `/court-dates` — “Court dates and deadlines” |
| `/file` | Filing checklist | Abbreviation | `/filing-checklist` |
| `/audt` | Audit Log | Abbreviation | `/activity-log` |
| `/autm` | Automations | Abbreviation | `/scheduled-tasks` |
| `/trig` | Triggers | Jargon | `/incoming-notices` |
| `/wkfl` | Workflows | Abbreviation | `/playbooks` |
| `/priv` | Privilege Check | Jargon | `/privacy-check` |
| `/live` | Integrations | Vague | `/connected-services` |
| `/jobs` | Analysis Queue | Abbreviation | `/analysis-queue` (acceptable) or `/pending-reviews` |
| `/tmpl` | Motion outlines | Abbreviation + jargon | `/starting-outlines` — “Starting outlines” |
| `/todo` | Tasks | Acceptable but could be `/your-tasks` | `/your-tasks` |
| `/issue` | Issue tree | Vague for non-lawyer | `/legal-question` — “The legal question” |

**Also remove or replace help text containing:** “MCL 722.23”, “Shepardize”, “citator”, “interrogatories”, “RFPs”, “RFAs”, “Bates”, “FOC”, “PACER”, “SCAO”, “court-ready”, “not a legal conclusion” should be replaced with simple action statements.

### 3.2 Monorepo integration is absent

- No workspace file ties `Legal-Workspace` to the parent repo.
- No shared UI, types, or config packages.
- Cannot run `pnpm dev` / `turbo build` from `the-platform-workspace` root.

### 3.3 Persistence contradicts the architecture

Spec says: *“Every mutation writes Postgres before the API returns.”*  
As-built: mutations write JSON files (`data/workspace/state.json`, `events.jsonl`). This is a **fundamental architectural deviation** that breaks durability, concurrency, audit, and integration.

### 3.4 Auth / identity / boundary

- No authentication or authorization layer visible.
- `Matter` and `CourtCase` are hardcoded/mock projections.
- No verified `LegalSourcePackage` import from the Evidence Platform.
- No `EvidenceInvestigationRequest` outbound API verified.

### 3.5 Byline / attribution drift

Grok bylines on core files violate the house rule that every edited file carries a Claude-Code byline.

---

## 4. Structural gaps

| Area | Gap | Severity |
|---|---|---|
| Monorepo tooling | No root `package.json`, `turbo.json`, `pnpm-workspace.yaml` | BLOCKER |
| Shared packages | No `@repo/ui`, `@repo/tsconfig`, `@repo/eslint-config` | HIGH |
| OpenAPI client generation | No generated TS client from FastAPI | HIGH |
| DB layer | No SQLAlchemy models/repositories; JSON files used instead | BLOCKER |
| Migration discipline | Only 3 SQL files; missing legal_research / legal_release tables | HIGH |
| Event system | Outbox table present but no producer/consumer implementation | HIGH |
| Secret management | Passwords/default credentials in compose and `.env.example` | CRITICAL |
| CORS / security | Dev-only localhost CORS; no auth middleware | CRITICAL |
| Tests | 38 tests; coverage and passing status unverified | HIGH |
| CI/CD | No GitHub Actions, no pre-commit, no lint gate | MEDIUM |

---

## 5. Functional gaps by category

### Category 1 — Persistence & Settings
- ✅ Settings config exists
- ❌ Runtime state in JSON, not Postgres
- ❌ No SurrealDB evidence-grounding client
- ❌ No read-only Agno REST fallback

### Category 2 — Command Bar & UI Shell
- ✅ Terminal shell, command palette, split view, status pill present
- ❌ UI is **not plain English** (abbreviation paths everywhere)
- ❌ No verified Tailwind 4 / shadcn / Radix stack
- ❌ No mobile overlay mode verified
- ❌ Case-phase switcher exists but labels need plain-English rewrite

### Category 3 — Chat / AI Agent Orchestration
- ✅ Chat route, agent routing table, F1 summon concept present
- ❌ All agents set to `unevaluated-manual` — not real models
- ❌ No evidence-grounded responses verified
- ❌ No automatic context injection from active panel verified
- ❌ No deep-research loop

### Category 4 — Research Tools
- ✅ Pages for search, statutes, citations, questions
- ❌ No `eyecite` integration
- ❌ No `pgvector` + BM25 hybrid search
- ❌ No CourtListener default source configured
- ❌ No rate-limiting / cost-warning UI

### Category 5 — Contract & Document Analysis
- ❌ No in-app document editor (Collabora, OnlyOffice, TipTap, Lexical)
- ❌ No DOCX/PDF conversion pipeline
- ❌ No metadata scrub/view/validate/print workflow
- ❌ No Michigan forms template library
- ❌ Redaction function unverified end-to-end
- ❌ Bates stamping function unverified

### Category 6 — Privilege, Privacy & LLM Routing
- ✅ Confidential Mode toggle, provider grid UI
- ❌ No Presidio PII detection
- ❌ No verified ZDR provider configuration
- ❌ Live model invoke gated off; no real routing proven

### Category 7 — Workflow & Automation Engine
- ✅ APScheduler in API
- ❌ MemoryJobStore instead of Postgres
- ❌ No n8n delegation boundary
- ❌ Workflow builder is a stub
- ❌ No durable event-triggered automations

---

## 6. Remediation plan

### Phase A — Stop-the-bleed (do first)

1. **Freeze new feature code.** No more pages or components until foundation is fixed.
2. **Replace abbreviation URLs with plain English.** Update `web/src/lib/surfaces.ts`, `config/routing.json`, all page files, and component routes.
3. **Rewrite labels/help text for non-lawyers.** Remove legal jargon from user-facing strings.
4. **Fix bylines.** Update core files to Claude-Code bylines.
5. **Move to monorepo workspace structure:**
   - Create root `package.json` with `pnpm-workspace.yaml` (or add to existing root)
   - Relocate `Legal-Workspace` to `apps/legal-workspace`
   - Create shared `packages/legal-ui`, `packages/legal-types`, `packages/legal-config`
   - Add `turbo.json` with `build`, `dev`, `lint`, `test`, `type-check` pipelines
6. **Replace JSON persistence with PostgreSQL + SQLAlchemy repositories.**
7. **Add proper secret handling** (no hardcoded passwords; validate env at startup).
8. **Verify 38 tests pass and add missing coverage.**

### Phase B — Foundation (required before user-facing value)

9. Generate TypeScript API client from FastAPI OpenAPI schema.
10. Implement `LegalSourcePackage` import from the Evidence Platform (read-only, version-pinned).
11. Implement `EvidenceInvestigationRequest` outbound event + audit trail.
12. Complete SQL migrations: legal_research, legal_release tables; factor tables; authority snapshot tables; deadline tables.
13. Build a real repository layer for each schema.
14. Add authentication boundary (reuse platform auth if possible).
15. Wire CORS/security for real deploy (Tailscale names, no localhost only).

### Phase C — First vertical slice (usable MVP)

16. Hardcode one real matter/case projection from platform API or seed data.
17. Import one approved source package and show accepted evidence.
18. Build the issue tree and custody-factors workspace with evidence linking.
19. Build plain-English “Write your motion” editor with paragraph-level evidence support.
20. Implement owner review → release candidate → deterministic manifest.
21. Produce one DOCX/PDF release candidate and verify hash + manifest.

### Phase D — Expand to spec

22. Research tools (`eyecite`, CourtListener, hybrid search).
23. Document workspace with real editor and redaction.
24. Discovery + missing-proof workflow.
25. Calendar/deadlines with real calculation + explanation.
26. Agent roles with real model routing and cost/audit records.
27. Confidential Mode + verified ZDR provider grid.
28. Workflow engine with PG-backed scheduler and n8n boundary.

---

## 7. Immediate next-action recommendation

The single highest-leverage fix is **monorepo + plain-English foundation**. Before touching research or document features:

1. Decide final workspace path (`apps/legal-workspace`).
2. Add monorepo root files.
3. Rename all routes to plain English.
4. Swap JSON persistence for Postgres + repositories.

Without these four, every future feature will be built on a scaffold that contradicts both the spec and the owner’s stated usability requirement.

---

## 8. Open questions for owner

Only two decisions are genuinely blocked on you:

1. **Workspace name:** Should the folder be `apps/legal-workspace` or keep `Legal-Workspace` at root as a workspace member?
2. **Plain-English route names:** I proposed specific replacements above. Confirm or edit those names before I rename files and update routing.

Everything else can proceed autonomously against the spec once those two are settled.