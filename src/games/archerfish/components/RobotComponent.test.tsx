import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RobotComponent from './RobotComponent'
import { makeRobot } from '../test/archerFishTestHelpers'

describe('RobotComponent', () => {
  it('positions at robot coordinates', () => {
    const robot = makeRobot({ position: { x: 400, y: 200 } })
    const { container } = render(<RobotComponent robot={robot} />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.left).toBe('400px')
    expect(wrapper.style.top).toBe('200px')
  })

  it('shows STUCK! text when robot is stuck', () => {
    const robot = makeRobot({ isStuck: true })
    render(<RobotComponent robot={robot} />)
    expect(screen.getByText('STUCK!')).toBeInTheDocument()
  })

  it('does not show STUCK! text when robot is not stuck', () => {
    const robot = makeRobot({ isStuck: false })
    render(<RobotComponent robot={robot} />)
    expect(screen.queryByText('STUCK!')).toBeNull()
  })

  it('renders the robot SVG', () => {
    const robot = makeRobot()
    const { container } = render(<RobotComponent robot={robot} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
  })
})
