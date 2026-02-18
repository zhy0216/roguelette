import { test, expect } from '@playwright/test'

test('game loads title screen', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('恶魔轮盘')).toBeVisible()
  await expect(page.getByText('开始游戏')).toBeVisible()
})
