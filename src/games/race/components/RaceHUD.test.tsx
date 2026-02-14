import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RaceHUD } from './RaceHUD'
import { TrackType } from '../../../types/race'
import { makeCar } from '../test/raceTestHelpers'

describe('RaceHUD', () => {
  it('renders car numbers', () => {
    const cars = [makeCar({ id: 'p1', number: 7 }), makeCar({ id: 'p2', number: 42, isAI: true })]
    render(<RaceHUD cars={cars} targetLaps={3} trackType={TrackType.Oval} />)
    expect(screen.getByText('#7')).toBeInTheDocument()
    expect(screen.getByText('#42')).toBeInTheDocument()
  })

  it('shows lap progress for unfinished cars', () => {
    const cars = [makeCar({ id: 'p1', lapsCompleted: 1 })]
    render(<RaceHUD cars={cars} targetLaps={3} trackType={TrackType.Oval} />)
    expect(screen.getByText('2/3')).toBeInTheDocument()
  })

  it('shows "Done" for finished cars', () => {
    const cars = [makeCar({ id: 'p1', finished: true, finishPosition: 1 })]
    render(<RaceHUD cars={cars} targetLaps={3} trackType={TrackType.Oval} />)
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('sorts cars by laps then progress', () => {
    const cars = [
      makeCar({ id: 'p1', number: 1, lapsCompleted: 0, trackProgress: 0.5 }),
      makeCar({ id: 'p2', number: 2, lapsCompleted: 1, trackProgress: 0.3 }),
    ]
    const { container } = render(<RaceHUD cars={cars} targetLaps={3} trackType={TrackType.Oval} />)
    const numbers = container.querySelectorAll('.text-white.font-bold.text-sm')
    // Car 2 (1 lap) should be first
    expect(numbers[0].textContent).toBe('#2')
    expect(numbers[1].textContent).toBe('#1')
  })

  it('shows player badge for human cars', () => {
    const cars = [makeCar({ id: 'p1', isAI: false, playerIndex: 0 })]
    render(<RaceHUD cars={cars} targetLaps={3} trackType={TrackType.Oval} />)
    expect(screen.getByText('P1')).toBeInTheDocument()
  })

  it('does not show player badge for AI cars', () => {
    const cars = [makeCar({ id: 'ai1', isAI: true })]
    render(<RaceHUD cars={cars} targetLaps={3} trackType={TrackType.Oval} />)
    expect(screen.queryByText(/^P\d+$/)).toBeNull()
  })

  it('positions at center for Oval track', () => {
    const cars = [makeCar()]
    const { container } = render(<RaceHUD cars={cars} targetLaps={3} trackType={TrackType.Oval} />)
    const hud = container.firstChild as HTMLElement
    expect(hud.className).toContain('left-1/2')
    expect(hud.className).toContain('top-1/2')
  })

  it('positions at top for Figure8 track', () => {
    const cars = [makeCar()]
    const { container } = render(<RaceHUD cars={cars} targetLaps={3} trackType={TrackType.Figure8} />)
    const hud = container.firstChild as HTMLElement
    expect(hud.className).toContain('top-4')
    expect(hud.className).toContain('left-1/2')
  })
})
