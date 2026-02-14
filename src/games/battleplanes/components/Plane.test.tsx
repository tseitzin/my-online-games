import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Plane from './Plane'
import { makePlane } from '../test/battlePlanesTestHelpers'

describe('Plane component', () => {
  // ─── Positioning ──────────────────────────────────────────────────────────

  describe('positioning', () => {
    it('positions container div at plane.x and plane.y using inline style left/top', () => {
      const plane = makePlane({ x: 300, y: 150 })
      const { container } = render(<Plane plane={plane} />)
      const outerDiv = container.firstChild as HTMLElement
      expect(outerDiv.style.left).toBe('300px')
      expect(outerDiv.style.top).toBe('150px')
    })

    it('sets width from plane.width', () => {
      const plane = makePlane({ width: 200 })
      const { container } = render(<Plane plane={plane} />)
      const outerDiv = container.firstChild as HTMLElement
      expect(outerDiv.style.width).toBe('200px')
    })

    it('sets height from plane.height', () => {
      const plane = makePlane({ height: 80 })
      const { container } = render(<Plane plane={plane} />)
      const outerDiv = container.firstChild as HTMLElement
      expect(outerDiv.style.height).toBe('80px')
    })
  })

  // ─── Image rendering ─────────────────────────────────────────────────────

  describe('image rendering', () => {
    it('renders an img element with plane image src', () => {
      const plane = makePlane()
      render(<Plane plane={plane} />)
      const img = screen.getByRole('img')
      expect(img).toBeDefined()
      expect(img.getAttribute('src')).toBeTruthy()
    })

    it('renders alt text "Plane {number}"', () => {
      const plane = makePlane({ number: 5 })
      render(<Plane plane={plane} />)
      const img = screen.getByAltText('Plane 5')
      expect(img).toBeDefined()
    })

    it('has scale-x-[-1] class when direction is right (flipped)', () => {
      const plane = makePlane({ direction: 'right' })
      render(<Plane plane={plane} />)
      const img = screen.getByRole('img')
      expect(img.className).toContain('scale-x-[-1]')
    })

    it('does NOT have scale-x-[-1] class when direction is left', () => {
      const plane = makePlane({ direction: 'left' })
      render(<Plane plane={plane} />)
      const img = screen.getByRole('img')
      expect(img.className).not.toContain('scale-x-[-1]')
    })
  })

  // ─── Number overlay ───────────────────────────────────────────────────────

  describe('number overlay', () => {
    it('displays the plane number as text', () => {
      const plane = makePlane({ number: 7 })
      render(<Plane plane={plane} />)
      expect(screen.getByText('7')).toBeDefined()
    })

    it('positions number at left: 25% for right-facing planes', () => {
      const plane = makePlane({ direction: 'right' })
      render(<Plane plane={plane} />)
      const numberSpan = screen.getByText(String(plane.number))
      expect(numberSpan.style.left).toBe('25%')
    })

    it('positions number at left: 75% for left-facing planes', () => {
      const plane = makePlane({ direction: 'left' })
      render(<Plane plane={plane} />)
      const numberSpan = screen.getByText(String(plane.number))
      expect(numberSpan.style.left).toBe('75%')
    })

    it('has text shadow for visibility', () => {
      const plane = makePlane()
      render(<Plane plane={plane} />)
      const numberSpan = screen.getByText(String(plane.number))
      expect(numberSpan.style.textShadow).toContain('-1px -1px 0 #000')
    })

    it('has text-white class for white text', () => {
      const plane = makePlane()
      render(<Plane plane={plane} />)
      const numberSpan = screen.getByText(String(plane.number))
      expect(numberSpan.className).toContain('text-white')
    })
  })
})
