import { renderHook } from '@testing-library/react'
import { useGameState } from '../hooks/useGameState'

// Helper utilities for test scenarios to reduce duplication.
// finishPlayer: flips all cards of the specified player faceUp and sets flippedCount accordingly.
export function finishPlayer(result, playerIndex) {
  // Uses exposeTestHelpers __setPlayers from useGameState when available.
  const flipAll = ps => ps.map((p,i) => i!==playerIndex ? p : {
    ...p,
    cards: p.cards.map(c => ({ ...c, faceUp: true })),
    flippedCount: p.cards.length,
  })
  result.current.__setPlayers(flipAll)
}

/**
 * Build a deterministic deck from an array of card values.
 * Layout: first (playerCount * 8) values become player hands,
 * the next value seeds the discard pile after handleSetupSubmit,
 * the rest form the draw pile.
 * Pads to 108 cards if fewer values provided.
 */
export function makeDeck(values) {
  const padded = [...values]
  while (padded.length < 108) padded.push(0)
  return padded
}

/**
 * Quick 2-player deck: P1 gets all v1, P2 gets all v2,
 * discard seed and draw pile are drawValue.
 */
export function makeSimpleDeck(v1 = 5, v2 = 3, drawValue = 7) {
  return makeDeck([
    ...Array(8).fill(v1),         // Player 1 hand
    ...Array(8).fill(v2),         // Player 2 hand
    drawValue,                    // Discard seed
    ...Array(91).fill(drawValue), // Draw pile
  ])
}

/**
 * Render the useGameState hook with standard test defaults.
 * Disables delays, persistence, and computer auto-play by default.
 */
export function renderGameHook(overrides = {}) {
  return renderHook(() =>
    useGameState({
      disableDelays: true,
      exposeTestHelpers: true,
      enablePersistence: false,
      disableComputerAuto: true,
      ...overrides,
    })
  )
}
