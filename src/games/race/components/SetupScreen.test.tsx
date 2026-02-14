import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SetupScreen } from './SetupScreen'
import { makeRaceConfig, mockCanvasGetContext } from '../test/raceTestHelpers'
import { TrackType } from '../../../types/race'

let canvasMock: ReturnType<typeof mockCanvasGetContext>

beforeEach(() => {
  canvasMock = mockCanvasGetContext()
})

afterEach(() => {
  canvasMock.restore()
})

describe('SetupScreen', () => {
  const defaultProps = {
    config: makeRaceConfig(),
    onConfigChange: vi.fn(),
    onStartRace: vi.fn(),
  }

  describe('initial rendering', () => {
    it('renders title "Race Setup"', () => {
      render(<SetupScreen {...defaultProps} />)
      expect(screen.getByText('Race Setup')).toBeInTheDocument()
    })

    it('renders track selection options', () => {
      render(<SetupScreen {...defaultProps} />)
      expect(screen.getByText('Select Track')).toBeInTheDocument()
      expect(screen.getByText('Classic Oval')).toBeInTheDocument()
      expect(screen.getByText('Super Speedway')).toBeInTheDocument()
      expect(screen.getByText('Figure Eight')).toBeInTheDocument()
      expect(screen.getByText('Road Course')).toBeInTheDocument()
    })

    it('renders Human Players section', () => {
      render(<SetupScreen {...defaultProps} />)
      expect(screen.getByText('Human Players')).toBeInTheDocument()
    })

    it('renders AI Racers section', () => {
      render(<SetupScreen {...defaultProps} />)
      expect(screen.getByText('AI Racers')).toBeInTheDocument()
    })

    it('renders Laps section', () => {
      render(<SetupScreen {...defaultProps} />)
      expect(screen.getByText('Laps')).toBeInTheDocument()
    })

    it('renders Start Race button', () => {
      render(<SetupScreen {...defaultProps} />)
      expect(screen.getByText('Start Race!')).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('clicking track changes config', () => {
      const onConfigChange = vi.fn()
      render(<SetupScreen {...defaultProps} onConfigChange={onConfigChange} />)
      fireEvent.click(screen.getByText('Figure Eight'))
      expect(onConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ trackType: TrackType.Figure8 })
      )
    })

    it('clicking human players count updates config', () => {
      const onConfigChange = vi.fn()
      const { container } = render(<SetupScreen {...defaultProps} onConfigChange={onConfigChange} />)
      // Human Players section — find the section with "Human Players" text, then get its sibling buttons
      const humanSection = screen.getByText('Human Players').closest('.bg-white')!
      const buttons = humanSection.querySelectorAll('button')
      // Button "2" is the second one (index 1)
      fireEvent.click(buttons[1])
      expect(onConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ humanPlayers: 2 })
      )
    })

    it('clicking laps updates config', () => {
      const onConfigChange = vi.fn()
      render(<SetupScreen {...defaultProps} onConfigChange={onConfigChange} />)
      // Laps section — find the section
      const lapsSection = screen.getByText('Laps').closest('.bg-white')!
      const buttons = lapsSection.querySelectorAll('button')
      // Laps: 3, 5, 10 → button index 1 is "5"
      fireEvent.click(buttons[1])
      expect(onConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ laps: 5 })
      )
    })

    it('Start Race fires onStartRace', () => {
      const onStartRace = vi.fn()
      render(<SetupScreen {...defaultProps} onStartRace={onStartRace} />)
      fireEvent.click(screen.getByText('Start Race!'))
      expect(onStartRace).toHaveBeenCalledTimes(1)
    })

    it('shows AI Racers canvas section when AI count > 0', () => {
      render(<SetupScreen {...defaultProps} />)
      expect(screen.getByText(/AI Racers \(3\)/)).toBeInTheDocument()
    })
  })

  describe('validation', () => {
    it('disables Start Race when total racers < 2', () => {
      const config = makeRaceConfig({ humanPlayers: 1, aiRacers: 0 })
      render(<SetupScreen {...defaultProps} config={config} />)
      const startButton = screen.getByText('Start Race!').closest('button')!
      expect(startButton.disabled).toBe(true)
    })

    it('shows warning when total racers < 2', () => {
      const config = makeRaceConfig({ humanPlayers: 1, aiRacers: 0 })
      render(<SetupScreen {...defaultProps} config={config} />)
      expect(screen.getByText('Need at least 2 racers to start!')).toBeInTheDocument()
    })

    it('enables Start Race with 2+ racers', () => {
      render(<SetupScreen {...defaultProps} />)
      const startButton = screen.getByText('Start Race!').closest('button')!
      expect(startButton.disabled).toBe(false)
    })
  })
})
