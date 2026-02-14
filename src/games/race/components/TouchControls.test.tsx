import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TouchControls } from './TouchControls'

describe('TouchControls', () => {
  const defaultProps = {
    playerCount: 1,
    playerColors: ['#E53935'],
    onInputChange: vi.fn(),
    currentInputs: {},
  }

  it('renders control set for 1 player', () => {
    const { container } = render(<TouchControls {...defaultProps} />)
    // 4 buttons per player: accelerate, brake, turnLeft, turnRight
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBe(4)
  })

  it('renders control sets for 2 players', () => {
    const { container } = render(
      <TouchControls {...defaultProps} playerCount={2} playerColors={['#E53935', '#1E88E5']} />
    )
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBe(8) // 4 per player
  })

  it('shows player label with color name', () => {
    render(<TouchControls {...defaultProps} />)
    expect(screen.getByText('P1 - Red')).toBeInTheDocument()
  })

  it('shows correct label for second player', () => {
    render(
      <TouchControls {...defaultProps} playerCount={2} playerColors={['#E53935', '#1E88E5']} />
    )
    expect(screen.getByText('P1 - Red')).toBeInTheDocument()
    expect(screen.getByText('P2 - Blue')).toBeInTheDocument()
  })

  it('mouseDown on accelerate calls onInputChange with accelerate true', () => {
    const onInputChange = vi.fn()
    const { container } = render(<TouchControls {...defaultProps} onInputChange={onInputChange} />)
    // First button is accelerate (ChevronUp)
    const buttons = container.querySelectorAll('button')
    fireEvent.mouseDown(buttons[0])
    expect(onInputChange).toHaveBeenCalledWith(
      expect.objectContaining({
        0: expect.objectContaining({ accelerate: true }),
      })
    )
  })

  it('mouseUp on accelerate resets to false', () => {
    const onInputChange = vi.fn()
    const { container } = render(
      <TouchControls
        {...defaultProps}
        onInputChange={onInputChange}
        currentInputs={{ 0: { accelerate: true, brake: false, turnLeft: false, turnRight: false } }}
      />
    )
    const buttons = container.querySelectorAll('button')
    fireEvent.mouseUp(buttons[0])
    expect(onInputChange).toHaveBeenCalledWith(
      expect.objectContaining({
        0: expect.objectContaining({ accelerate: false }),
      })
    )
  })

  it('mouseDown on brake calls onInputChange with brake true', () => {
    const onInputChange = vi.fn()
    const { container } = render(<TouchControls {...defaultProps} onInputChange={onInputChange} />)
    // Last button is brake (ChevronDown)
    const buttons = container.querySelectorAll('button')
    fireEvent.mouseDown(buttons[3])
    expect(onInputChange).toHaveBeenCalledWith(
      expect.objectContaining({
        0: expect.objectContaining({ brake: true }),
      })
    )
  })

  it('mouseLeave on button resets input', () => {
    const onInputChange = vi.fn()
    const { container } = render(
      <TouchControls
        {...defaultProps}
        onInputChange={onInputChange}
        currentInputs={{ 0: { accelerate: true, brake: false, turnLeft: false, turnRight: false } }}
      />
    )
    const buttons = container.querySelectorAll('button')
    fireEvent.mouseLeave(buttons[0])
    expect(onInputChange).toHaveBeenCalledWith(
      expect.objectContaining({
        0: expect.objectContaining({ accelerate: false }),
      })
    )
  })
})
