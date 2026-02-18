import { test, expect, type Page } from '@playwright/test'
import { setSeed, WINNING_SEED } from './helpers/seed'

test('full game run from title to victory', async ({ page }) => {
  test.setTimeout(180_000) // 3 minutes

  // Speed up the game by patching setTimeout to use 1ms delays
  await page.addInitScript(() => {
    const origSetTimeout = window.setTimeout.bind(window)
    // @ts-ignore
    window.setTimeout = (fn: TimerHandler, delay?: number, ...args: unknown[]) => {
      return origSetTimeout(fn, 1, ...args)
    }
  })

  await setSeed(page, WINNING_SEED)
  await page.goto('/')

  // Title screen
  await expect(page.getByText('恶魔轮盘')).toBeVisible()
  await page.getByText('开始游戏').click()

  // Play through all 7 layers
  for (let step = 0; step < 60; step++) {
    // Wait for map, victory, or game over
    const mapScreen = page.locator('#screen-map.active')
    const victory = page.locator('#screen-victory.active')
    const gameOver = page.locator('#screen-gameover.active')

    await mapScreen.or(victory).or(gameOver).first().waitFor({ timeout: 30_000 })

    if (await victory.isVisible()) {
      // Verify victory screen content
      await expect(page.getByText('逃出地狱')).toBeVisible()
      return // Test passes
    }

    expect(await gameOver.isVisible(), `Seed ${WINNING_SEED} died unexpectedly at step ${step}`).toBe(false)

    // We're on the map. Pick the first card.
    const firstCard = page.locator('.card[data-node-type]').first()
    await firstCard.waitFor({ timeout: 5_000 })
    const nodeType = await firstCard.getAttribute('data-node-type')
    await firstCard.click()

    if (nodeType === 'combat') {
      const battleResult = await playBattle(page)
      expect(battleResult, `Lost combat at step ${step}`).toBe('won')

      // Victory screen may appear after final boss
      const winText = page.getByText('战斗胜利')
      const victoryScreen = page.locator('#screen-victory.active')
      await winText.or(victoryScreen).first().waitFor({ timeout: 30_000 })
      if (await victoryScreen.isVisible()) {
        await expect(page.getByText('逃出地狱')).toBeVisible()
        return // Test passes
      }
      await page.locator('#btn-continue').click()
    } else if (nodeType === 'shop') {
      await expect(page.locator('#screen-shop.active')).toBeVisible({ timeout: 5_000 })
      await page.locator('#btn-leave-shop').click()
    } else if (nodeType === 'rest') {
      await expect(page.locator('#screen-rest.active')).toBeVisible({ timeout: 5_000 })
      await page.locator('#btn-rest-continue').click()
    } else if (nodeType === 'gamble') {
      await expect(page.locator('#screen-gamble.active')).toBeVisible({ timeout: 5_000 })
      const leaveBtn = page.locator('#btn-gamble-leave')
      const continueBtn = page.locator('#btn-gamble-continue')
      await leaveBtn.or(continueBtn).first().waitFor({ timeout: 5_000 })
      if (await leaveBtn.isVisible()) {
        await leaveBtn.click()
      } else {
        await continueBtn.click()
      }
    }
  }

  // Should never reach here — victory should have been detected
  expect(false, 'Did not reach victory screen within 60 steps').toBe(true)
})

async function playBattle(page: Page): Promise<'won' | 'lost'> {
  await expect(page.locator('#screen-battle.active')).toBeVisible({ timeout: 5_000 })

  for (let turn = 0; turn < 200; turn++) {
    const shootBtn = page.locator('#btn-shoot-opponent:not([disabled])')
    const winText = page.getByText('战斗胜利')
    const gameOver = page.locator('#screen-gameover.active')
    const victory = page.locator('#screen-victory.active')

    await shootBtn.or(winText).or(gameOver).or(victory).first().waitFor({ timeout: 30_000 })

    if (await winText.isVisible()) return 'won'
    if (await gameOver.isVisible()) return 'lost'
    if (await victory.isVisible()) return 'won'
    if (await shootBtn.isVisible()) {
      await shootBtn.click()
      await page.waitForTimeout(50)
    }
  }

  return 'lost'
}
