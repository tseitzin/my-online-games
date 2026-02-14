import { test, expect } from '@playwright/test'

test.describe('Battle Planes Game', () => {
  test('home page shows Battle Planes game card', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('text=Battle Planes')
    await expect(card.first()).toBeVisible()
  })

  test('navigates to battleplanes game from home', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/battleplanes"]')
    await expect(page.locator('h1:has-text("Battle Planes")')).toBeVisible()
  })

  test('setup screen shows plane count options', async ({ page }) => {
    await page.goto('/battleplanes')
    await expect(page.locator('text=Number of Planes')).toBeVisible()
    await expect(page.locator('button:has-text("10")')).toBeVisible()
    await expect(page.locator('button:has-text("15")')).toBeVisible()
    await expect(page.locator('button:has-text("20")')).toBeVisible()
  })

  test('setup screen shows duration slider', async ({ page }) => {
    await page.goto('/battleplanes')
    await expect(page.locator('text=Game Duration')).toBeVisible()
    const slider = page.locator('input[type="range"]')
    await expect(slider).toBeVisible()
    await expect(slider).toHaveAttribute('min', '1')
    await expect(slider).toHaveAttribute('max', '6')
  })

  test('setup screen shows difficulty options', async ({ page }) => {
    await page.goto('/battleplanes')
    await expect(page.locator('text=Difficulty Level')).toBeVisible()
    await expect(page.locator('button:has-text("easy")')).toBeVisible()
    await expect(page.locator('button:has-text("medium")')).toBeVisible()
    await expect(page.locator('button:has-text("hard")')).toBeVisible()
  })

  test('setup screen shows Start Battle button', async ({ page }) => {
    await page.goto('/battleplanes')
    await expect(page.locator('button:has-text("Start Battle")')).toBeVisible()
  })

  test('plane count defaults to 10 selected', async ({ page }) => {
    await page.goto('/battleplanes')
    const button10 = page.locator('button:has-text("10")')
    await expect(button10).toHaveClass(/bg-cyan-500/)
  })

  test('difficulty defaults to medium selected', async ({ page }) => {
    await page.goto('/battleplanes')
    const mediumButton = page.locator('button:has-text("medium")')
    await expect(mediumButton).toHaveClass(/bg-yellow-500/)
  })

  test('can select different plane count', async ({ page }) => {
    await page.goto('/battleplanes')
    await page.click('button:has-text("20")')
    const button20 = page.locator('button:has-text("20")')
    await expect(button20).toHaveClass(/bg-cyan-500/)
  })

  test('can start a game and see gameplay', async ({ page }) => {
    await page.goto('/battleplanes')
    await page.click('button:has-text("Start Battle")')
    await page.waitForTimeout(500)
    await expect(page.locator('text=SCORE')).toBeVisible()
    await expect(page.locator('text=TIME')).toBeVisible()
  })

  test('game screen shows score display', async ({ page }) => {
    await page.goto('/battleplanes')
    await page.click('button:has-text("Start Battle")')
    await page.waitForTimeout(500)
    await expect(page.locator('text=SCORE')).toBeVisible()
  })

  test('game screen shows time display', async ({ page }) => {
    await page.goto('/battleplanes')
    await page.click('button:has-text("Start Battle")')
    await page.waitForTimeout(500)
    await expect(page.locator('text=TIME')).toBeVisible()
  })

  test('Home button navigates back to home page', async ({ page }) => {
    await page.goto('/battleplanes')
    await page.click('a:has-text("Home")')
    await expect(page).toHaveURL('/')
  })
})
