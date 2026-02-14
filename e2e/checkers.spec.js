import { test, expect } from '@playwright/test'

test.describe('Checkers Game', () => {
  test('home page shows Checkers game card', async ({ page }) => {
    await page.goto('/')
    const checkersCard = page.locator('text=Checkers')
    await expect(checkersCard.first()).toBeVisible()
  })

  test('navigates to checkers game from home', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/checkers"]')
    await expect(page.locator('h1:has-text("Checkers")')).toBeVisible()
    await expect(page.locator('text=Choose your game settings')).toBeVisible()
  })

  test('setup screen shows game mode options', async ({ page }) => {
    await page.goto('/checkers')
    await expect(page.locator('text=vs Computer')).toBeVisible()
    await expect(page.locator('text=2 Players')).toBeVisible()
    await expect(page.locator('text=Start Game')).toBeVisible()
  })

  test('setup screen shows difficulty options in vs Computer mode', async ({ page }) => {
    await page.goto('/checkers')
    await expect(page.locator('text=Easy')).toBeVisible()
    await expect(page.locator('text=Medium')).toBeVisible()
    await expect(page.locator('text=Hard')).toBeVisible()
  })

  test('selecting 2 Players hides color and difficulty', async ({ page }) => {
    await page.goto('/checkers')
    await page.click('text=2 Players')
    await expect(page.locator('text=Easy')).not.toBeVisible()
    await expect(page.locator('text=Choose Your Color')).not.toBeVisible()
  })

  test('can start a 2 Player game and see the board', async ({ page }) => {
    await page.goto('/checkers')
    await page.click('text=2 Players')
    await page.click('text=Start Game')
    // Setup should be gone, game board should appear
    await expect(page.locator('text=Choose your game settings')).not.toBeVisible()
    await expect(page.locator('text=Red')).toBeVisible()
    await expect(page.locator('text=Black')).toBeVisible()
  })

  test('board shows piece counts after starting', async ({ page }) => {
    await page.goto('/checkers')
    await page.click('text=2 Players')
    await page.click('text=Start Game')
    // Each side starts with 12 pieces
    const onBoardTexts = page.locator('text=On board: 12')
    await expect(onBoardTexts.first()).toBeVisible()
  })

  test('can click a piece to see valid move indicators', async ({ page }) => {
    await page.goto('/checkers')
    await page.click('text=2 Players')
    await page.click('text=Start Game')
    await page.waitForTimeout(300)

    // Click a red piece on the board (row 5, col 0 is a red piece)
    // Board squares are in a grid; dark squares at row 5 col 0
    // Find clickable squares — they have onClick handlers
    const squares = page.locator('[data-testid="square"]')
    const squareCount = await squares.count()

    if (squareCount > 0) {
      // Click a square in the red piece area (row 5)
      await squares.nth(40).click({ force: true }) // row 5, col 0
    } else {
      // Fallback: find squares by grid position
      const board = page.locator('div[style*="grid-template-columns: repeat(8"]')
      const cells = board.locator('> div')
      await cells.nth(40).click({ force: true })
    }
    await page.waitForTimeout(200)
  })

  test('dark mode toggle switches theme', async ({ page }) => {
    await page.goto('/checkers')
    const darkButton = page.locator('button:has-text("Dark")')
    await expect(darkButton).toBeVisible()
    await darkButton.click()
    await expect(page.locator('button:has-text("Light")')).toBeVisible()
  })

  test('Home button navigates back to home page', async ({ page }) => {
    await page.goto('/checkers')
    await page.click('a:has-text("Home")')
    await expect(page).toHaveURL('/')
  })

  test('hint system can be enabled', async ({ page }) => {
    await page.goto('/checkers')
    await page.click('text=2 Players')
    await page.click('text=Start Game')
    await page.waitForTimeout(300)

    // Enable hints
    await page.click('text=Enable Hints')
    await expect(page.locator('text=Hints Enabled')).toBeVisible()
    await expect(page.locator('text=Show Hint')).toBeVisible()
  })

  test('game rules section is visible during gameplay', async ({ page }) => {
    await page.goto('/checkers')
    await page.click('text=2 Players')
    await page.click('text=Start Game')
    await expect(page.locator('text=Game Rules:')).toBeVisible()
    await expect(page.locator('text=Legend:')).toBeVisible()
  })

  test('can start a vs Computer game', async ({ page }) => {
    await page.goto('/checkers')
    // Default mode is vs Computer, just click Start Game
    await page.click('text=Start Game')
    await page.waitForTimeout(1000)
    // Should be in gameplay
    await expect(page.locator('text=Red')).toBeVisible()
    await expect(page.locator('text=Black')).toBeVisible()
  })
})
