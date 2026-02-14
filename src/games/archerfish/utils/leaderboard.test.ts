import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getLeaderboard, saveLeaderboardEntry, clearLeaderboard } from './leaderboard'
import type { LeaderboardEntry } from './leaderboard'

const STORAGE_KEY = 'archerfish:leaderboard'

function makeEntry(overrides?: Partial<LeaderboardEntry>): LeaderboardEntry {
  return {
    id: 'test-1',
    player_name: 'Player 1',
    survival_time: 60,
    difficulty: 'medium',
    is_human: true,
    timestamp: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('leaderboard', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('getLeaderboard', () => {
    it('returns empty array when localStorage has no data', () => {
      const result = getLeaderboard()
      expect(result).toEqual([])
    })

    it('returns all entries when no difficulty filter is specified', () => {
      const entries = [
        makeEntry({ id: '1', difficulty: 'easy', survival_time: 30 }),
        makeEntry({ id: '2', difficulty: 'medium', survival_time: 60 }),
        makeEntry({ id: '3', difficulty: 'hard', survival_time: 90 }),
      ]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))

      const result = getLeaderboard()
      expect(result).toHaveLength(3)
    })

    it('filters entries by difficulty when specified', () => {
      const entries = [
        makeEntry({ id: '1', difficulty: 'easy', survival_time: 30 }),
        makeEntry({ id: '2', difficulty: 'medium', survival_time: 60 }),
        makeEntry({ id: '3', difficulty: 'easy', survival_time: 50 }),
        makeEntry({ id: '4', difficulty: 'hard', survival_time: 90 }),
      ]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))

      const result = getLeaderboard('easy')
      expect(result).toHaveLength(2)
      expect(result.every(e => e.difficulty === 'easy')).toBe(true)
    })

    it('sorts entries by survival_time in descending order', () => {
      const entries = [
        makeEntry({ id: '1', survival_time: 30 }),
        makeEntry({ id: '2', survival_time: 90 }),
        makeEntry({ id: '3', survival_time: 60 }),
      ]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))

      const result = getLeaderboard()
      expect(result[0].survival_time).toBe(90)
      expect(result[1].survival_time).toBe(60)
      expect(result[2].survival_time).toBe(30)
    })

    it('limits results to the specified limit', () => {
      const entries = Array.from({ length: 15 }, (_, i) =>
        makeEntry({ id: `${i}`, survival_time: i * 10 })
      )
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))

      const result = getLeaderboard(undefined, 5)
      expect(result).toHaveLength(5)
    })

    it('defaults limit to 10', () => {
      const entries = Array.from({ length: 15 }, (_, i) =>
        makeEntry({ id: `${i}`, survival_time: i * 10 })
      )
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))

      const result = getLeaderboard()
      expect(result).toHaveLength(10)
    })

    it('returns empty array when localStorage contains corrupt JSON', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      localStorage.setItem(STORAGE_KEY, '{not valid json!!!')

      const result = getLeaderboard()
      expect(result).toEqual([])
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('saveLeaderboardEntry', () => {
    it('saves an entry to empty localStorage', () => {
      const result = saveLeaderboardEntry({
        player_name: 'Alice',
        survival_time: 120,
        difficulty: 'hard',
        is_human: true,
      })

      expect(result).toBe(true)
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored).toHaveLength(1)
      expect(stored[0].player_name).toBe('Alice')
      expect(stored[0].survival_time).toBe(120)
    })

    it('appends to existing entries', () => {
      const existing = [makeEntry({ id: 'existing-1' })]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))

      saveLeaderboardEntry({
        player_name: 'Bob',
        survival_time: 80,
        difficulty: 'easy',
        is_human: false,
      })

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored).toHaveLength(2)
      expect(stored[0].id).toBe('existing-1')
      expect(stored[1].player_name).toBe('Bob')
    })

    it('generates an id for the new entry', () => {
      saveLeaderboardEntry({
        player_name: 'Charlie',
        survival_time: 50,
        difficulty: 'medium',
        is_human: true,
      })

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored[0].id).toBeDefined()
      expect(typeof stored[0].id).toBe('string')
      expect(stored[0].id.length).toBeGreaterThan(0)
    })

    it('generates a timestamp for the new entry', () => {
      saveLeaderboardEntry({
        player_name: 'Diana',
        survival_time: 45,
        difficulty: 'easy',
        is_human: true,
      })

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored[0].timestamp).toBeDefined()
      // Verify it is a valid ISO date string
      const parsed = new Date(stored[0].timestamp)
      expect(parsed.getTime()).not.toBeNaN()
    })

    it('returns true on successful save', () => {
      const result = saveLeaderboardEntry({
        player_name: 'Eve',
        survival_time: 100,
        difficulty: 'hard',
        is_human: true,
      })

      expect(result).toBe(true)
    })

    it('returns false when localStorage.setItem throws', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      const result = saveLeaderboardEntry({
        player_name: 'Frank',
        survival_time: 70,
        difficulty: 'medium',
        is_human: true,
      })

      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('clearLeaderboard', () => {
    it('removes all entries when no difficulty is specified', () => {
      const entries = [
        makeEntry({ id: '1', difficulty: 'easy' }),
        makeEntry({ id: '2', difficulty: 'hard' }),
      ]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))

      const result = clearLeaderboard()
      expect(result).toBe(true)
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('removes only entries for the specified difficulty', () => {
      const entries = [
        makeEntry({ id: '1', difficulty: 'easy', survival_time: 30 }),
        makeEntry({ id: '2', difficulty: 'medium', survival_time: 60 }),
        makeEntry({ id: '3', difficulty: 'easy', survival_time: 50 }),
        makeEntry({ id: '4', difficulty: 'hard', survival_time: 90 }),
      ]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))

      const result = clearLeaderboard('easy')
      expect(result).toBe(true)

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored).toHaveLength(2)
      expect(stored.every((e: LeaderboardEntry) => e.difficulty !== 'easy')).toBe(true)
    })

    it('preserves entries of other difficulties when clearing one difficulty', () => {
      const entries = [
        makeEntry({ id: '1', difficulty: 'easy', player_name: 'Alice' }),
        makeEntry({ id: '2', difficulty: 'medium', player_name: 'Bob' }),
        makeEntry({ id: '3', difficulty: 'hard', player_name: 'Charlie' }),
      ]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))

      clearLeaderboard('medium')

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored).toHaveLength(2)
      expect(stored.map((e: LeaderboardEntry) => e.player_name)).toEqual(['Alice', 'Charlie'])
    })

    it('returns true when clearing with no existing data', () => {
      const result = clearLeaderboard()
      expect(result).toBe(true)
    })

    it('returns true when clearing a difficulty from empty localStorage', () => {
      const result = clearLeaderboard('hard')
      expect(result).toBe(true)
    })

    it('returns false when localStorage throws an error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      const result = clearLeaderboard()
      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalled()
    })
  })
})
