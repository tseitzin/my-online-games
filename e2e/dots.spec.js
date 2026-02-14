import { test, expect } from '@playwright/test'

test.describe('Dots and Boxes Game', () => {
  test('home page shows Dots and Boxes game card', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('text=Dots and Boxes')
    await expect(card.first()).toBeVisible()
  })

  test('navigates to dots game from home', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/dots"]')
    await expect(page.locator('h1:has-text("Dots and Boxes")')).toBeVisible()
  })

  test('setup screen shows player configuration', async ({ page }) => {
    await page.goto('/dots')
    await expect(page.locator('text=Number of Players')).toBeVisible()
    await expect(page.locator('text=Player Configuration')).toBeVisible()
    await expect(page.locator('text=Grid Size')).toBeVisible()
    await expect(page.locator('text=Start Game')).toBeVisible()
  })

  test('can change player count to 3', async ({ page }) => {
    await page.goto('/dots')
    // Click the "3" button in the player count section
    const countButtons = page.locator('text=Number of Players').locator('..').locator('button')
    await countButtons.nth(1).click() // 2nd button = "3"
    // Should now have 3 player name inputs
    const nameInputs = page.locator('input[type="text"]')
    await expect(nameInputs).toHaveCount(3)
  })

  test('can change player count to 4', async ({ page }) => {
    await page.goto('/dots')
    const countButtons = page.locator('text=Number of Players').locator('..').locator('button')
    await countButtons.nth(2).click() // 3rd button = "4"
    const nameInputs = page.locator('input[type="text"]')
    await expect(nameInputs).toHaveCount(4)
  })

  test('can toggle player to Computer', async ({ page }) => {
    await page.goto('/dots')
    // Click the first "Computer" button
    const computerButtons = page.locator('button:has-text("Computer")')
    await computerButtons.first().click()
    // Player 1 name should change to "CPU 1"
    await expect(page.locator('input[value="CPU 1"]')).toBeVisible()
  })

  test('shows validation error when all players are computer', async ({ page }) => {
    await page.goto('/dots')
    // Toggle both players to Computer
    const computerButtons = page.locator('button:has-text("Computer")')
    await computerButtons.first().click()
    await computerButtons.nth(1).click()
    // Click Start Game
    await page.click('text=Start Game')
    // Error should appear
    await expect(page.locator('text=At least one human player is required')).toBeVisible()
  })

  test('can configure and start a 2-player game', async ({ page }) => {
    await page.goto('/dots')
    await page.click('text=Start Game')
    // Should transition to game board - look for turn indicator and undo button
    await expect(page.locator('text=Player 1\'s Turn')).toBeVisible()
    await expect(page.locator('text=Undo Last Move')).toBeVisible()
  })

  test('game board shows current player turn indicator', async ({ page }) => {
    await page.goto('/dots')
    await page.click('text=Start Game')
    // Should show "Player 1's Turn"
    await expect(page.locator('text=Player 1\'s Turn')).toBeVisible()
  })

  test('can click a line on the board to draw it', async ({ page }) => {
    await page.goto('/dots')
    await page.click('text=Start Game')
    await page.waitForTimeout(300)
    // Click on a transparent hitbox rect (SVG click target)
    const hitboxes = page.locator('svg rect[cursor="pointer"]')
    const count = await hitboxes.count()
    expect(count).toBeGreaterThan(0)
    await hitboxes.first().click({ force: true })
    // After clicking, turn should change to Player 2
    await expect(page.locator('text=Player 2\'s Turn')).toBeVisible()
  })

  test('dark mode toggle switches theme', async ({ page }) => {
    await page.goto('/dots')
    // Click the dark mode toggle (button with "Dark" text)
    await page.click('button:has-text("Dark")')
    // Button should now show "Light"
    await expect(page.locator('button:has-text("Light")')).toBeVisible()
  })

  test('Home button navigates back to home page', async ({ page }) => {
    await page.goto('/dots')
    await page.click('a:has-text("Home")')
    await expect(page).toHaveURL('/')
  })

  test('undo button is visible during gameplay', async ({ page }) => {
    await page.goto('/dots')
    await page.click('text=Start Game')
    await expect(page.locator('text=Undo Last Move')).toBeVisible()
  })
})
