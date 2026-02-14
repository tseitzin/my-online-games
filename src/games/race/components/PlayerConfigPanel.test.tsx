import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PlayerConfigPanel } from './PlayerConfigPanel'
import { mockCanvasGetContext } from '../test/raceTestHelpers'

let canvasMock: ReturnType<typeof mockCanvasGetContext>

beforeEach(() => {
  canvasMock = mockCanvasGetContext()
})

afterEach(() => {
  canvasMock.restore()
})

const defaultProps = {
  playerIndex: 0,
  config: { color: '#E53935', number: 1, style: 0 },
  usedColors: ['#E53935'],
  usedNumbers: [1],
  onChange: vi.fn(),
}

describe('PlayerConfigPanel', () => {
  it('renders player title', () => {
    render(<PlayerConfigPanel {...defaultProps} />)
    expect(screen.getByText('Player 1')).toBeInTheDocument()
  })

  it('renders control label', () => {
    render(<PlayerConfigPanel {...defaultProps} />)
    // Player 0 controls label is "W-Space / A-D / S"
    expect(screen.getByText(/W-Space/)).toBeInTheDocument()
  })

  it('renders number input with current value', () => {
    render(<PlayerConfigPanel {...defaultProps} />)
    const input = screen.getByLabelText('Track Number') as HTMLInputElement
    expect(input.value).toBe('1')
  })

  it('onChange fires when number changes', () => {
    const onChange = vi.fn()
    render(<PlayerConfigPanel {...defaultProps} onChange={onChange} />)
    const input = screen.getByLabelText('Track Number')
    fireEvent.change(input, { target: { value: '42' } })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ number: 42 })
    )
  })

  it('clamps number to 1-99 range', () => {
    const onChange = vi.fn()
    render(<PlayerConfigPanel {...defaultProps} onChange={onChange} />)
    const input = screen.getByLabelText('Track Number')
    fireEvent.change(input, { target: { value: '150' } })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ number: 99 })
    )
  })

  it('shows duplicate number warning', () => {
    render(
      <PlayerConfigPanel
        {...defaultProps}
        usedNumbers={[1, 1]} // number 1 appears twice = duplicate
      />
    )
    expect(screen.getByText('Track number in use')).toBeInTheDocument()
  })
})
