# TOIA-2026 — working conventions

## Test-Driven Development (required)

This repo follows TDD. For any behavioral change:

1. **Write the test first.** Add or extend a test that captures the desired
   behavior and watch it fail for the right reason.
2. **Make it pass** with the smallest change that satisfies the test.
3. **Refactor** with the test as a safety net.

Applies to bug fixes too: reproduce with a failing test before fixing.

### Where tests live & how to run them

- **Frontend** (`interface/`): [Vitest](https://vitest.dev) + Testing Library.
  Tests sit next to the code as `*.test.ts` / `*.test.tsx`.
  - Run once: `npm test` (in `interface/`)
  - Watch: `npm run test:watch`
  - Production type-check/build excludes test files; type errors in tests
    surface through Vitest, not `npm run build`.
- **Backend** (`backend/api/`): ExUnit. `mix test` (needs Elixir + the MySQL
  test DB; runs in CI — see `.github/workflows/ci.yml`).

### Browser-API code

Logic that depends on browser-only APIs (MediaRecorder, Web Speech, etc.)
should keep its pure/derivable parts in small, separately tested helpers so the
untestable shell stays thin.

## Project layout

- `interface/` — Vite + React 18 + TypeScript + Tailwind SPA (the user-facing app)
- `backend/api/` — Phoenix (Elixir) JSON API
- `backend/q_api/`, `backend/toia-dm/` — Python services (question API, dialogue manager)
