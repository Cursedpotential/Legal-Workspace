# One working Advocatio surface, aligned for convergence

Owner direction, 2026-09-20: use one current version and get it working; preserve
the previously planned stack and design alignment so the surfaces can merge later.
The Basic/Advanced selector is deferred. The separate Family Court Toolbox is
not Advocatio's basic view. Do not substitute it for the selected mockups.

## Existing plan remains the implementation contract

Read `../STACK.md`, `../LANGUAGE-CONVERGENCE.md`, `../PHASES.frontend.md` and
`../SPLIT.md`. The original stack decision references are preserved in
`../inputs/stack/STACK-RECOVERY.md`, including owner messages from September 12.
TanStack, Storybook, Glide and Tauri's desktop role are settled. React/TypeScript
with Vite and Router/Query is the recorded migration baseline; exact versions and
the current shared client's dependencies must be reconciled before adopting them.

The existing Next application is a migration source and temporary serving layer.
Recover its current functionality without adding new framework-specific domain
logic. Preserve server-held credentials and auth boundaries when moving browser
components. Keep Python legal-domain services behind shared typed contracts;
no blanket engine rewrite or duplicate evidence authority is authorized.

## Current bounded work

1. Verify current backend tests and frontend build; recover the route/auth map.
2. Repair deployed-source drift so the existing same-origin API bridge and pinned
   Propria design package actually reach the user.
3. Correct the assistant form's reference to the absent `/api/assistant` handler;
   use the implemented `/api/chat` and handle failed/non-JSON responses visibly.
4. Verify named-service pages and API reads after deployment. Test draft write and
   reopen behavior against isolated synthetic stores, not the owner's live case.
5. Carry the same API/auth/source contracts into the first shared-client parity
   slice: source search, versioned detail and inspector. Use Storybook states for
   loading, denied, stale, missing and partial support, followed by browser proof.

## Findings that constrain deployment

- Live September 15 deployment uses `9fb80c9`; the later committed auth/BFF and
  shared-design work at `d3f6b35` was not deployed.
- Before repair, `/` returns HTML 200 but says the legal API is not running;
  `/api/legal/health`, `/api/legal/v1/matter` and `/api/legal/v1/drafts` return 404.
- The private API is healthy. Its direct named-service matter read returns 401;
  fix the signed application bridge rather than disabling authentication.
- Coolify has no configured `LEGAL_BFF_SIGNING_SECRET`. It must be provisioned
  to the web/API pair without entering browser code or published receipts.
- Public Authentik configuration and SSR user-identity propagation require their
  own verified parity work. Tailnet owner operation does not prove public login.
- A live SQLite backup was taken before bring-up; integrity check passed.
  No evidence import or database schema migration is part of this correction.

Current receipts: `E-baseline.md` and `F0-route-parity.md`. Final deployment and
browser results will be recorded separately; this plan is not deployment proof.
