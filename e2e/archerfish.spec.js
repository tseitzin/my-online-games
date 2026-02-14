import { test, expect } from '@playwright/test'

test.describe('Archer Fish Game', () => {
  test('home page shows Archer Fish game card', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('text=Archer Fish Racing')
    await expect(card.first()).toBeVisible()
  })

  test('navigates to archerfish game from home', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/archerfish"]')
    await expect(page.locator('h1:has-text("Archer Fish Racing")')).toBeVisible()
    await expect(page.locator('text=Escape the Evil Robot!')).toBeVisible()
  })

  test('setup screen shows fish count options', async ({ page }) => {
    await page.goto('/archerfish')
    await expect(page.locator('text=Number of Fish')).toBeVisible()
    await expect(page.locator('text=2 Fish')).toBeVisible()
    await expect(page.locator('text=3 Fish')).toBeVisible()
    await expect(page.locator('text=4 Fish')).toBeVisible()
  })

  test('setup screen shows robot count options', async ({ page }) => {
    await page.goto('/archerfish')
    await expect(page.locator('text=Number of Robots')).toBeVisible()
    await expect(page.locator('text=1 Robot')).toBeVisible()
    await expect(page.locator('text=2 Robots')).toBeVisible()
    await expect(page.locator('text=3 Robots')).toBeVisible()
  })

  test('setup screen shows difficulty options', async ({ page }) => {
    await page.goto('/archerfish')
    await expect(page.locator('text=easy')).toBeVisible()
    await expect(page.locator('text=medium')).toBeVisible()
    await expect(page.locator('text=hard')).toBeVisible()
  })

  test('setup screen shows duration options', async ({ page }) => {
    await page.goto('/archerfish')
    await expect(page.locator('text=1min')).toBeVisible()
    await expect(page.locator('text=2min')).toBeVisible()
    await expect(page.locator('text=3min')).toBeVisible()
    await expect(page.locator('text=4min')).toBeVisible()
    await expect(page.locator('text=5min')).toBeVisible()
  })

  test('setup screen shows player configuration', async ({ page }) => {
    await page.goto('/archerfish')
    await expect(page.locator('text=Player Configuration')).toBeVisible()
    // Default: 2 fish, first is Human, second is AI
    await expect(page.locator('button:has-text("Human")')).toBeVisible()
    await expect(page.locator('button:has-text("AI")')).toBeVisible()
  })

  test('setup screen shows leaderboard section', async ({ page }) => {
    await page.goto('/archerfish')
    await expect(page.locator('text=Top Survivors')).toBeVisible()
    // Empty leaderboard shows placeholder
    await expect(page.locator('text=No scores yet')).toBeVisible()
  })

  test('can start a game and see gameplay', async ({ page }) => {
    await page.goto('/archerfish')
    await page.click('text=Start Game!')
    await page.waitForTimeout(500)
    // Game screen should show timer and fish names
    await expect(page.locator('text=Time:')).toBeVisible()
    await expect(page.locator('text=Player 1').first()).toBeVisible()
  })

  test('game screen has pause button that works', async ({ page }) => {
    await page.goto('/archerfish')
    await page.click('text=Start Game!')
    await page.waitForTimeout(500)
    // Click the pause button (first button in the header area)
    const pauseButton = page.locator('button').first()
    await pauseButton.click()
    await expect(page.locator('text=PAUSED')).toBeVisible()
    // Click again to resume
    await pauseButton.click()
    await expect(page.locator('text=PAUSED')).not.toBeVisible()
  })

  test('Home button navigates back to home page', async ({ page }) => {
    await page.goto('/archerfish')
    await page.click('a:has-text("Home")')
    await expect(page).toHaveURL('/')
  })

  test('difficulty description updates when changed', async ({ page }) => {
    await page.goto('/archerfish')
    // Default is medium
    await expect(page.locator('text=Balanced challenge')).toBeVisible()
    // Click easy
    await page.locator('button:has-text("easy")').click()
    await expect(page.locator('text=Perfect for kids')).toBeVisible()
    // Click hard
    await page.locator('button:has-text("hard")').click()
    await expect(page.locator('text=Expert mode')).toBeVisible()
  })

  test('selecting 3 Fish shows 3 player rows', async ({ page }) => {
    await page.goto('/archerfish')
    await page.click('text=3 Fish')
    // Should now have 3 name input fields
    const nameInputs = page.locator('input[type="text"]')
    await expect(nameInputs).toHaveCount(3)
  })
})
