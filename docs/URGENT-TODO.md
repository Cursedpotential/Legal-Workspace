# URGENT TODO

> _Byline: Claude Code · Opus 5 · 2026-08-20_
>
> Required by the **LIVE ONLY / SPRINT MODE** policy in `AGENTS.md`.
> Every stub, every known-broken thing, every deferred fix lands here **loudly**.
> A silent stub is a defect. Nothing here is allowed to go quiet.

## How to use

- Any stub you are forced to write gets an inline `# STUB:` / `// STUB:` **and** a row below.
- A stub is only permitted when the real data or upstream service does not exist yet.
- If it is a function, write the whole function. Do not park a placeholder here to avoid work.
- Clear rows the moment the real implementation lands. This list should shrink.

## Open stubs

| # | Item | File / location | Why it is a stub | Blocking on |
|---|------|-----------------|------------------|-------------|
| S1 | `POST /v1/token` returns 501 | `api/legal_workspace/api/main.py` | Token minting was never implemented; callers must bring a Context Forge JWT. Was live and **unmarked** — a silent stub. | Deciding whether Legal-Workspace mints its own tokens or only ever verifies CF-issued ones. |

## Known broken / deferred

| # | Item | Impact | Status |
|---|------|--------|--------|
| B1 | **ContextForge JWT secret on ovh-app is a broken paste.** `CF_JWT_SECRET_KEY`, `JWT_SECRET_KEY` = literal string `set CF_JWT_SECRET_KEY`; `AUTH_ENCRYPTION_SECRET`, `CF_AUTH_ENCRYPTION_SECRET` = literal `set CF_AUTH_ENCRYPTION_SECRET`. Someone pasted the shell command instead of its value. | **SECURITY — HIGH.** CF runs `AUTH_REQUIRED=true` on a trivially guessable signing secret. Every service that trusts a CF JWT is affected. | **AWAITING OWNER RULING.** Not rotated autonomously: rotation invalidates every existing token platform-wide (agentos, librechat, gateway, this app) at once. |
| B2 | ORM ↔ PG schema divergence | All 24 ORM tables are flat names in the default schema (`legal_core_matter_ref`); `sql/0001_legal_os_bootstrap.sql` creates schema-qualified tables (`legal_core.matter_ref`) with an older column set (missing `issue_tree`, `factor_matrix`, `last_agno_verify`). Additionally `db/store.py:69` calls `create_all(get_engine(store_dir=...))`, and `engine.py:27` makes a non-null `store_dir` force the **SQLite** branch — so PG tables are never created even with `DATABASE_URL` set. | **OPEN.** VPS deploy ships on SQLite in a bind mount instead. Wiring PG is the next increment and must be verified against the live PG18, not assumed. |
| B3 | `legal_os_app` role has no password | `sql/0001` does `CREATE ROLE legal_os_app LOGIN` with no password; `compose.yaml` previously used `change-me`. Role and `legal%` schemas do **not** exist on the live cluster — bootstrap has never been applied. | **OPEN**, follows B2. |
| B4 | Local dev SQLite is 13 columns behind the ORM | `data/workspace/legal.sqlite` predates several model changes; `create_all()` cannot add columns to existing tables. Causes 500s on `legal_core_matter_ref.last_agno_verify`. Dev artifact only. | **OPEN.** Rebuild the dev DB from the ORM; it holds seeded mock rows that must never become canonical. |
| B5 | ~~`pypdf` / `python-docx` undeclared~~ | — | **NOT A DEFECT** (checked 2026-08-21): both are declared in `pyproject.toml` (`python-docx>=1.1,<2`, `pypdf>=5,<7`). Entry kept so the false claim does not get re-raised. |
| B6 | `web/package-lock.json` deleted, not regenerated | `deploy/Dockerfile.web` uses `npm install` (not `npm ci`), so builds succeed but are **not reproducible** — dependency drift between builds is silent. | **OPEN.** |
| B7 | ~~`Host ovh-app` in `~/.ssh/config` has no `HostName`~~ | ~~The alias cannot connect~~ | **RESOLVED 2026-08-21.** The block was missing `HostName` *and* had the wrong user (`root`; ovh-app authenticates as `debian`). Both fixed in `~/.ssh/config`; verified live — `ssh ovh-app hostname` returns `ovh-app`. |
| B8 | `legal-postgres` service removed from `compose.yaml` | The `agno-postgres:18-duckdb` image does not exist on ovh-app, and `DEPLOYMENT_PLAN.md` rejects a second cluster for production. Removed rather than shipped broken; prior file preserved at `_stale/compose.yaml.pre-vps-2026-08-21`. | **RESOLVED** by B2 landing. |
| B9 | ovh-app has **no `DOCKER-USER` rules and inactive ufw**, so every Coolify app that publishes on `0.0.0.0` is reachable from the public internet (`40.160.5.19`). Found 2026-08-21 when `legal-api` answered `200` on `/health` from the open internet. | Legal-Workspace is fixed (both ports rebound to the tailnet IP, commit `26a1aeb`), but this is **fleet-wide** — other apps on this host are very likely still 0.0.0.0-published. | Audit every app's `ports:` on ovh-app and decide: per-app tailnet binding (what Legal-Workspace does) vs. a host-wide `DOCKER-USER` default-deny. Host-wide iptables on a box running 25 apps is not a same-turn change — owner call. |
