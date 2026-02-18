import type { Page } from '@playwright/test'

// WINNING_SEED: confirmed in browser e2e test — "always shoot opponent" + "always pick first path"
//   wins all 7 layers (originally found via simulation, verified via Playwright)
// LOSING_SEED: player dies (any seed works since most seeds lose; seed 1 dies at layer 1)
export const WINNING_SEED = 2128
export const LOSING_SEED = 1

export async function setSeed(page: Page, seed: number): Promise<void> {
  await page.addInitScript((s) => {
    localStorage.setItem('seed', String(s))
  }, seed)
}
