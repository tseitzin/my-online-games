import { test, expect } from '@playwright/test'

test.describe('Race Game', () => {
  test('home page shows Race game card', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('text=Race')
    await expect(card.first()).toBeVisible()
  })

  test('navigates to race game from home', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/race"]')
    await expect(page.locator('h1:has-text("Race Setup")')).toBeVisible()
  })

  test('setup screen shows track selection', async ({ page }) => {
    await page.goto('/race')
    await expect(page.locator('text=Select Track')).toBeVisible()
    await expect(page.locator('text=Classic Oval')).toBeVisible()
    await expect(page.locator('text=Super Speedway')).toBeVisible()
    await expect(page.locator('text=Figure Eight')).toBeVisible()
    await expect(page.locator('text=Road Course')).toBeVisible()
  })

  test('setup screen shows Human Players section', async ({ page }) => {
    await page.goto('/race')
    await expect(page.locator('text=Human Players')).toBeVisible()
    // Should have buttons 1-4
    const section = page.locator('text=Human Players').locator('..')
    await expect(section).toBeVisible()
  })

  test('setup screen shows AI Racers section', async ({ page }) => {
    await page.goto('/race')
    await expect(page.locator('h2:has-text("AI Racers")')).toBeVisible()
  })

  test('setup screen shows Laps section', async ({ page }) => {
    await page.goto('/race')
    await expect(page.locator('text=Laps')).toBeVisible()
  })

  test('setup screen shows Start Race button', async ({ page }) => {
    await page.goto('/race')
    await expect(page.locator('text=Start Race!')).toBeVisible()
  })

  test('can change track selection', async ({ page }) => {
    await page.goto('/race')
    // Click Super Speedway
    await page.click('text=Super Speedway')
    // It should now be highlighted (has scale-105 class)
    const speedwayButton = page.locator('button:has-text("Super Speedway")')
    await expect(speedwayButton).toHaveClass(/bg-purple-500/)
  })

  test('can start race with default config', async ({ page }) => {
    await page.goto('/race')
    await page.click('text=Start Race!')
    // Should transition to countdown phase showing numbers
    await expect(page.locator('text=3').first()).toBeVisible({ timeout: 3000 })
  })

  test('Home button navigates back to home page', async ({ page }) => {
    await page.goto('/race')
    await page.click('a:has-text("Home")')
    await expect(page).toHaveURL('/')
  })

  test('need at least 2 racers validation', async ({ page }) => {
    await page.goto('/race')
    // Default is 1 human + 3 AI = 4 racers, should be valid
    // The AI Racers section has buttons 0-7 in a flex row. Click the "0" button.
    // Use the heading to find the correct section container
    const aiHeading = page.locator('h2:has-text("AI Racers")')
    const aiContainer = aiHeading.locator('..').locator('..')
    await aiContainer.locator('button').first().click()
    // Warning message should appear
    await expect(page.locator('text=Need at least 2 racers')).toBeVisible()
  })
})
