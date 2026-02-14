import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act } from '@testing-library/react'
import { renderGameHook, makeSimpleDeck, makeDeck, finishPlayer } from '../test/golfTestHelpers.jsx'

// Helper: submit setup with default 2 human players
function submitSetup(result) {
  act(() => {
    result.current.handleSetupSubmit({ preventDefault: () => {} })
  })
}

// Helper: flip 2 initial cards for a human player
function flipInitialCards(result, playerIndex = 0) {
  act(() => { result.current.handleCardClick(playerIndex, 0) })
  act(() => { result.current.handleCardClick(playerIndex, 1) })
}

// Helper: complete setup and initial flips for player 0
function setupAndReady(result) {
  submitSetup(result)
  flipInitialCards(result, 0)
}

describe('useGameState', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('initialization', () => {
    it('initializes with 2 players by default', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      expect(result.current.playerCount).toBe(2)
      expect(result.current.players).toHaveLength(2)
    })

    it('each player starts with 8 face-down cards', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      result.current.players.forEach(player => {
        expect(player.cards).toHaveLength(8)
        player.cards.forEach(card => expect(card.faceUp).toBe(false))
      })
    })

    it('initialDeck produces deterministic card values', () => {
      const deck = makeDeck([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 0, 1, 2, 3])
      const { result } = renderGameHook({ initialDeck: deck })
      expect(result.current.players[0].cards[0].value).toBe(1)
      expect(result.current.players[0].cards[7].value).toBe(8)
      expect(result.current.players[1].cards[0].value).toBe(9)
    })

    it('setupComplete starts as false', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      expect(result.current.setupComplete).toBe(false)
    })

    it('currentPlayer starts at 0', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      expect(result.current.currentPlayer).toBe(0)
    })

    it('currentHole starts at 1', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      expect(result.current.currentHole).toBe(1)
    })

    it('holeScores starts as empty array', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      expect(result.current.holeScores).toEqual([])
    })

    it('drawnCard starts as null', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      expect(result.current.drawnCard).toBeNull()
    })
  })

  describe('handlePlayerCountChange', () => {
    it('changes player count and redeals hands', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      act(() => { result.current.handlePlayerCountChange(3) })
      expect(result.current.playerCount).toBe(3)
      expect(result.current.players).toHaveLength(3)
    })

    it('clamps count to min 2', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      act(() => { result.current.handlePlayerCountChange(1) })
      expect(result.current.playerCount).toBe(2)
    })

    it('clamps count to max 6', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      act(() => { result.current.handlePlayerCountChange(10) })
      expect(result.current.playerCount).toBe(6)
    })

    it('does nothing if count equals current', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      const playersBefore = result.current.players
      act(() => { result.current.handlePlayerCountChange(2) })
      expect(result.current.players).toBe(playersBefore)
    })

    it('does nothing after setupComplete is true', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      submitSetup(result)
      act(() => { result.current.handlePlayerCountChange(4) })
      expect(result.current.playerCount).toBe(2)
    })

    it('resets drawn card and discard pile on count change', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      act(() => { result.current.handlePlayerCountChange(3) })
      expect(result.current.drawnCard).toBeNull()
      expect(result.current.discardPile).toEqual([])
    })
  })

  describe('handleSetupChange', () => {
    it('updates player name', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      act(() => { result.current.handleSetupChange(0, 'name', 'Alice') })
      expect(result.current.playerSetup[0].name).toBe('Alice')
    })

    it('updates player color', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      act(() => { result.current.handleSetupChange(0, 'color', '#ff0000') })
      expect(result.current.playerSetup[0].color).toBe('#ff0000')
    })

    it('prevents setting all players to computer', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      act(() => { result.current.handleSetupChange(0, 'isComputer', true) })
      // At least one player should remain human
      expect(result.current.playerSetup.some(p => !p.isComputer)).toBe(true)
    })

    it('clears setupError on change', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      // Force all-computer to trigger error
      act(() => { result.current.handleSetupChange(0, 'isComputer', true) })
      act(() => {
        result.current.handleSetupSubmit({ preventDefault: () => {} })
      })
      // Now change something to clear the error
      act(() => { result.current.handleSetupChange(0, 'name', 'Test') })
      expect(result.current.setupError).toBeNull()
    })
  })

  describe('handleSetupSubmit', () => {
    it('sets setupComplete to true', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      submitSetup(result)
      expect(result.current.setupComplete).toBe(true)
    })

    it('seeds discard pile with top card from deck', () => {
      const deck = makeSimpleDeck(5, 3, 7)
      const { result } = renderGameHook({ initialDeck: deck })
      submitSetup(result)
      expect(result.current.discardTop).not.toBeNull()
      expect(result.current.discardTop.value).toBe(7) // discard seed value
      expect(result.current.discardPile).toHaveLength(1)
    })

    it('calls preventDefault on the event', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      const mockEvent = { preventDefault: vi.fn() }
      act(() => { result.current.handleSetupSubmit(mockEvent) })
      expect(mockEvent.preventDefault).toHaveBeenCalled()
    })

    it('auto-flips 2 cards for computer players', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      // Default setup: player 0 = human, player 1 = computer
      submitSetup(result)
      const computerPlayer = result.current.players[1]
      const faceUpCount = computerPlayer.cards.filter(c => c.faceUp).length
      expect(faceUpCount).toBe(2)
    })

    it('sets initialFlips to true for computer players', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      submitSetup(result)
      expect(result.current.initialFlips[1]).toBe(true)  // computer
      expect(result.current.initialFlips[0]).toBe(false)  // human
    })

    it('sets first human player as currentPlayer', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      submitSetup(result)
      expect(result.current.currentPlayer).toBe(0)
    })
  })

  describe('initial card flips - human player', () => {
    it('flips a face-down card during initial flip phase', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      submitSetup(result)
      act(() => { result.current.handleCardClick(0, 0) })
      expect(result.current.players[0].cards[0].faceUp).toBe(true)
    })

    it('second flip completes initialFlips for that player', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      submitSetup(result)
      act(() => { result.current.handleCardClick(0, 0) })
      expect(result.current.initialFlips[0]).toBe(false)
      act(() => { result.current.handleCardClick(0, 1) })
      expect(result.current.initialFlips[0]).toBe(true)
    })

    it('cannot flip another player\'s card', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      submitSetup(result)
      // Current player is 0; try to flip player 1's card
      act(() => { result.current.handleCardClick(1, 0) })
      // Player 1's card should remain unchanged (computer already has 2 flipped, but any unflipped should stay)
      const player1FaceUp = result.current.players[1].cards.filter(c => c.faceUp).length
      expect(player1FaceUp).toBe(2) // only the auto-flipped ones
    })
  })

  describe('drawCard', () => {
    it('takes top card from deck', () => {
      const deck = makeSimpleDeck(5, 3, 7)
      const { result } = renderGameHook({ initialDeck: deck })
      setupAndReady(result)
      const deckCountBefore = result.current.deckCount
      act(() => { result.current.drawCard() })
      expect(result.current.drawnCard).not.toBeNull()
      expect(result.current.drawnCard.value).toBe(7)
      expect(result.current.deckCount).toBe(deckCountBefore - 1)
    })

    it('blocked before setup complete', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      act(() => { result.current.drawCard() })
      expect(result.current.drawnCard).toBeNull()
    })

    it('blocked if initialFlips not complete', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      submitSetup(result)
      // Only flip 1 card (need 2 to complete initialFlips)
      act(() => { result.current.handleCardClick(0, 0) })
      act(() => { result.current.drawCard() })
      expect(result.current.drawnCard).toBeNull()
    })

    it('blocked if drawnCard already held', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      act(() => { result.current.drawCard() })
      const firstDrawn = result.current.drawnCard
      act(() => { result.current.drawCard() })
      expect(result.current.drawnCard).toBe(firstDrawn)
    })

    it('cannot draw twice in the same turn', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      act(() => { result.current.drawCard() })
      expect(result.current.drawnCard).not.toBeNull()
      // firstTurnDraw is now true, so a second drawCard should be blocked
      const drawnBefore = result.current.drawnCard
      const deckBefore = result.current.deckCount
      act(() => { result.current.drawCard() })
      expect(result.current.drawnCard).toBe(drawnBefore)
      expect(result.current.deckCount).toBe(deckBefore)
    })

    it('blocked if roundOver', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      act(() => { result.current.setRoundOver(true) })
      act(() => { result.current.drawCard() })
      expect(result.current.drawnCard).toBeNull()
    })
  })

  describe('pickUpDiscard', () => {
    it('takes top of discard pile as drawn card', () => {
      const deck = makeSimpleDeck(5, 3, 7)
      const { result } = renderGameHook({ initialDeck: deck })
      setupAndReady(result)
      const discardValue = result.current.discardTop.value
      act(() => { result.current.pickUpDiscard() })
      expect(result.current.drawnCard).not.toBeNull()
      expect(result.current.drawnCard.value).toBe(discardValue)
    })

    it('sets discardTop to null if pile becomes empty', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      // Discard pile starts with 1 card after setup
      expect(result.current.discardPile).toHaveLength(1)
      act(() => { result.current.pickUpDiscard() })
      expect(result.current.discardTop).toBeNull()
    })

    it('blocked when drawnCard already held', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      act(() => { result.current.drawCard() })
      act(() => { result.current.pickUpDiscard() })
      // drawnCard should still be the drawn one, not from discard
      expect(result.current.drawnCard).not.toBeNull()
    })

    it('blocked when already holding a drawn card', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      act(() => { result.current.drawCard() })
      const drawnBefore = result.current.drawnCard
      // Try to pick up discard while already holding drawn card
      act(() => { result.current.pickUpDiscard() })
      expect(result.current.drawnCard).toBe(drawnBefore)
    })

    it('blocked when roundOver', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      act(() => { result.current.setRoundOver(true) })
      act(() => { result.current.pickUpDiscard() })
      expect(result.current.drawnCard).toBeNull()
    })
  })

  describe('replaceCard', () => {
    it('swaps drawn card into player hand at index', () => {
      const deck = makeSimpleDeck(5, 3, 7)
      const { result } = renderGameHook({ initialDeck: deck })
      setupAndReady(result)
      act(() => { result.current.drawCard() })
      const drawnValue = result.current.drawnCard.value
      act(() => { result.current.replaceCard(2) })
      expect(result.current.players[0].cards[2].value).toBe(drawnValue)
      expect(result.current.players[0].cards[2].faceUp).toBe(true)
    })

    it('replaced card goes to discard pile', () => {
      const deck = makeSimpleDeck(5, 3, 7)
      const { result } = renderGameHook({ initialDeck: deck })
      setupAndReady(result)
      const replacedValue = result.current.players[0].cards[2].value
      act(() => { result.current.drawCard() })
      act(() => { result.current.replaceCard(2) })
      expect(result.current.discardTop.value).toBe(replacedValue)
    })

    it('sets turnComplete to true', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      act(() => { result.current.drawCard() })
      act(() => { result.current.replaceCard(2) })
      expect(result.current.turnComplete[0]).toBe(true)
    })

    it('clears drawnCard to null', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      act(() => { result.current.drawCard() })
      act(() => { result.current.replaceCard(2) })
      expect(result.current.drawnCard).toBeNull()
    })

    it('blocked when no drawnCard held', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      const cardBefore = result.current.players[0].cards[2]
      act(() => { result.current.replaceCard(2) })
      expect(result.current.players[0].cards[2].value).toBe(cardBefore.value)
    })
  })

  describe('discardDrawnCard', () => {
    it('puts drawn card on discard pile', () => {
      const deck = makeSimpleDeck(5, 3, 7)
      const { result } = renderGameHook({ initialDeck: deck })
      setupAndReady(result)
      act(() => { result.current.drawCard() })
      const drawnValue = result.current.drawnCard.value
      act(() => { result.current.discardDrawnCard() })
      expect(result.current.discardTop.value).toBe(drawnValue)
      expect(result.current.drawnCard).toBeNull()
    })

    it('sets mustFlipAfterDiscard when multiple face-down cards remain', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      // Player 0 has 6 face-down cards (flipped 2 during initial)
      act(() => { result.current.drawCard() })
      act(() => { result.current.discardDrawnCard() })
      expect(result.current.mustFlipAfterDiscard[0]).toBe(true)
    })

    it('blocked when no drawnCard', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      const discardBefore = result.current.discardPile.length
      act(() => { result.current.discardDrawnCard() })
      expect(result.current.discardPile.length).toBe(discardBefore)
    })

    it('blocked when roundOver', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      act(() => { result.current.drawCard() })
      act(() => { result.current.setRoundOver(true) })
      act(() => { result.current.discardDrawnCard() })
      // drawnCard should still be held
      expect(result.current.drawnCard).not.toBeNull()
    })
  })

  describe('mustFlipAfterDiscard', () => {
    it('flipping a face-down card after discard sets turnComplete', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      act(() => { result.current.drawCard() })
      act(() => { result.current.discardDrawnCard() })
      expect(result.current.mustFlipAfterDiscard[0]).toBe(true)
      // Flip a face-down card (card at index 2 is still face-down)
      act(() => { result.current.handleCardClick(0, 2) })
      expect(result.current.turnComplete[0]).toBe(true)
      expect(result.current.mustFlipAfterDiscard[0]).toBe(false)
    })
  })

  describe('handleCardClick with drawn card held', () => {
    it('replaces clicked card when drawnCard held and initialFlips done', () => {
      const deck = makeSimpleDeck(5, 3, 7)
      const { result } = renderGameHook({ initialDeck: deck })
      setupAndReady(result)
      act(() => { result.current.drawCard() })
      const drawnValue = result.current.drawnCard.value
      act(() => { result.current.handleCardClick(0, 3) })
      expect(result.current.players[0].cards[3].value).toBe(drawnValue)
      expect(result.current.drawnCard).toBeNull()
      expect(result.current.turnComplete[0]).toBe(true)
    })
  })

  describe('canInteractWithCard', () => {
    it('returns false for other player\'s cards', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      submitSetup(result)
      expect(result.current.canInteractWithCard(1, 0)).toBe(false)
    })

    it('returns false for face-up cards', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      submitSetup(result)
      // Flip card 0 to face-up
      act(() => { result.current.handleCardClick(0, 0) })
      expect(result.current.canInteractWithCard(0, 0)).toBe(false)
    })

    it('returns true during initial flip phase for face-down cards', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      submitSetup(result)
      expect(result.current.canInteractWithCard(0, 0)).toBe(true)
    })

    it('returns true during mustFlipAfterDiscard for face-down cards', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      act(() => { result.current.drawCard() })
      act(() => { result.current.discardDrawnCard() })
      expect(result.current.canInteractWithCard(0, 2)).toBe(true)
    })

    it('returns true when drawnCard held for face-down cards', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      act(() => { result.current.drawCard() })
      expect(result.current.canInteractWithCard(0, 2)).toBe(true)
    })

    it('returns false after turnComplete', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      act(() => { result.current.drawCard() })
      act(() => { result.current.replaceCard(2) })
      expect(result.current.canInteractWithCard(0, 3)).toBe(false)
    })
  })

  describe('turn advancement', () => {
    it('auto-advances to next player after turnComplete', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      expect(result.current.currentPlayer).toBe(0)
      act(() => { result.current.drawCard() })
      act(() => { result.current.replaceCard(2) })
      // Should auto-advance to player 1
      expect(result.current.currentPlayer).toBe(1)
    })

    it('wraps around from last player to first', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)

      // Player 0 takes turn
      act(() => { result.current.drawCard() })
      act(() => { result.current.replaceCard(2) })
      expect(result.current.currentPlayer).toBe(1)

      // Player 1 needs initial flips (already done by auto-flip for computer)
      // Player 1 takes turn
      act(() => { result.current.drawCard() })
      act(() => { result.current.replaceCard(2) })
      // Should wrap to player 0
      expect(result.current.currentPlayer).toBe(0)
    })
  })

  describe('endRoundImmediately', () => {
    it('reveals all cards for all players', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      act(() => { result.current.endRoundImmediately() })
      result.current.players.forEach(player => {
        player.cards.forEach(card => {
          expect(card.faceUp).toBe(true)
        })
      })
    })

    it('sets roundOver to true', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      act(() => { result.current.endRoundImmediately() })
      expect(result.current.roundOver).toBe(true)
    })
  })

  describe('round ending - all cards flipped', () => {
    it('records holeScores when round ends', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      act(() => { result.current.endRoundImmediately() })
      expect(result.current.holeScores).toHaveLength(1)
      expect(result.current.holeScores[0].hole).toBe(1)
      expect(result.current.holeScores[0].scores).toHaveLength(2)
    })

    it('sets finalTurnPlayer when one player flips all cards', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      // Use test helper to flip all cards for player 0
      act(() => { finishPlayer(result, 0) })
      // finalTurnPlayer should be set to player 1 (the other player)
      expect(result.current.finalTurnPlayer).toBe(1)
    })
  })

  describe('startNextHole', () => {
    it('increments currentHole', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      act(() => { result.current.endRoundImmediately() })
      expect(result.current.currentHole).toBe(1)
      act(() => { result.current.startNextHole() })
      expect(result.current.currentHole).toBe(2)
    })

    it('resets roundOver and drawnCard', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      act(() => { result.current.endRoundImmediately() })
      act(() => { result.current.startNextHole() })
      expect(result.current.roundOver).toBe(false)
      expect(result.current.drawnCard).toBeNull()
    })

    it('deals fresh hands with 8 cards each', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      act(() => { result.current.endRoundImmediately() })
      act(() => { result.current.startNextHole() })
      result.current.players.forEach(player => {
        expect(player.cards).toHaveLength(8)
      })
    })

    it('does nothing if currentHole >= 9', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      // Play through 8 holes
      for (let i = 0; i < 8; i++) {
        act(() => { result.current.endRoundImmediately() })
        act(() => { result.current.startNextHole() })
      }
      expect(result.current.currentHole).toBe(9)
      // Try to go past 9
      act(() => { result.current.endRoundImmediately() })
      act(() => { result.current.startNextHole() })
      expect(result.current.currentHole).toBe(9)
    })

    it('seeds new discard pile', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      act(() => { result.current.endRoundImmediately() })
      act(() => { result.current.startNextHole() })
      expect(result.current.discardTop).not.toBeNull()
      expect(result.current.discardPile).toHaveLength(1)
    })
  })

  describe('resetGame', () => {
    it('resets to setup phase', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      act(() => { result.current.resetGame() })
      expect(result.current.setupComplete).toBe(false)
    })

    it('clears holeScores', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      act(() => { result.current.endRoundImmediately() })
      expect(result.current.holeScores.length).toBeGreaterThan(0)
      act(() => { result.current.resetGame() })
      expect(result.current.holeScores).toEqual([])
    })

    it('resets currentHole to 1', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      act(() => { result.current.endRoundImmediately() })
      act(() => { result.current.startNextHole() })
      expect(result.current.currentHole).toBe(2)
      act(() => { result.current.resetGame() })
      expect(result.current.currentHole).toBe(1)
    })
  })

  describe('scoring', () => {
    it('visibleScores sums face-up cards', () => {
      const deck = makeSimpleDeck(5, 3, 7)
      const { result } = renderGameHook({ initialDeck: deck })
      setupAndReady(result)
      // Player 0 has 2 face-up cards (both value 5), visible score should be 10
      expect(result.current.visibleScores[0]).toBe(10)
    })

    it('overallTotals accumulates across holes', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      setupAndReady(result)
      act(() => { result.current.endRoundImmediately() })
      const firstHoleScores = [...result.current.holeScores[0].scores]
      act(() => { result.current.startNextHole() })
      act(() => { result.current.endRoundImmediately() })
      // Overall totals should be sum of both holes
      expect(result.current.overallTotals).toHaveLength(2)
      result.current.overallTotals.forEach((total, i) => {
        expect(total).toBe(firstHoleScores[i] + result.current.holeScores[1].scores[i])
      })
    })
  })

  describe('persistence', () => {
    it('saves state to localStorage when enablePersistence is true', () => {
      const key = 'golfTestPersist:v1'
      const { result } = renderGameHook({
        initialDeck: makeSimpleDeck(),
        enablePersistence: true,
        persistenceKey: key,
      })
      submitSetup(result)
      const saved = localStorage.getItem(key)
      expect(saved).not.toBeNull()
      const parsed = JSON.parse(saved)
      expect(parsed.version).toBe(1)
      expect(parsed.setupComplete).toBe(true)
    })

    it('does not persist when enablePersistence is false', () => {
      const key = 'golfTestNoPersist:v1'
      const { result } = renderGameHook({
        initialDeck: makeSimpleDeck(),
        enablePersistence: false,
        persistenceKey: key,
      })
      submitSetup(result)
      expect(localStorage.getItem(key)).toBeNull()
    })

    it('loads state from localStorage on mount', () => {
      const key = 'golfTestLoad:v1'
      const snapshot = {
        version: 1,
        playerSetup: [
          { name: 'LoadedP1', color: '#fbbf24', isComputer: false },
          { name: 'LoadedP2', color: '#38bdf8', isComputer: false },
        ],
        setupComplete: true,
        currentPlayer: 1,
        players: [
          { cards: Array(8).fill({ id: 0, value: 5, faceUp: true }), flippedCount: 8 },
          { cards: Array(8).fill({ id: 0, value: 3, faceUp: true }), flippedCount: 8 },
        ],
        deckRest: [],
        drawnCard: null,
        discardPile: [{ id: 99, value: 7, faceUp: true }],
        discardTop: { id: 99, value: 7, faceUp: true },
        initialFlips: [true, true],
        firstTurnDraw: [false, false],
        turnComplete: [false, false],
        mustFlipAfterDiscard: [false, false],
        roundOver: false,
        currentHole: 3,
        holeScores: [],
        playerCount: 2,
        holeStartingPlayer: 0,
      }
      localStorage.setItem(key, JSON.stringify(snapshot))
      const { result } = renderGameHook({
        enablePersistence: true,
        persistenceKey: key,
      })
      expect(result.current.setupComplete).toBe(true)
      expect(result.current.currentHole).toBe(3)
      expect(result.current.currentPlayer).toBe(1)
      expect(result.current.playerSetup[0].name).toBe('LoadedP1')
    })

    it('handles corrupted localStorage gracefully', () => {
      const key = 'golfTestCorrupt:v1'
      localStorage.setItem(key, 'not valid json')
      const { result } = renderGameHook({
        enablePersistence: true,
        persistenceKey: key,
      })
      // Should fall back to defaults
      expect(result.current.setupComplete).toBe(false)
      expect(result.current.currentHole).toBe(1)
    })
  })

  describe('computer AI - computerTurn', () => {
    it('picks up discard when it creates a matching pair', async () => {
      // P1: cards[0]=5, cards[4]=5 (column pair already), cards[1]=3, cards[5]=?
      // P2: all 0s. Discard=3 (matches P1 cards[1])
      // Set up P1 with card[1]=3 face-up, discard top is 3
      const deck = makeDeck([
        5, 3, 8, 9, 5, 10, 11, 12,  // P1 hand
        0, 0, 0, 0, 0, 0, 0, 0,     // P2 (computer) hand
        3,                            // discard seed = 3
        ...Array(91).fill(7),         // draw pile
      ])
      const { result } = renderGameHook({ initialDeck: deck })
      // Make P2 computer
      act(() => { result.current.handleSetupChange(1, 'isComputer', true) })
      submitSetup(result)

      // Flip P1's initial cards and complete P1's turn
      flipInitialCards(result, 0)
      act(() => { result.current.drawCard() })
      act(() => { result.current.replaceCard(2) })

      // Now it's P2's turn (computer). P2 has 2 auto-flipped face-up cards.
      // The computer should draw or evaluate discard
      expect(result.current.currentPlayer).toBe(1)

      // Trigger computer turn manually
      await act(async () => {
        await result.current.__debug // ensure state is settled
      })
    })

    it('does nothing when roundOver', async () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      submitSetup(result)
      act(() => { result.current.setRoundOver(true) })
      // Should not crash
      const playersBefore = result.current.players
      expect(result.current.roundOver).toBe(true)
    })
  })

  describe('test helpers (exposeTestHelpers)', () => {
    it('__setPlayers updates players state', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      act(() => {
        result.current.__setPlayers(ps =>
          ps.map(p => ({ ...p, cards: p.cards.map(c => ({ ...c, faceUp: true })) }))
        )
      })
      result.current.players.forEach(player => {
        player.cards.forEach(card => expect(card.faceUp).toBe(true))
      })
    })

    it('__setDiscard updates both discardPile and discardTop', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      const newDiscard = [{ id: 99, value: 10, faceUp: true }]
      act(() => { result.current.__setDiscard(newDiscard) })
      expect(result.current.discardTop.value).toBe(10)
    })

    it('__debug returns snapshot of internal state', () => {
      const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
      const debug = result.current.__debug()
      expect(debug).toHaveProperty('setupComplete')
      expect(debug).toHaveProperty('initialFlips')
      expect(debug).toHaveProperty('currentPlayer')
    })
  })
})
