import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ActionBar from './ActionBar.jsx'

const defaultProps = {
  onReset: vi.fn(),
  onEndRound: vi.fn(),
  onNextHole: vi.fn(),
  roundOver: false,
  currentHole: 1,
}

describe('ActionBar', () => {
  it('renders Reset button', () => {
    render(<ActionBar {...defaultProps} />)
    expect(screen.getByText('Reset')).toBeInTheDocument()
  })

  it('renders End Round button', () => {
    render(<ActionBar {...defaultProps} />)
    expect(screen.getByText('End Round')).toBeInTheDocument()
  })

  it('calls onReset when Reset clicked', () => {
    const onReset = vi.fn()
    render(<ActionBar {...defaultProps} onReset={onReset} />)
    fireEvent.click(screen.getByText('Reset'))
    expect(onReset).toHaveBeenCalledOnce()
  })

  it('calls onEndRound when End Round clicked', () => {
    const onEndRound = vi.fn()
    render(<ActionBar {...defaultProps} onEndRound={onEndRound} />)
    fireEvent.click(screen.getByText('End Round'))
    expect(onEndRound).toHaveBeenCalledOnce()
  })

  it('renders Next Hole button when roundOver and hole < 9', () => {
    render(<ActionBar {...defaultProps} roundOver={true} currentHole={3} />)
    expect(screen.getByText('Next Hole')).toBeInTheDocument()
  })

  it('does not render Next Hole when not roundOver', () => {
    render(<ActionBar {...defaultProps} roundOver={false} currentHole={3} />)
    expect(screen.queryByText('Next Hole')).not.toBeInTheDocument()
  })

  it('does not render Next Hole when currentHole >= 9', () => {
    render(<ActionBar {...defaultProps} roundOver={true} currentHole={9} />)
    expect(screen.queryByText('Next Hole')).not.toBeInTheDocument()
  })

  it('calls onNextHole when Next Hole clicked', () => {
    const onNextHole = vi.fn()
    render(<ActionBar {...defaultProps} onNextHole={onNextHole} roundOver={true} currentHole={5} />)
    fireEvent.click(screen.getByText('Next Hole'))
    expect(onNextHole).toHaveBeenCalledOnce()
  })
})
