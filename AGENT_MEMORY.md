
> _Naming (D-138, 2026-09-05; applied 2026-09-06): this product is **advocatio** (formerly Legal-Workspace / Legal Workspace); the evidence platform it consumes is **Indicia Probata** / `probata` (formerly Agno-MCP-Platform). Directory: `probata/modules/advocatio/` (old name kept as a junction). GitHub repo name unchanged pending its own decision. Canon: `probata/docs/NAMING.md`. Historical text below is left verbatim; both names remain valid in recall stores (D-142)._

---
scope: Legal-Workspace
status: current
verified_at: 2026-08-27
superseded_by: null
authority:
  - AGENTS.md
  - docs/LEGAL-WORKSPACE-BUILD-GUIDE-2026-08-17.md
  - docs/DEPLOYMENT_PLAN.md
watches:
  - AGENTS.md
  - docs/LEGAL-WORKSPACE-BUILD-GUIDE-2026-08-17.md
  - docs/DEPLOYMENT_PLAN.md
contains_secrets: false
---

# Legal Workspace Agent Memory

> _Byline: Codex · GPT-5 · 2026-08-27._

- This repository starts after evidence has been reviewed and accepted. It does not ingest, hash,
  normalize, or establish evidence.
- Evidence Platform integration uses versioned `LegalSourcePackage` references and explicit
  investigation requests for missing proof.
- Complete one evidence-linked legal-work-product vertical slice before expanding the surface.
- Strategy, red-team analysis, todos, review rationale, and agent output remain private and
  non-court-safe unless the governed release path says otherwise.
- Persist mutations durably; never rely on process memory for domain state.
- When evidence-platform behavior is in scope, read `../Agno-MCP-Platform/AGENT_MEMORY.md`, but do
  not load or edit that sibling merely because this repository is open.
- Commit Legal Workspace files only from the Legal Workspace Git root with an explicit allowlist.

Add deeper `AGENT_MEMORY.md` or `.agent-memory/<filename>.md` only when durable local context exists.
Use `../Agno-MCP-Platform/docs/agent-memory/README.md` as the shared format contract.

<!-- freshness
watches_hash: 424e82e
last_verified: 2026-08-27
watches:
  - AGENTS.md
  - docs/LEGAL-WORKSPACE-BUILD-GUIDE-2026-08-17.md
  - docs/DEPLOYMENT_PLAN.md
-->
