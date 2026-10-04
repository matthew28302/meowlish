# Tests

First automated test infra for the repo (Vitest unit + Playwright smoke).

## Requirements

- Dev server already running at `http://localhost:3000` (E2E never starts its own server).
- Demo account `demo / 123456` seeded in the DB.
- Test runners are installed in `node_modules` via `npm install --no-save`
  (keeps `package.json` untouched):
  `npm install --no-save --legacy-peer-deps vitest@3.2.4 @playwright/test@1.63.0`

## Run

- Unit (all green, 34 tests): `npx vitest run` (or `npm test`)
- E2E smoke (3 specs, chromium): `npx playwright test` (or `npm run test:e2e`)
- Types must stay clean: `npx tsc --noEmit` (expect 0 errors)

## Where to add new tests

- `tests/unit/*.test.ts` — pure logic only (no browser/DB):
  `dictionary` (lookupWord), `learning-paths` (LEARNING_PATHS integrity),
  `vocabulary` (VOCABULARY_LIST schema), `theme` (getPreferredTheme with
  localStorage mock), `pet-quiz` (generateRacingQuestion / generatePvPQuestion).
  Seed RNG with `vi.spyOn(Math, 'random')` wherever shuffling is involved,
  and name the entry id in schema assertion messages.
- `tests/e2e/*.spec.ts` — critical flows on the real dev server + demo account:
  `home` (landing, zero console/page errors), `login` (demo via UI),
  `vocabulary` (17 filter groups + filtering). Selectors: Vietnamese labels
  via `getByText`/`getByRole`, never generated class names. Unauthenticated
  routes render the Welcome landing (AppShell gate) — log in through the
  one-click demo button before asserting protected pages.
