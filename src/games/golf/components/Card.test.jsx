import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Card from './Card.jsx'

describe('Card', () => {
  it('renders card value for face-up card', () => {
    render(<Card card={{ id: 1, value: 7, faceUp: true }} />)
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('renders "Golf" text for face-down card (card back)', () => {
    render(<Card card={{ id: 1, value: 5, faceUp: false }} />)
    expect(screen.getByText('Golf')).toBeInTheDocument()
  })

  it('renders negative values', () => {
    render(<Card card={{ id: 1, value: -5, faceUp: true }} />)
    expect(screen.getByText('-5')).toBeInTheDocument()
  })

  it('renders zero value', () => {
    render(<Card card={{ id: 1, value: 0, faceUp: true }} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('applies pointer cursor when interactive', () => {
    const { container } = render(<Card card={{ id: 1, value: 5, faceUp: false }} interactive={true} />)
    expect(container.firstChild.style.cursor).toBe('pointer')
  })

  it('applies default cursor when not interactive', () => {
    const { container } = render(<Card card={{ id: 1, value: 5, faceUp: false }} interactive={false} />)
    expect(container.firstChild.style.cursor).toBe('default')
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    const { container } = render(<Card card={{ id: 1, value: 5, faceUp: true }} onClick={onClick} />)
    fireEvent.click(container.firstChild)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('applies highlight styles when highlighted and faceUp', () => {
    const { container } = render(<Card card={{ id: 1, value: 5, faceUp: true }} highlighted={true} />)
    // The face div is the second direct child of the outer wrapper
    const faceDiv = container.firstChild.children[1]
    // JSDOM may return hex or rgb format
    const bg = faceDiv.style.background
    expect(bg === '#fee2e2' || bg === 'rgb(254, 226, 226)').toBe(true)
  })

  it('applies dark mode styles when darkMode true', () => {
    const { container } = render(<Card card={{ id: 1, value: 5, faceUp: true }} darkMode={true} />)
    // The face div is the second direct child of the outer wrapper
    const faceDiv = container.firstChild.children[1]
    // JSDOM may return hex or rgb format
    const bg = faceDiv.style.background
    expect(bg === '#4a5568' || bg === 'rgb(74, 85, 104)').toBe(true)
  })
})
