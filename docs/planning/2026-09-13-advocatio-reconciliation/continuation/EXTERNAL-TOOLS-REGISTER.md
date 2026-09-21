---
title: Outside applications and libraries to integrate — working register
date: 2026-09-20
tags: [advocatio, integration, external-tools, libreoffice, pdf, ocr, register]
status: working
---

# Outside applications and libraries to integrate — working register

> _Byline: Claude Code · Fable 5.1 · 2026-09-20_

Owner order, 2026-09-20 22:55: find the discussions about outside tools and
libraries, list everything that is supposed to be integrated, start integrating.

This file is the status column only. The requirements, rationale and provenance
stay where they were recorded; nothing is restated here.

## Where the discussions are

| Record | What it holds |
|---|---|
| `docs/planning/artifacts/HANDOFF — Category 1…7` (2026-08-17) | The original owner-agreed feature sets. Category 5 is the document/PDF/office list. |
| `docs/reports/CAT1…CAT7-*.md` (2026-08-18) | One researched pick per capability, with licenses. |
| `../inputs/handoffs/HANDOFF-RECOVERY.md` + `rediscovery.json` (2026-09-13) | 35 recovered requirements (`DOC-01…12` are the document tools) and 20 named outside integrations. |
| `../TOOL-CATALOG.md`, `../REDISCUSSION.md` | Catalog and the items still needing a disposition. |
| Codex rollout 2026-09-13 04:11, owner 09:28 | "We are going to be bringing in like LibreOffice… handoffs… a bunch of different resources" — the only owner-typed mention in the Codex lane; it points at the handoffs above. |

Lanes searched: Docstore (advocatio, intake), repository, Codex sessions, Claude
session logs. Not searched: claude.ai web conversations (not on disk).

## Document, PDF and office tools (Category 5)

State is what the code and the running deployment show, not what a plan says.

| ID | Capability | Named tools (pick first) | State 2026-09-20 |
|---|---|---|---|
| DOC-02 | Office ⇄ PDF conversion | **LibreOffice headless** as `legal-renderer` sidecar; unoconv | **Integrated this session** — see receipt below. |
| DOC-09 | Bates / exhibit stamping | pypdf / pikepdf overlay | In code before today: `services/bates.py`, `POST /v1/bates:stamp`. |
| DOC-08 | True redaction | **pikepdf** removal; **Microsoft Presidio** detection | Removal in code (`services/redaction.py`). Presidio detection absent. |
| — | DOCX assembly | **python-docx** | In code (`services/docx_export.py`). |
| DOC-04 | Programmatic PDF form fill | **pypdf**; pdf-lib; pdftk-java | pypdf installed; no fill service or route. |
| DOC-05 | Markdown / JSON → PDF | **WeasyPrint** + **Jinja2**; md-to-pdf; Pandoc; @react-pdf/renderer | Absent. |
| DOC-06 | PDF → Markdown, with OCR | **Docling** (+OCR); marker; unstructured; Tesseract | Absent. Evidence-side extraction belongs to Intake/Probata, not here. |
| DOC-10 | Metadata read / scrub / report | **exiftool** | Absent. (Gotenberg ships exiftool; its metadata routes are now reachable from legal-api.) |
| DOC-03 | PDF viewing + AcroForm fill in browser | **pdf.js**; react-pdf-viewer; pdfme | Absent from `web/package.json`. |
| DOC-01 | In-browser editor with tracked changes | TipTap (v1 pick); **Collabora Online**; **OnlyOffice Docs**; Lexical | Absent. Editor choice is REDISCUSSION decision 1 — owner call. |
| DOC-07 | Treatise / EPUB export | Calibre `ebook-convert`; Pandoc | Absent; recorded as later. |
| DOC-11 | Michigan / Genesee / FOC form library | Official SCAO PDFs | Absent. |
| DOC-12 | Work-product hashes | sha256 into work-product versions | Partly: render results now return a content hash. |

## Other named outside integrations (from `rediscovery.json`)

Timesketch fork · react-calendar-timeline · vis-timeline/vis-data · Evidence.dev ·
Claude Code history viewer · NeoDash · Surrealist · CopilotKit / AG-UI · React Flow ·
Kepler.gl / Leaflet · legal-mcp · legal-terminal (genego-io) · legal-terminal
(JuriSupport) · LexRAG · LIGHT-2 · THEMIS · Suna / Kortix · OpenLegalDataSkills ·
claude-power-skills · custody-guide bundle.
Also in the catalog: Family Law Toolkit (383 capabilities), CourtListener MCP,
eyecite (already wired: `services/eyecite_adapter.py`), FreeEed, KAPE, n8n,
APScheduler (already wired).

None of these was touched today. Their state is whatever `rediscovery.json` records.

## Order of work

1. DOC-02 LibreOffice renderer — done today.
2. DOC-10 metadata and DOC-05 Markdown/JSON → PDF — smallest next steps; both can
   ride the renderer sidecar or plain Python libraries on `legal-api`.
3. DOC-04 form fill + DOC-11 forms, then DOC-03 viewer in the web client.
4. DOC-06 extraction/OCR after the ownership line with Intake is confirmed.
5. DOC-01 editor after the owner picks among the options.

## Choice made today, open to veto

Recorded as: **the `legal-renderer` sidecar is Gotenberg 8.37.0**, an off-the-shelf
container that puts an HTTP API in front of headless LibreOffice. Reason: the
alternative was a hand-written image plus a hand-written HTTP wrapper around
`soffice`. Situation-specific; swapping it is one compose service and one URL.

## Receipt — DOC-02

Verified live 2026-09-21 ~04:00 UTC against `https://legal.tilapia-skilift.ts.net` (commits `97e1370`, `169195d`):

- `legal-renderer` (Gotenberg 8.37.0, no published port) deployed with the app through Coolify.
- A synthetic DOCX posted to `/api/legal/v1/documents:convert` through the real same-origin bridge returned 200; the PDF fetched from `/v1/documents/renders/…` had the same sha256 the API reported, producer `LibreOffice 26.8.0.3`, and the marker text and table content were extractable.
- An unsupported file returned 400. The three probe files were removed from the server afterwards.
- **Bug found and fixed on the way:** the bridge signs percent-encoded paths while the API verified the decoded path, so every colon route (`/v1/bates:stamp`, `/v1/gateway:invoke`, `/v1/events:apply`, …) returned 401 through the bridge. Fixed in `api/auth.py` with a regression test.
- Not done: no web UI calls the route yet; local `tests/test_sqlite_packaging.py` cannot run on this desktop venv (no `pip` module) — unrelated to this change.

## ContextForge registration (owner rule, 2026-09-20 23:07: "every single tool gets registered in ContextForge")

~~Live ContextForge state 2026-09-21: 150 tools, all served through MCP gateways; none from `legal-api`; zero REST-type tools. The conversion route is **not yet registered**. Open owner decision — how workdesk tools are exposed (A: one MCP face + one gateway; B: per-route REST tools).~~

**Decided and done 2026-09-21 01:40 EDT — owner chose A.** Verified live (commit `fd48682`):

- `legal-api` serves an MCP endpoint at `/mcp/` (`api/legal_workspace/api/mcp_face.py`, fastmcp 4, stateless JSON) behind the same auth middleware as the HTTP API.
- New auth lane: bearer `LEGAL_MCP_GATEWAY_TOKEN` (off when unset; value in `~/.secrets/legal-workspace.env` and the Coolify app env, never in git).
- ContextForge gateway `advocatio` → `http://legal-api:8010/mcp/` (service name over the `probata` network), team visibility, status active, reachable.
- Tool `advocatio-convert-office-document-to-pdf` listed in ContextForge and called **through ContextForge's own `/mcp`** with a synthetic DOCX: LibreOffice PDF returned, stored file's sha256 matched the tool result; probe files removed.
- fastapi-mcp was tried first and dropped: no release since 2025-07, breaks on mcp 2.x, and recurses forever on the self-referential issue-tree schema.
- Observed: LibreOffice PDFs are **not byte-deterministic** (same DOCX → different sha256 each run; embedded timestamps). DOC-02 asks for deterministic rendering — open item.

**How every later tool gets registered:** add a `@mcp.tool` function in `mcp_face.py` over the service; after deploy, ContextForge picks it up on gateway refresh. No per-tool registration step.
