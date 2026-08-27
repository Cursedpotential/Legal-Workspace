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
