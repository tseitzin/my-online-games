import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { RaceCanvas } from './RaceCanvas'
import { makeCar, mockCanvasGetContext } from '../test/raceTestHelpers'
import { TrackType } from '../../../types/race'

let rafCallback: ((time: number) => void) | null = null
let canvasMock: ReturnType<typeof mockCanvasGetContext>

beforeEach(() => {
  canvasMock = mockCanvasGetContext()
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    rafCallback = cb
    return 1
  })
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
})

afterEach(() => {
  rafCallback = null
  canvasMock.restore()
  vi.restoreAllMocks()
})

const defaultProps = {
  cars: [makeCar(), makeCar({ id: 'ai-0', isAI: true, lane: 1 })],
  isRacing: false,
  targetLaps: 3,
  trackType: TrackType.Oval,
  playerInputs: {},
  onCarsUpdate: vi.fn(),
  onRaceFinished: vi.fn(),
}

describe('RaceCanvas', () => {
  it('mounts without error', () => {
    expect(() => render(<RaceCanvas {...defaultProps} />)).not.toThrow()
  })

  it('requests animation frame on mount', () => {
    render(<RaceCanvas {...defaultProps} />)
    expect(window.requestAnimationFrame).toHaveBeenCalled()
  })

  it('cancels animation frame on unmount', () => {
    const { unmount } = render(<RaceCanvas {...defaultProps} />)
    unmount()
    expect(window.cancelAnimationFrame).toHaveBeenCalled()
  })
})
