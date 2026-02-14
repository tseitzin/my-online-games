import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from '@testing-library/react'
import Explosion from './Explosion'

describe('Explosion component', () => {
  let rafCallbacks: ((time: number) => void)[]
  let rafSpy: ReturnType<typeof vi.spyOn>
  let dateNowSpy: ReturnType<typeof vi.spyOn>
  let currentTime: number

  beforeEach(() => {
    rafCallbacks = []
    rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb)
      return rafCallbacks.length
    })
    currentTime = 1000
    dateNowSpy = vi.spyOn(Date, 'now').mockImplementation(() => currentTime)
  })

  afterEach(() => {
    rafSpy.mockRestore()
    dateNowSpy.mockRestore()
  })

  function getLines(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll('.bg-red-600')) as HTMLElement[]
  }

  // ─── Rendering ────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders 8 radial line elements with bg-red-600 class', () => {
      const onComplete = vi.fn()
      const { container } = render(<Explosion x={100} y={200} onComplete={onComplete} />)
      const lines = getLines(container)
      expect(lines).toHaveLength(8)
    })

    it('positions container at x, y coordinates', () => {
      const onComplete = vi.fn()
      const { container } = render(<Explosion x={150} y={250} onComplete={onComplete} />)
      const outerDiv = container.firstChild as HTMLElement
      expect(outerDiv.style.left).toBe('150px')
      expect(outerDiv.style.top).toBe('250px')
    })

    it('lines have width of 3px', () => {
      const onComplete = vi.fn()
      const { container } = render(<Explosion x={100} y={200} onComplete={onComplete} />)
      const lines = getLines(container)
      lines.forEach((line) => {
        expect(line.style.width).toBe('3px')
      })
    })

    it('lines have height of 14px', () => {
      const onComplete = vi.fn()
      const { container } = render(<Explosion x={100} y={200} onComplete={onComplete} />)
      const lines = getLines(container)
      lines.forEach((line) => {
        expect(line.style.height).toBe('14px')
      })
    })

    it('each line has unique rotation angle (0, 45, 90, 135, 180, 225, 270, 315 degrees)', () => {
      const onComplete = vi.fn()
      const { container } = render(<Explosion x={100} y={200} onComplete={onComplete} />)
      const lines = getLines(container)
      const expectedAngles = [0, 45, 90, 135, 180, 225, 270, 315]

      lines.forEach((line, i) => {
        expect(line.style.transform).toContain(`rotate(${expectedAngles[i]}deg)`)
      })
    })
  })

  // ─── Animation ────────────────────────────────────────────────────────────

  describe('animation', () => {
    it('starts with full opacity (1) when progress is 0', () => {
      const onComplete = vi.fn()
      const { container } = render(<Explosion x={100} y={200} onComplete={onComplete} />)
      const lines = getLines(container)
      lines.forEach((line) => {
        expect(line.style.opacity).toBe('1')
      })
    })

    it('opacity decreases as animation progresses', () => {
      const onComplete = vi.fn()
      const { container } = render(<Explosion x={100} y={200} onComplete={onComplete} />)

      // Advance time to 500ms (50% progress)
      currentTime = 1500
      act(() => {
        const cb = rafCallbacks.shift()
        if (cb) cb(currentTime)
      })

      const lines = getLines(container)
      lines.forEach((line) => {
        expect(parseFloat(line.style.opacity)).toBe(0.5)
      })
    })

    it('calls onComplete when animation reaches 1.0 progress (elapsed >= 1000ms)', () => {
      const onComplete = vi.fn()
      render(<Explosion x={100} y={200} onComplete={onComplete} />)

      expect(onComplete).not.toHaveBeenCalled()

      // Advance time to 1000ms (100% progress)
      currentTime = 2000
      act(() => {
        const cb = rafCallbacks.shift()
        if (cb) cb(currentTime)
      })

      expect(onComplete).toHaveBeenCalledTimes(1)
    })
  })

  // ─── RAF usage ────────────────────────────────────────────────────────────

  describe('RAF usage', () => {
    it('calls requestAnimationFrame to start animation', () => {
      const onComplete = vi.fn()
      render(<Explosion x={100} y={200} onComplete={onComplete} />)

      expect(rafSpy).toHaveBeenCalled()
      expect(rafCallbacks).toHaveLength(1)
    })

    it('continues requesting frames until animation completes', () => {
      const onComplete = vi.fn()
      render(<Explosion x={100} y={200} onComplete={onComplete} />)

      // Initial RAF call from useEffect
      expect(rafSpy).toHaveBeenCalledTimes(1)

      // Advance to 50% - should schedule another frame
      currentTime = 1500
      act(() => {
        const cb = rafCallbacks.shift()
        if (cb) cb(currentTime)
      })
      expect(rafSpy).toHaveBeenCalledTimes(2)
      expect(rafCallbacks).toHaveLength(1)

      // Advance to 100% - should NOT schedule another frame
      currentTime = 2000
      act(() => {
        const cb = rafCallbacks.shift()
        if (cb) cb(currentTime)
      })
      // No new RAF scheduled after completion
      expect(rafCallbacks).toHaveLength(0)
      expect(onComplete).toHaveBeenCalledTimes(1)
    })
  })
})
