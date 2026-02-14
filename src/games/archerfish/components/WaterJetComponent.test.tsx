import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import WaterJetComponent from './WaterJetComponent'
import { makeWaterJet } from '../test/archerFishTestHelpers'

describe('WaterJetComponent', () => {
  it('renders without crashing', () => {
    const waterJet = makeWaterJet()
    const { container } = render(<WaterJetComponent waterJet={waterJet} />)
    expect(container.firstChild).toBeTruthy()
  })

  it('positions at water jet coordinates', () => {
    const waterJet = makeWaterJet({ position: { x: 300, y: 150 } })
    const { container } = render(<WaterJetComponent waterJet={waterJet} />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.left).toBe('300px')
    expect(wrapper.style.top).toBe('150px')
  })

  it('applies rotation based on velocity', () => {
    const waterJet = makeWaterJet({ velocity: { x: 0, y: 8 } })
    const { container } = render(<WaterJetComponent waterJet={waterJet} />)
    const wrapper = container.firstChild as HTMLElement
    // atan2(8, 0) = 90 degrees
    expect(wrapper.style.transform).toContain('rotate(90deg)')
  })
})
