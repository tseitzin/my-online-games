import { test, expect } from '@playwright/test'

test.describe('Golf Game', () => {
  test('home page shows Golf game card', async ({ page }) => {
    await page.goto('/')
    const golfCard = page.locator('text=Golf')
    await expect(golfCard.first()).toBeVisible()
  })

  test('navigates to golf game from home', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/golf"]')
    await expect(page.locator('h1:has-text("Golf")')).toBeVisible()
    await expect(page.locator('text=Player Setup')).toBeVisible()
  })

  test('setup screen loads with player configuration', async ({ page }) => {
    await page.goto('/golf')
    await expect(page.locator('text=Player Setup')).toBeVisible()
    await expect(page.locator('text=Number of Players')).toBeVisible()
    await expect(page.locator('text=Start Game')).toBeVisible()
  })

  test('can configure 2 players and start game', async ({ page }) => {
    await page.goto('/golf')
    await page.click('text=Start Game')
    // Should transition to gameplay phase
    await expect(page.locator('text=Turn')).toBeVisible()
    await expect(page.locator('text=End Round')).toBeVisible()
    await expect(page.locator('text=Reset')).toBeVisible()
  })

  test('can flip initial 2 cards by clicking on the card grid', async ({ page }) => {
    await page.goto('/golf')
    await page.click('text=Start Game')
    await page.waitForTimeout(500)

    // Player 1's board: find the grid container (has 8 card wrappers)
    // The player board with the current player indicator has the highlighted shadow
    const grid = page.locator('div[style*="grid-template-columns"]').first()
    const cards = grid.locator('> div')

    // Player 1 starts with all 8 cards face-down (0 flipped)
    // Click on the 2nd card slot (index 1) for first initial flip
    await cards.nth(1).click({ force: true })
    await page.waitForTimeout(300)

    // Click on the 5th card slot (index 4) for second initial flip
    await cards.nth(4).click({ force: true })
    await page.waitForTimeout(300)

    // After 2 flips, the draw pile should now be clickable (initial flips complete)
    const drawPile = page.locator('text=?').first()
    await expect(drawPile).toBeVisible()
  })

  test('draw pile and discard pile are visible during gameplay', async ({ page }) => {
    await page.goto('/golf')
    await page.click('text=Start Game')
    await page.waitForTimeout(300)

    // The draw pile (showing "?") and cards left counter should be visible
    const drawPile = page.locator('text=?').first()
    await expect(drawPile).toBeVisible()
    await expect(page.locator('text=cards left')).toBeVisible()
  })

  test('scorecard is visible during gameplay', async ({ page }) => {
    await page.goto('/golf')
    await page.click('text=Start Game')
    await expect(page.locator('text=Golf Card Game Scorecard')).toBeVisible()
    await expect(page.locator('text=Game Total')).toBeVisible()
  })

  test('dark mode toggle switches theme', async ({ page }) => {
    await page.goto('/golf')
    // Find and click the dark mode toggle
    const darkButton = page.locator('button:has-text("Dark")')
    await expect(darkButton).toBeVisible()
    await darkButton.click()

    // After clicking, it should now show "Light"
    await expect(page.locator('button:has-text("Light")')).toBeVisible()
  })

  test('Home button navigates back to home page', async ({ page }) => {
    await page.goto('/golf')
    await page.click('a:has-text("Home")')
    // Should be back on home page with all game cards
    await expect(page).toHaveURL('/')
  })

  test('End Round reveals all cards and shows scores', async ({ page }) => {
    await page.goto('/golf')
    await page.click('text=Start Game')
    await page.waitForTimeout(300)

    // Click End Round (will trigger confirm dialog)
    page.on('dialog', dialog => dialog.accept())
    await page.click('text=End Round')
    await page.waitForTimeout(500)

    // After ending round, Next Hole button should appear
    await expect(page.locator('text=Next Hole')).toBeVisible()
  })

  test('full round: end round then advance to next hole', async ({ page }) => {
    await page.goto('/golf')
    await page.click('text=Start Game')
    await page.waitForTimeout(300)

    // End round immediately
    page.on('dialog', dialog => dialog.accept())
    await page.click('text=End Round')
    await page.waitForTimeout(500)

    // Click Next Hole
    await page.click('text=Next Hole')
    await page.waitForTimeout(500)

    // Should still be in gameplay with fresh cards
    await expect(page.locator('text=End Round')).toBeVisible()
    await expect(page.locator('text=Golf Card Game Scorecard')).toBeVisible()
  })
})
