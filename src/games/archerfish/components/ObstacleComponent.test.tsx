import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import ObstacleComponent from './ObstacleComponent'
import { makeObstacle } from '../test/archerFishTestHelpers'

describe('ObstacleComponent', () => {
  it('renders seaweed obstacle', () => {
    const obstacle = makeObstacle({ type: 'seaweed', position: { x: 300, y: 200 }, width: 35, height: 80 })
    const { container } = render(<ObstacleComponent obstacle={obstacle} />)
    const wrapper = container.querySelector('.absolute') as HTMLElement
    expect(wrapper).toBeTruthy()
    expect(wrapper.style.left).toBe('300px')
    expect(wrapper.style.top).toBe('200px')
    // Seaweed has SVG paths
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders island obstacle', () => {
    const obstacle = makeObstacle({ type: 'island', position: { x: 500, y: 300 }, width: 100, height: 70 })
    const { container } = render(<ObstacleComponent obstacle={obstacle} />)
    const wrapper = container.querySelector('.absolute') as HTMLElement
    expect(wrapper).toBeTruthy()
    expect(wrapper.style.width).toBe('100px')
    expect(wrapper.style.height).toBe('70px')
  })

  it('renders iceberg obstacle with image', () => {
    const obstacle = makeObstacle({ type: 'iceberg', position: { x: 400, y: 250 }, width: 80, height: 80 })
    const { container } = render(<ObstacleComponent obstacle={obstacle} />)
    const img = container.querySelector('img')
    expect(img).toBeTruthy()
    expect(img?.alt).toBe('iceberg')
  })

  it('renders magnet obstacle', () => {
    const obstacle = makeObstacle({ type: 'magnet', position: { x: 600, y: 350 }, width: 70, height: 50 })
    const { container } = render(<ObstacleComponent obstacle={obstacle} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg?.getAttribute('viewBox')).toBe('0 0 100 80')
  })

  it('renders coral obstacle', () => {
    const obstacle = makeObstacle({ type: 'coral', position: { x: 350, y: 400 }, width: 60, height: 50 })
    const { container } = render(<ObstacleComponent obstacle={obstacle} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg?.getAttribute('viewBox')).toBe('0 0 80 100')
  })
})
