import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DrawDiscardArea from './DrawDiscardArea.jsx'

const defaultProps = {
  drawnCard: null,
  discardTop: null,
  canDraw: true,
  canPickUp: true,
  canDiscard: true,
  onDraw: vi.fn(),
  onPickUp: vi.fn(),
  onDiscard: vi.fn(),
  deckCount: 42,
  darkMode: false,
}

describe('DrawDiscardArea', () => {
  it('renders "?" when no drawn card', () => {
    render(<DrawDiscardArea {...defaultProps} />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('renders drawn card value when drawnCard provided', () => {
    render(<DrawDiscardArea {...defaultProps} drawnCard={{ id: 1, value: 9, faceUp: true }} />)
    expect(screen.getByText('9')).toBeInTheDocument()
  })

  it('renders discard top value when discardTop provided', () => {
    render(<DrawDiscardArea {...defaultProps} discardTop={{ id: 2, value: 3, faceUp: true }} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders "-" when discardTop is null', () => {
    render(<DrawDiscardArea {...defaultProps} discardTop={null} />)
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('shows "Discard Drawn" button when drawnCard provided', () => {
    render(<DrawDiscardArea {...defaultProps} drawnCard={{ id: 1, value: 9, faceUp: true }} />)
    expect(screen.getByText('Discard Drawn')).toBeInTheDocument()
  })

  it('hides "Discard Drawn" button when no drawnCard', () => {
    render(<DrawDiscardArea {...defaultProps} drawnCard={null} />)
    expect(screen.queryByText('Discard Drawn')).not.toBeInTheDocument()
  })

  it('calls onDraw when draw pile clicked and canDraw is true', () => {
    const onDraw = vi.fn()
    render(<DrawDiscardArea {...defaultProps} onDraw={onDraw} canDraw={true} />)
    fireEvent.click(screen.getByText('?'))
    expect(onDraw).toHaveBeenCalledOnce()
  })

  it('does not call onDraw when canDraw is false', () => {
    const onDraw = vi.fn()
    render(<DrawDiscardArea {...defaultProps} onDraw={onDraw} canDraw={false} />)
    fireEvent.click(screen.getByText('?'))
    expect(onDraw).not.toHaveBeenCalled()
  })

  it('calls onPickUp when discard clicked and canPickUp is true', () => {
    const onPickUp = vi.fn()
    render(<DrawDiscardArea {...defaultProps} onPickUp={onPickUp} canPickUp={true} discardTop={{ id: 2, value: 3, faceUp: true }} />)
    fireEvent.click(screen.getByText('3'))
    expect(onPickUp).toHaveBeenCalledOnce()
  })

  it('calls onDiscard when "Discard Drawn" button clicked', () => {
    const onDiscard = vi.fn()
    render(<DrawDiscardArea {...defaultProps} onDiscard={onDiscard} drawnCard={{ id: 1, value: 9, faceUp: true }} />)
    fireEvent.click(screen.getByText('Discard Drawn'))
    expect(onDiscard).toHaveBeenCalledOnce()
  })

  it('displays deck count text', () => {
    render(<DrawDiscardArea {...defaultProps} deckCount={42} />)
    expect(screen.getByText('42 cards left')).toBeInTheDocument()
  })

  it('displays singular "card" when deckCount is 1', () => {
    render(<DrawDiscardArea {...defaultProps} deckCount={1} />)
    expect(screen.getByText('1 card left')).toBeInTheDocument()
  })
})
