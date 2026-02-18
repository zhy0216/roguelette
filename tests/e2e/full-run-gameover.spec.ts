import { test, expect } from '@playwright/test'
import { setSeed, LOSING_SEED } from './helpers/seed'

test('full game run from title to game over', async ({ page }) => {
  await setSeed(page, LOSING_SEED)
  await page.goto('/')

  // Title screen
  await expect(page.getByText('恶魔轮盘')).toBeVisible()
  await page.getByText('开始游戏').click()

  // Wait for map
  await expect(page.locator('#screen-map.active')).toBeVisible()

  // Navigate until we reach a battle, handling non-combat screens
  await navigateToBattle(page)

  // Shoot self repeatedly to die
  await playSuicideBattle(page)

  // Game over screen
  await expect(page.locator('#screen-gameover.active')).toBeVisible({ timeout: 30_000 })

  // Return to title
  await page.locator('#btn-gameover-restart').click()
  await expect(page.getByText('恶魔轮盘')).toBeVisible()
})

test('game over then restart works', async ({ page }) => {
  await setSeed(page, LOSING_SEED)
  await page.goto('/')

  await page.getByText('开始游戏').click()
  await expect(page.locator('#screen-map.active')).toBeVisible()

  // Navigate until we reach a battle, handling non-combat screens
  await navigateToBattle(page)

  // Shoot self repeatedly to die
  await playSuicideBattle(page)

  await expect(page.locator('#screen-gameover.active')).toBeVisible({ timeout: 30_000 })
  await page.locator('#btn-gameover-restart').click()

  // Verify can start new game
  await expect(page.getByText('开始游戏')).toBeVisible()
  await page.getByText('开始游戏').click()
  await expect(page.locator('#screen-map.active')).toBeVisible()
  await expect(page.getByText('地狱第 7 层')).toBeVisible()
})

/**
 * From the map screen, pick paths until we land in a battle.
 * If we hit shop/rest/gamble, navigate through them back to the map
 * and try the next available path.
 */
async function navigateToBattle(page: import('@playwright/test').Page): Promise<void> {
  for (let attempt = 0; attempt < 10; attempt++) {
    await expect(page.locator('#screen-map.active')).toBeVisible({ timeout: 10_000 })

    // Pick the first card on the map
    const firstCard = page.locator('.card[data-node-type]').first()
    await firstCard.click()

    // Wait for whichever screen appears
    const battle = page.locator('#screen-battle.active')
    const shop = page.locator('#screen-shop.active')
    const rest = page.locator('#screen-rest.active')
    const gamble = page.locator('#screen-gamble.active')

    const which = await Promise.race([
      battle.waitFor({ timeout: 5_000 }).then(() => 'battle' as const),
      shop.waitFor({ timeout: 5_000 }).then(() => 'shop' as const),
      rest.waitFor({ timeout: 5_000 }).then(() => 'rest' as const),
      gamble.waitFor({ timeout: 5_000 }).then(() => 'gamble' as const),
    ])

    if (which === 'battle') return

    // Navigate through non-combat screens back to map
    if (which === 'shop') {
      await page.locator('#btn-leave-shop').click()
    } else if (which === 'rest') {
      await page.locator('#btn-rest-continue').click()
    } else if (which === 'gamble') {
      // Gamble has a 1200ms dice animation before showing the continue button
      // It might also show #btn-gamble-leave if chips are insufficient
      const continueBtn = page.locator('#btn-gamble-continue')
      const leaveBtn = page.locator('#btn-gamble-leave')
      const gambleBtn = await Promise.race([
        continueBtn.waitFor({ timeout: 5_000 }).then(() => 'continue' as const),
        leaveBtn.waitFor({ timeout: 5_000 }).then(() => 'leave' as const),
      ])
      if (gambleBtn === 'continue') {
        await continueBtn.click()
      } else {
        await leaveBtn.click()
      }
    }

    // We should be back at the map now; loop to try again
  }

  throw new Error('Could not reach a battle after 10 attempts')
}

async function playSuicideBattle(page: import('@playwright/test').Page): Promise<void> {
  for (let turn = 0; turn < 100; turn++) {
    const gameOver = page.locator('#screen-gameover.active')
    const shootSelfBtn = page.locator('#btn-shoot-self:not([disabled])')

    const result = await Promise.race([
      shootSelfBtn.waitFor({ timeout: 15_000 }).then(() => 'can_shoot' as const),
      gameOver.waitFor({ timeout: 15_000 }).then(() => 'dead' as const),
    ])

    if (result === 'dead') return
    await shootSelfBtn.click()
    await page.waitForTimeout(100)
  }
}
