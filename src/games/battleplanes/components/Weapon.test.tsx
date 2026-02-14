import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import Weapon from './Weapon'
import { setupWindowDimensions } from '../test/battlePlanesTestHelpers'

describe('Weapon component', () => {
  beforeEach(() => {
    setupWindowDimensions(1024, 768)
  })

  // ─── Base rendering ───────────────────────────────────────────────────────

  describe('base rendering', () => {
    it('renders "BLOW UP" text on weapon platform', () => {
      render(<Weapon recharging={false} lightningActive={false} rechargeProgress={0} />)
      expect(screen.getByText('BLOW UP')).toBeDefined()
    })

    it('renders the red control ball with from-red-600 gradient', () => {
      const { container } = render(
        <Weapon recharging={false} lightningActive={false} rechargeProgress={0} />
      )
      const redBall = container.querySelector('.from-red-600')
      expect(redBall).not.toBeNull()
    })

    it('renders fixed bottom-center positioning', () => {
      const { container } = render(
        <Weapon recharging={false} lightningActive={false} rechargeProgress={0} />
      )
      const outerDiv = container.firstChild as HTMLElement
      expect(outerDiv.className).toContain('fixed')
    })

    it('renders base platform bar', () => {
      const { container } = render(
        <Weapon recharging={false} lightningActive={false} rechargeProgress={0} />
      )
      const baseBar = container.querySelector('.border-t-2')
      expect(baseBar).not.toBeNull()
      expect(baseBar!.className).toContain('w-24')
      expect(baseBar!.className).toContain('h-4')
    })
  })

  // ─── Lightning bolt ─────────────────────────────────────────────────────

  describe('lightning bolt', () => {
    it('shows lightning SVG when lightningActive is true', () => {
      const { container } = render(
        <Weapon recharging={false} lightningActive={true} rechargeProgress={0} />
      )
      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThanOrEqual(1)
    })

    it('hides lightning SVG when lightningActive is false', () => {
      const { container } = render(
        <Weapon recharging={false} lightningActive={false} rechargeProgress={0} />
      )
      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBe(0)
    })

    it('SVG has width of 50', () => {
      const { container } = render(
        <Weapon recharging={false} lightningActive={true} rechargeProgress={0} />
      )
      const svg = container.querySelector('svg.animate-pulse')
      expect(svg).not.toBeNull()
      expect(svg!.getAttribute('width')).toBe('50')
    })

    it('renders main bolt path element', () => {
      const { container } = render(
        <Weapon recharging={false} lightningActive={true} rechargeProgress={0} />
      )
      const paths = container.querySelectorAll('path')
      // Main bolt path has fill="url(#lightningGradient)"
      const mainBolt = Array.from(paths).find(
        p => p.getAttribute('fill') === 'url(#lightningGradient)' && p.getAttribute('filter') === 'url(#glow)'
      )
      expect(mainBolt).not.toBeNull()
    })

    it('renders core highlight path element', () => {
      const { container } = render(
        <Weapon recharging={false} lightningActive={true} rechargeProgress={0} />
      )
      const paths = container.querySelectorAll('path')
      // Core highlight has stroke="#ffffff"
      const corePath = Array.from(paths).find(
        p => p.getAttribute('stroke') === '#ffffff'
      )
      expect(corePath).not.toBeNull()
    })

    it('renders 6 total path elements when active (3 branches + main + core + crackle)', () => {
      const { container } = render(
        <Weapon recharging={false} lightningActive={true} rechargeProgress={0} />
      )
      const svg = container.querySelector('svg.animate-pulse')
      expect(svg).not.toBeNull()
      const paths = svg!.querySelectorAll('path')
      expect(paths.length).toBe(6)
    })

    it('renders Zap icon when lightning active', () => {
      const { container } = render(
        <Weapon recharging={false} lightningActive={true} rechargeProgress={0} />
      )
      // Lucide Zap renders as an svg with class containing text-cyan-300
      // There should be 2 SVGs: the lightning bolt SVG and the Zap icon SVG
      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBe(2)
    })

    it('hides Zap icon when lightning not active', () => {
      const { container } = render(
        <Weapon recharging={false} lightningActive={false} rechargeProgress={0} />
      )
      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBe(0)
    })

    it('lightning height is at least 600 (minimum)', () => {
      // Even with a small window, height should be at least 600
      setupWindowDimensions(1024, 500)
      const { container } = render(
        <Weapon recharging={false} lightningActive={true} rechargeProgress={0} />
      )
      const svg = container.querySelector('svg.animate-pulse')
      expect(svg).not.toBeNull()
      const height = parseInt(svg!.getAttribute('height')!, 10)
      expect(height).toBeGreaterThanOrEqual(600)
    })
  })

  // ─── Recharge bar ───────────────────────────────────────────────────────

  describe('recharge bar', () => {
    it('shows recharge section when recharging is true', () => {
      render(<Weapon recharging={true} lightningActive={false} rechargeProgress={50} />)
      expect(screen.getByText('RECHARGING')).toBeDefined()
    })

    it('hides recharge section when recharging is false', () => {
      render(<Weapon recharging={false} lightningActive={false} rechargeProgress={50} />)
      expect(screen.queryByText('RECHARGING')).toBeNull()
    })

    it('shows "RECHARGING" text during recharge', () => {
      render(<Weapon recharging={true} lightningActive={false} rechargeProgress={75} />)
      const text = screen.getByText('RECHARGING')
      expect(text).toBeDefined()
      expect(text.className).toContain('text-cyan-300')
    })

    it('recharge fill bar width matches rechargeProgress percentage', () => {
      const { container } = render(
        <Weapon recharging={true} lightningActive={false} rechargeProgress={65} />
      )
      const fillBar = container.querySelector('.from-cyan-500') as HTMLElement
      expect(fillBar).not.toBeNull()
      expect(fillBar.style.width).toBe('65%')
    })

    it('at 0% progress, fill width is "0%"', () => {
      const { container } = render(
        <Weapon recharging={true} lightningActive={false} rechargeProgress={0} />
      )
      const fillBar = container.querySelector('.from-cyan-500') as HTMLElement
      expect(fillBar).not.toBeNull()
      expect(fillBar.style.width).toBe('0%')
    })
  })

  // ─── Ready indicator ──────────────────────────────────────────────────────

  describe('ready indicator', () => {
    it('shows ping animation (animate-ping class) when NOT recharging', () => {
      const { container } = render(
        <Weapon recharging={false} lightningActive={false} rechargeProgress={0} />
      )
      const pingElement = container.querySelector('.animate-ping')
      expect(pingElement).not.toBeNull()
    })

    it('hides ping animation when recharging', () => {
      const { container } = render(
        <Weapon recharging={true} lightningActive={false} rechargeProgress={50} />
      )
      const pingElement = container.querySelector('.animate-ping')
      expect(pingElement).toBeNull()
    })
  })

  // ─── Resize handling ──────────────────────────────────────────────────────

  describe('resize handling', () => {
    it('updates lightning height when window resize fires', () => {
      setupWindowDimensions(1024, 768)
      const { container } = render(
        <Weapon recharging={false} lightningActive={true} rechargeProgress={0} />
      )

      const svg = container.querySelector('svg.animate-pulse')
      const initialHeight = parseInt(svg!.getAttribute('height')!, 10)
      // 768 - 160 = 608
      expect(initialHeight).toBe(608)

      // Resize to a larger window
      act(() => {
        Object.defineProperty(window, 'innerHeight', { value: 1200, writable: true, configurable: true })
        fireEvent(window, new Event('resize'))
      })

      const newHeight = parseInt(svg!.getAttribute('height')!, 10)
      // 1200 - 160 = 1040
      expect(newHeight).toBe(1040)
    })

    it('lightning height uses formula max(window.innerHeight - 160, 600)', () => {
      // Case 1: window height that results in > 600
      setupWindowDimensions(1024, 900)
      const { container, unmount } = render(
        <Weapon recharging={false} lightningActive={true} rechargeProgress={0} />
      )
      const svg1 = container.querySelector('svg.animate-pulse')
      // 900 - 160 = 740 > 600, so height = 740
      expect(parseInt(svg1!.getAttribute('height')!, 10)).toBe(740)

      unmount()

      // Case 2: window height that would result in < 600, clamped to 600
      setupWindowDimensions(1024, 700)
      const { container: container2 } = render(
        <Weapon recharging={false} lightningActive={true} rechargeProgress={0} />
      )
      const svg2 = container2.querySelector('svg.animate-pulse')
      // 700 - 160 = 540 < 600, so height = 600
      expect(parseInt(svg2!.getAttribute('height')!, 10)).toBe(600)
    })
  })
})
