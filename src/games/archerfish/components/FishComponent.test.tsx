import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FishComponent from './FishComponent'
import { makeFish } from '../test/archerFishTestHelpers'

describe('FishComponent', () => {
  it('renders fish name', () => {
    const fish = makeFish({ name: 'Nemo' })
    render(<FishComponent fish={fish} />)
    expect(screen.getByText('Nemo')).toBeInTheDocument()
  })

  it('positions at fish coordinates', () => {
    const fish = makeFish({ position: { x: 250, y: 300 } })
    const { container } = render(<FishComponent fish={fish} />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.left).toBe('250px')
    expect(wrapper.style.top).toBe('300px')
  })

  it('shows snowflake indicator when frozen', () => {
    const fish = makeFish({ isFrozen: true })
    const { container } = render(<FishComponent fish={fish} />)
    // Snowflake from lucide-react renders as an SVG with class containing 'lucide-snowflake'
    const snowflake = container.querySelector('.animate-pulse')
    expect(snowflake).toBeTruthy()
  })

  it('does not show snowflake when not frozen', () => {
    const fish = makeFish({ isFrozen: false })
    const { container } = render(<FishComponent fish={fish} />)
    // No snowflake pulse element when not frozen
    const snowflake = container.querySelector('.text-blue-300.animate-pulse')
    expect(snowflake).toBeNull()
  })

  it('shows cooldown bar for human fish', () => {
    const fish = makeFish({ isHuman: true, isFrozen: false })
    const { container } = render(<FishComponent fish={fish} />)
    const cooldownBar = container.querySelector('.bg-gray-600')
    expect(cooldownBar).toBeTruthy()
  })

  it('does not show cooldown bar for AI fish', () => {
    const fish = makeFish({ isHuman: false, isFrozen: false })
    const { container } = render(<FishComponent fish={fish} />)
    const cooldownBar = container.querySelector('.bg-gray-600')
    expect(cooldownBar).toBeNull()
  })

  it('applies frozen color when frozen', () => {
    const fish = makeFish({ isFrozen: true, color: '#10b981' })
    const { container } = render(<FishComponent fish={fish} />)
    // The FishIcon gets style color #bfdbfe when frozen
    const fishIcon = container.querySelector('svg')
    expect(fishIcon?.style.color).toBe('rgb(191, 219, 254)')
  })
})
