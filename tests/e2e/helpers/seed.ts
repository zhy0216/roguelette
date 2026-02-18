import type { Page } from '@playwright/test'

// Seeds discovered by src/models/__tests__/seed-finder.test.ts
// WINNING_SEED: with "always shoot opponent" + "always pick first path", player wins all 7 layers
// LOSING_SEED: player dies (any seed works since most seeds lose; seed 1 dies at layer 1)
export const WINNING_SEED = 93
export const LOSING_SEED = 1

export async function setSeed(page: Page, seed: number): Promise<void> {
  await page.addInitScript((s) => {
    localStorage.setItem('seed', String(s))
  }, seed)
}
