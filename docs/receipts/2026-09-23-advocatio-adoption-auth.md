# Advocatio adoption-auth change receipt

**Date:** 2026-09-23
**Repository:** `E:/AI_Workspace/Projects/Propria/modules/Legal-desktop`
**Base:** `master@2c6c0007ed6328d94ad4f7b2cc9bec222317c1af`
**Status:** recovery implementation verified locally on `wip/advocatio-adoption-auth-20260923`; deployment pending integration

## Reproduction

- `POST /v1/reviews` authenticates the request globally but discards
  `request.state.auth`; it forwards only the caller-controlled `ReviewCreate`.
- `Workspace.add_review` authorizes a consequential decision solely with
  `created.reviewer == "owner"`, then persists the supplied string as the actor.
- The same middleware admits Authentik humans, signed BFF requests, the MCP
  gateway service token, direct-tailnet access, and the explicit test bypass.
  Therefore a service/agent-facing credential can submit `reviewer: "owner"`.
- `Workspace.import_package` persists an accepted package without comparing its
  matter to the workspace matter. The consumer also accepts an arbitrary manifest
  hash and schema version. These are package-consumer gaps, not producer proof.
- `Workspace.home` is GET-backed and may persist a first-remote-matter projection.
  This receipt does not authorize changing that separate projection flow unless a
  focused compatibility test proves it is the same adoption mutation.

## Claimed files

- `api/legal_workspace/api/auth.py` — classify the already-authenticated principal
  for action authorization without weakening JWT issuer/audience/signature/lifetime.
- `api/legal_workspace/api/main.py` — bind review/adoption to `request.state.auth`;
  keep package import available to authenticated producer/service delivery.
- `api/legal_workspace/services/workspace.py` — enforce local matter and supported
  package identity/digest/version before import; derive the review actor from the
  verified eligible-human principal passed by the route; deny before state writes.
- `api/legal_workspace/services/source_package.py` and/or
  `api/legal_workspace/contracts/source_package.py` only if the existing consumer
  validation cannot express the required package digest/version checks locally.
- `tests/test_review_release.py` and `tests/test_source_package.py` (or one new
  focused adoption-auth test module) — human/service/agent/forged-body and exact
  package/matter/digest/version positive/negative coverage, including state equality
  after every denial.
- This receipt, updated with the exact diff, tests, and rollback after verification.

No root/shared manifests, D08 producer code, shared schema, migration, credentials,
deployment, or unrelated files are claimed.

## Intended invariant

Package delivery may make a validated exact package available, including through an
authenticated service identity. Availability never means reliance, legal adoption,
approval, release, filing, service, or transmission. Consequential review/adoption
requires an eligible authenticated human principal. The recorded actor is derived
from that principal and never from `reviewer` in the request body. Service, gateway,
BFF, bypass, and agent identities fail closed for this action. Denial occurs before
any workspace, event, review, or work-product mutation.

JWT verification continues to require Authentik RS256 signature, issuer, audience,
`exp`, `iat`, and `sub`. Package import continues to require approved items and will
add consumer-side local matter, supported schema version, package ID, manifest
SHA-256, item version, and content SHA-256 validation without claiming D08 producer
signature or promotion completeness.

## Planned proof

1. Reproduce the forged `reviewer: "owner"` acceptance with a service identity.
2. Add eligible-human positive coverage and service/agent/BFF/body-forgery denials.
3. Add wrong matter, package linkage, manifest digest, schema/item version denials.
4. Snapshot serialized workspace state and event-log bytes before each denied action
   and prove they are unchanged afterward.
5. Run focused auth/package/review tests, then the relevant Python suite.
6. Inspect and commit only the claimed tracked paths; do not push.

## Checkpoint — stopped for Probata/Intake P0

**Stopped:** 2026-09-23 07:51 EDT
**Status:** partial, uncommitted, not deployed
**Byline:** Codex · GPT-5 · independent verification checkpoint

The owner reprioritized Probata and Intake to P0. All Legal-desktop mutation,
testing, staging, commit, push, deployment, and credential work stopped. No
application file was changed by the independent verification pass. The existing
application/test diff and pre-existing `.cnf/` directory remain preserved.

Verification completed before the stop:

- Confirmed Git root `E:/AI_Workspace/Projects/Propria/modules/Legal-desktop`,
  branch `master`, base/remote head `2c6c000`.
- Read the repository `AGENTS.md`, this receipt, the safe-operations skill, and
  the handoff protocol. Literal D01/D09 packet paths were not found in the
  repository, Propria tree, or synced ChatGPT project sources; exact paths remain
  required before resumption.
- `git diff --check` reported no whitespace errors (only Git's existing
  LF-to-CRLF worktree warnings).
- Direct interpreter proof: `.venv/Scripts/python.exe`, Python 3.14.6,
  pytest 8.4.2. This avoids treating a broken `uv` trampoline as a test failure.
- Focused command: `python -m pytest -q tests/test_auth.py
  tests/test_source_package.py tests/test_review_release.py
  tests/test_first_slice.py tests/test_draft_edit.py`.
- Result: **22 passed, 8 failed, 1 warning**. One failure is an isolation/schema
  problem: the new auth test touches the global workspace and encounters the
  pre-existing SQLite schema missing `legal_core_matter_ref.last_agno_verify`.
  Seven failures are test-proof defects: model dumps regenerate timestamped
  structural defaults, so they do not prove denied calls changed persisted
  bytes. These are not evidence that the denial path wrote state.

Unresolved correctness risks:

- The stopped diff does not implement the receipt's promised consumer-side
  package import checks. `Workspace.import_package` still accepts an approved-item
  package without first rejecting a wrong local matter, unsupported schema,
  malformed/nil package identity, malformed manifest SHA-256, invalid assertion
  version, or malformed item content SHA-256.
- The denied-call tests must snapshot the actual persistence/event files (and
  the SQLite store where applicable), not compare unstable reconstructed models.
- The Authentik-human positive HTTP test must use an isolated temporary
  `Workspace`; it must not read or mutate the developer's real workspace store.
- The current actor gate correctly rejects non-Authentik sources before review
  writes and derives the stored actor from the Authentik subject, but the full
  focused suite is red and this has not been accepted as release proof.
- No broader suite, Ruff run, commit, push, deployment, or live verification was
  performed. D08 producer schema/signature/promotion and release remain HOLD.

Resume by locating and reading the exact D01/D09 packets, isolating the HTTP
test workspace, replacing model comparisons with persistence-byte snapshots,
implementing only the bounded consumer validation above, then rerunning focused
and broader Python tests. Do not stage or commit until every required test passes.

## Recovery implementation and verification — 2026-09-23

**Byline:** Codex · GPT-6 · adoption-auth recovery lane
**Base:** `master@2c6c0007ed6328d94ad4f7b2cc9bec222317c1af`
**Review branch:** `wip/advocatio-adoption-auth-20260923`

The original ten-file diff was preserved and reviewed against D01's interim
security checkpoint and D09's static reconciliation, receipts, and handoff under
`E:/AI_Workspace/Projects/Propria/.reconciliation/2026-09-23-orchestration-input/agents/`.
D01 requires a verified human action principal. D09 separates package delivery
from legal adoption and identifies the forged-body review gate. The current
branch binds review to an Authentik principal in the configured review group,
derives the persisted reviewer from its subject, and keeps service, agent,
signed-BFF, tailnet, and test-bypass identities ineligible for review. The
caller-provided `reviewer` field is compatibility input only.

The consumer now checks local matter equality, schema `1.0`, non-nil package
UUID, 64-hex SHA-256 manifest and item content-hash syntax, and positive
assertion versions before an import write. A package with no approved items
returns a blocked result without appending a debug event. The import route
maps consumer validation errors to HTTP 409; malformed UUID input is rejected
by request validation with HTTP 422. This is envelope validation only: the
current producer contract does not provide a verified signature or canonical
manifest recomputation algorithm here, and this branch does not claim either.

**Changed paths:** `api/legal_workspace/api/{auth,main}.py`,
`api/legal_workspace/config.py`, `api/legal_workspace/domain/review.py`,
`api/legal_workspace/services/{source_package,workspace}.py`, and
`tests/{test_api,test_auth,test_draft_edit,test_exhibits,test_filing,test_first_slice,test_persist,test_review_release,test_source_package}.py`.
No D08 producer, shared schema, portal, Authentik, Tailscale-services, or
deployment surface changed. The pre-existing `.cnf/` tree and this receipt's
backup were untouched.

**Verification:** the focused auth/package/review/first-slice/edit suite passed
with 36 tests after recovery; the expanded focused set passed with 45 tests.
The full `.venv/Scripts/python.exe -m pytest -q` run passed with **177 passed,
1 xfailed, 1 pytest-asyncio deprecation warning**. Negative tests compare the
actual SQLite/debug/event file bytes before and after denied operations, while
the authenticated HTTP tests use an isolated temporary workspace. Scoped mypy
on `auth.py`, `source_package.py`, and `review.py` reported no issues. A broader
mypy run found three existing errors at unchanged `workspace.py` lines 215,
696, and 1181. Default Ruff on touched files remains red on existing import
ordering, scheduler exception handlers, deferred router imports, and long
lines; the newly added validation and tests pass behavior checks. `git diff
--check` reported no whitespace errors. These local tests do not prove a live
deployment, producer signature, manifest integrity, source bytes, revocation
propagation, or release readiness.

**Deployment source and rollback:** the checked-in deployment history records
the Coolify `legal-workspace` application as sourced from GitHub `master`;
the current live configuration was not independently read back. The review
branch is not an accepted deployment target, so no deployment is performed.
After integration, a faulty commit can be reverted on the owning branch with
an ordinary `git revert` and redeployed from its configured source; no reset,
force push, or deletion is required. The earlier "do not push" checkpoint was
superseded by the owner's later explicit push authorization for this lane.
