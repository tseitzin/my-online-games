import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PlayerSetup from './PlayerSetup.jsx'

const defaultSetup = [
  { name: '', color: '#fbbf24', isComputer: false },
  { name: '', color: '#38bdf8', isComputer: true },
]

const defaultProps = {
  playerSetup: defaultSetup,
  playerCount: 2,
  onPlayerCountChange: vi.fn(),
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  setupError: null,
}

describe('PlayerSetup', () => {
  it('renders "Player Setup" heading', () => {
    render(<PlayerSetup {...defaultProps} />)
    expect(screen.getByText('Player Setup')).toBeInTheDocument()
  })

  it('renders player count input with value', () => {
    render(<PlayerSetup {...defaultProps} playerCount={3} />)
    const input = screen.getByDisplayValue('3')
    expect(input).toBeInTheDocument()
    expect(input.type).toBe('number')
  })

  it('renders player cards for each player in setup', () => {
    render(<PlayerSetup {...defaultProps} />)
    expect(screen.getByText('Player 1')).toBeInTheDocument()
    expect(screen.getByText('Player 2')).toBeInTheDocument()
  })

  it('renders name input for each player', () => {
    render(<PlayerSetup {...defaultProps} />)
    const nameInputs = screen.getAllByPlaceholderText(/Player|Computer/)
    expect(nameInputs).toHaveLength(2)
  })

  it('renders role select for each player', () => {
    render(<PlayerSetup {...defaultProps} />)
    const selects = screen.getAllByRole('combobox')
    expect(selects).toHaveLength(2)
  })

  it('renders Start Game button', () => {
    render(<PlayerSetup {...defaultProps} />)
    expect(screen.getByText('Start Game')).toBeInTheDocument()
  })

  it('calls onPlayerCountChange when count input changes', () => {
    const onPlayerCountChange = vi.fn()
    render(<PlayerSetup {...defaultProps} onPlayerCountChange={onPlayerCountChange} />)
    const input = screen.getByDisplayValue('2')
    fireEvent.change(input, { target: { value: '4' } })
    expect(onPlayerCountChange).toHaveBeenCalledWith(4)
  })

  it('calls onChange with (index, field, value) when name changes', () => {
    const onChange = vi.fn()
    render(<PlayerSetup {...defaultProps} onChange={onChange} />)
    const nameInputs = screen.getAllByPlaceholderText(/Player|Computer/)
    fireEvent.change(nameInputs[0], { target: { value: 'Alice' } })
    expect(onChange).toHaveBeenCalledWith(0, 'name', 'Alice')
  })

  it('calls onSubmit when form submitted', () => {
    const onSubmit = vi.fn()
    render(<PlayerSetup {...defaultProps} onSubmit={onSubmit} />)
    fireEvent.click(screen.getByText('Start Game'))
    expect(onSubmit).toHaveBeenCalled()
  })

  it('renders setupError message when provided', () => {
    render(<PlayerSetup {...defaultProps} setupError="At least one human player is required." />)
    expect(screen.getByText('At least one human player is required.')).toBeInTheDocument()
  })

  it('does not render error when setupError is null', () => {
    render(<PlayerSetup {...defaultProps} setupError={null} />)
    expect(screen.queryByText('At least one human player is required.')).not.toBeInTheDocument()
  })
})
