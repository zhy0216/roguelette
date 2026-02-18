# E2E Testing with Playwright — Design Document

## Goal

Add Playwright-based e2e tests covering the full game loop of Roguelette (title screen through victory/game over), with deterministic behavior via a seeded PRNG built into the game.

## Part 1: Seeded PRNG Module

### New file: `src/models/rng.ts`

Implement a seeded PRNG using the mulberry32 algorithm (lightweight, good distribution).

**Exports:**

- `seedRng(seed: number): void` — set the global seed, reset PRNG state
- `rng(): number` — drop-in replacement for `Math.random()`, returns `[0, 1)`
- `getSeed(): number | null` — return current seed (for display/debug)

**Seed source:** `localStorage.getItem('seed')`. If present, parse as number and call `seedRng()`. If absent, generate a random seed from `Math.random()` and use that (behavior identical to current game).

This is read once at module initialization time.

### Files to update (replace `Math.random()` → `rng()`)

| File | Usage |
|------|-------|
| `src/models/chamber.ts` | `shuffle()` |
| `src/models/run.ts` | `getPathOptions()`, `getRandomDealerType()` |
| `src/models/items.ts` | `distributeItems()` |
| `src/ui/battle.ts` | `loadNewRound()`, `finishBattle()`, item effects (burner_phone, expired_medicine, adrenaline) |

All other code remains unchanged.

## Part 2: Test Structure

```
playwright.config.ts          — Playwright configuration (root level)
tests/
  e2e/
    helpers/
      seed.ts                 — localStorage seed helpers + known good seed constants
    full-run-victory.spec.ts  — Full run: title → 7 layers → victory screen
    full-run-gameover.spec.ts — Full run: title → battle death → game over screen
```

### Test scenarios

**full-run-victory.spec.ts:**
- Set a known "winning seed" via localStorage before navigating
- Click "Start Game" on title screen
- For each of the 7 layers:
  - Assert map screen shows correct layer number ("地狱第 N 层")
  - Select a path (combat on boss layers, first available otherwise)
  - If combat: play through battle by clicking "shoot opponent" each turn, wait for dealer turns
  - If shop/gamble/rest: interact and return to map
- Assert victory screen appears
- Click return button, assert title screen appears

**full-run-gameover.spec.ts:**
- Set a known "losing seed" via localStorage
- Click "Start Game"
- Play until player dies in battle
- Assert game over screen appears
- Click return button, assert title screen appears

### Seed discovery

After implementing the rng module, discover good seeds by:
1. Writing a small Node script that simulates game logic with different seeds
2. Or manually playing the game with a seed and recording the outcome
3. Record two seeds: one that wins with a "always shoot opponent" strategy, one that loses

## Part 3: Playwright Configuration

**`playwright.config.ts`:**
- `webServer`: start `npm run dev`, wait for `http://localhost:5173`
- `testDir`: `tests/e2e`
- `projects`: Chromium only (keep simple)
- `use.baseURL`: `http://localhost:5173`

**New npm scripts in `package.json`:**
- `test:e2e` — `npx playwright test`
- `test:e2e:ui` — `npx playwright test --ui`

### Handling animation delays

The game uses `setTimeout` (300ms–1500ms) for dealer turns and transitions. Tests must NOT use hardcoded waits. Instead:

- `page.waitForSelector('#screen-map.active')` — wait for screen transitions
- `page.locator('button:not([disabled])').waitFor()` — wait for buttons to become clickable
- `page.getByText('-- 你的回合 --').waitFor()` — wait for player turn after dealer finishes
- `page.getByText('战斗胜利').waitFor()` — wait for battle win summary
- `page.getByText('地狱第').waitFor()` — wait for map screen content

### Assertions

Key assertions across tests:
- Screen transitions: correct `.screen.active` element
- Layer progression: "地狱第 N 层" decrements from 7 to 1
- Battle flow: shoot buttons exist, dealer takes turns, HP changes
- End states: victory screen or game over screen renders
- Restart: returning to title screen works

## Dependencies

- `@playwright/test` (devDependency)
- `npx playwright install chromium` (browser binary)

## Non-goals

- Testing every item/relic combination (covered by existing Vitest unit tests)
- Cross-browser testing (Chromium only for now)
- Visual regression testing
- Performance testing
