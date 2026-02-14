import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EndScreen from './EndScreen.jsx'

describe('EndScreen', () => {
  it('renders "Red Wins!" when winner is red', () => {
    render(<EndScreen winner="red" onPlayAgain={vi.fn()} onBackToMenu={vi.fn()} />)
    expect(screen.getByText('Red')).toBeInTheDocument()
    expect(screen.getByText('Wins!')).toBeInTheDocument()
  })

  it('renders "Black Wins!" when winner is black', () => {
    render(<EndScreen winner="black" onPlayAgain={vi.fn()} onBackToMenu={vi.fn()} />)
    expect(screen.getByText('Black')).toBeInTheDocument()
    expect(screen.getByText('Wins!')).toBeInTheDocument()
  })

  it('renders Congratulations message', () => {
    render(<EndScreen winner="red" onPlayAgain={vi.fn()} onBackToMenu={vi.fn()} />)
    expect(screen.getByText('Congratulations!')).toBeInTheDocument()
  })

  it('renders Play Again button', () => {
    render(<EndScreen winner="red" onPlayAgain={vi.fn()} onBackToMenu={vi.fn()} />)
    expect(screen.getByText('Play Again')).toBeInTheDocument()
  })

  it('renders Main Menu button', () => {
    render(<EndScreen winner="red" onPlayAgain={vi.fn()} onBackToMenu={vi.fn()} />)
    expect(screen.getByText('Main Menu')).toBeInTheDocument()
  })

  it('calls onPlayAgain when Play Again clicked', () => {
    const onPlayAgain = vi.fn()
    render(<EndScreen winner="red" onPlayAgain={onPlayAgain} onBackToMenu={vi.fn()} />)
    fireEvent.click(screen.getByText('Play Again'))
    expect(onPlayAgain).toHaveBeenCalledOnce()
  })

  it('calls onBackToMenu when Main Menu clicked', () => {
    const onBackToMenu = vi.fn()
    render(<EndScreen winner="red" onPlayAgain={vi.fn()} onBackToMenu={onBackToMenu} />)
    fireEvent.click(screen.getByText('Main Menu'))
    expect(onBackToMenu).toHaveBeenCalledOnce()
  })

  it('applies red text color for red winner', () => {
    render(<EndScreen winner="red" onPlayAgain={vi.fn()} onBackToMenu={vi.fn()} />)
    const redSpan = screen.getByText('Red')
    expect(redSpan.className).toContain('text-red-500')
  })

  it('applies gray text color for black winner', () => {
    render(<EndScreen winner="black" onPlayAgain={vi.fn()} onBackToMenu={vi.fn()} />)
    const blackSpan = screen.getByText('Black')
    expect(blackSpan.className).toContain('text-gray-700')
  })

  it('renders celebration emojis', () => {
    render(<EndScreen winner="red" onPlayAgain={vi.fn()} onBackToMenu={vi.fn()} />)
    const emojis = screen.getAllByText('🎉')
    expect(emojis).toHaveLength(5)
  })
})
