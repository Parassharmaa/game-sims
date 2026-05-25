import { test, expect } from '@playwright/test'

test.describe('Game Sims · multi-page wizard', () => {
  test('step 1: renders header and all six game cards', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('header')).toContainText('GAME SIMS')
    await expect(page.getByTestId('page-game')).toBeVisible()
    const picker = page.getByTestId('game-picker')
    for (const id of ['reversi', 'gomoku', 'mancala', 'hex', 'breakthrough', 'utttt']) {
      await expect(picker.locator(`[data-game="${id}"]`)).toBeVisible()
    }
  })

  test('step 1 → step 2: picking a game advances to the champions screen', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-game="gomoku"]').click()
    await page.getByTestId('next-bots').click()
    await expect(page.getByTestId('page-bots')).toBeVisible()
    await expect(page.getByTestId('champion-a')).toBeVisible()
    await expect(page.getByTestId('champion-b')).toBeVisible()
    // VS badge shows up in the matchup
    await expect(page.getByTestId('matchup')).toContainText('VS')
  })

  test('step 2 → step 3: Start Battle reaches the arena', async ({ page }) => {
    // Block Ollama so the run hangs in "thinking" — we only verify the page change.
    await page.route('**/api/ollama/**', async () => {
      await new Promise(() => {})
    })
    await page.goto('/')
    await page.locator('[data-game="reversi"]').click()
    await page.getByTestId('next-bots').click()
    await page.getByTestId('start-battle').click()
    await expect(page.getByTestId('page-arena')).toBeVisible({ timeout: 5000 })
    // Stop button should appear once the run is in flight
    await expect(page.getByRole('button', { name: /Stop/i })).toBeVisible({ timeout: 5000 })
  })

  test('side panel: switches between Moves and Chat tabs', async ({ page }) => {
    // Block Ollama so the run never produces real moves — we only test the UI tabs.
    await page.route('**/api/ollama/**', async () => {
      await new Promise(() => {})
    })
    await page.goto('/')
    await page.locator('[data-game="reversi"]').click()
    await page.getByTestId('next-bots').click()
    await page.getByTestId('start-battle').click()
    await expect(page.getByTestId('page-arena')).toBeVisible({ timeout: 5000 })
    // Both tabs exist
    const sidePanel = page.getByTestId('side-panel')
    await expect(sidePanel.getByTestId('tab-moves')).toBeVisible()
    await expect(sidePanel.getByTestId('tab-chat')).toBeVisible()
    // Default tab is Moves
    await expect(sidePanel.getByTestId('move-log')).toBeVisible()
    // Switching shows Chat panel with empty-state copy
    await sidePanel.getByTestId('tab-chat').click()
    const chat = sidePanel.getByTestId('chat-panel')
    await expect(chat).toBeVisible()
    await expect(chat).toContainText(/plotting silently/i)
    // Switching back returns to Moves
    await sidePanel.getByTestId('tab-moves').click()
    await expect(sidePanel.getByTestId('move-log')).toBeVisible()
  })

  test('human player: toggle reveals name field and hides model picker', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-game="reversi"]').click()
    await page.getByTestId('next-bots').click()
    const championA = page.getByTestId('champion-a')
    // Default state is AI
    await expect(championA).toHaveAttribute('data-kind', 'ai')
    await expect(page.getByTestId('bot-model-a')).toBeVisible()
    // Flip to human
    await page.getByTestId('kind-human-a').click()
    await expect(championA).toHaveAttribute('data-kind', 'human')
    await expect(page.getByTestId('human-name-a')).toBeVisible()
    await expect(page.getByTestId('bot-model-a')).toHaveCount(0)
    // Flip back
    await page.getByTestId('kind-ai-a').click()
    await expect(championA).toHaveAttribute('data-kind', 'ai')
    await expect(page.getByTestId('bot-model-a')).toBeVisible()
  })

  test('human player: clicks a board cell to make a Reversi move', async ({ page }) => {
    // Block AI calls — only the human moves.
    await page.route('**/api/ollama/v1/chat/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: '{"error":"blocked"}',
      })
    })
    await page.goto('/')
    await page.locator('[data-game="reversi"]').click()
    await page.getByTestId('next-bots').click()
    // Make player A human
    await page.getByTestId('kind-human-a').click()
    await page.getByTestId('human-name-a').fill('Tester')
    await page.getByTestId('start-battle').click()
    await expect(page.getByTestId('page-arena')).toBeVisible()
    // The "your turn" banner appears for the human
    const humanInput = page.getByTestId('human-input')
    await expect(humanInput).toBeVisible({ timeout: 5000 })
    await expect(humanInput).toContainText(/Tester/i)
    // Board is interactive — D3 is a legal Reversi opening (flips D4)
    const board = page.getByTestId('reversi-board')
    await expect(board).toHaveAttribute('data-interactive', 'true')
    await board.locator('[data-cell="D3"][data-legal="true"]').click()
    // Move log shows the entry
    await page.getByTestId('tab-moves').click()
    await expect(page.getByTestId('move-log')).toContainText('D3')
  })

  test('human player: chat input in chat tab sends as the human', async ({ page }) => {
    await page.route('**/api/ollama/v1/chat/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: '{"error":"blocked"}',
      })
    })
    await page.goto('/')
    await page.locator('[data-game="reversi"]').click()
    await page.getByTestId('next-bots').click()
    await page.getByTestId('kind-human-a').click()
    await page.getByTestId('human-name-a').fill('Tester')
    await page.getByTestId('start-battle').click()
    await expect(page.getByTestId('human-input')).toBeVisible({ timeout: 5000 })
    // Switch to chat tab — input should appear
    await page.getByTestId('tab-chat').click()
    const chatInput = page.getByTestId('chat-input')
    await expect(chatInput).toBeVisible()
    await chatInput.fill('Brace yourself.')
    await page.getByTestId('chat-send').click()
    await expect(page.getByTestId('chat-panel')).toContainText('Brace yourself.')
  })

  test('human player: non-legal cells are not clickable', async ({ page }) => {
    await page.route('**/api/ollama/v1/chat/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: '{"error":"blocked"}',
      })
    })
    await page.goto('/')
    await page.locator('[data-game="reversi"]').click()
    await page.getByTestId('next-bots').click()
    await page.getByTestId('kind-human-a').click()
    await page.getByTestId('start-battle').click()
    await expect(page.getByTestId('human-input')).toBeVisible({ timeout: 5000 })
    // A1 is not a legal opening — should not have the data-legal attribute
    const board = page.getByTestId('reversi-board')
    const illegal = board.locator('[data-cell="A1"]')
    await expect(illegal).not.toHaveAttribute('data-legal', 'true')
    await expect(illegal).toBeDisabled()
    // Human banner is still showing — turn hasn't ended
    await expect(page.getByTestId('human-input')).toBeVisible()
  })

  test('step progress: clicking a past step jumps back', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-game="mancala"]').click()
    await page.getByTestId('next-bots').click()
    await expect(page.getByTestId('page-bots')).toBeVisible()
    // Jump back via step progress
    await page.locator('[data-step="game"]').click()
    await expect(page.getByTestId('page-game')).toBeVisible()
  })
})
