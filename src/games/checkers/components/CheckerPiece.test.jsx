import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import CheckerPiece from './CheckerPiece.jsx'

describe('CheckerPiece', () => {
  it('returns null when piece is null', () => {
    const { container } = render(<CheckerPiece piece={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders a red piece', () => {
    const { container } = render(
      <CheckerPiece piece={{ color: 'red', type: 'normal' }} />
    )
    const pieceDiv = container.querySelector('.rounded-full')
    expect(pieceDiv).toBeTruthy()
    // JSDOM converts hex to rgb in CSS values
    expect(pieceDiv.style.background).toContain('rgb(239, 68, 68)')
  })

  it('renders a black piece', () => {
    const { container } = render(
      <CheckerPiece piece={{ color: 'black', type: 'normal' }} />
    )
    const pieceDiv = container.querySelector('.rounded-full')
    expect(pieceDiv).toBeTruthy()
    expect(pieceDiv.style.background).toContain('rgb(31, 41, 55)')
  })

  it('renders crown icon for king piece', () => {
    const { container } = render(
      <CheckerPiece piece={{ color: 'red', type: 'king' }} />
    )
    // Crown icon from lucide-react renders as an SVG
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
  })

  it('does not render crown for normal piece', () => {
    const { container } = render(
      <CheckerPiece piece={{ color: 'red', type: 'normal' }} />
    )
    const svg = container.querySelector('svg')
    expect(svg).toBeNull()
  })

  it('applies different box-shadow for selected vs unselected', () => {
    const { container: selectedContainer } = render(
      <CheckerPiece piece={{ color: 'red', type: 'normal' }} isSelected={true} />
    )
    const { container: unselectedContainer } = render(
      <CheckerPiece piece={{ color: 'red', type: 'normal' }} isSelected={false} />
    )
    const selectedPiece = selectedContainer.querySelector('.rounded-full')
    const unselectedPiece = unselectedContainer.querySelector('.rounded-full')
    // Selected piece has glow shadow with amber color
    expect(selectedPiece.style.boxShadow).toContain('251, 191, 36')
    expect(unselectedPiece.style.boxShadow).not.toContain('251, 191, 36')
  })

  it('dark mode changes black piece to light gray', () => {
    const { container } = render(
      <CheckerPiece piece={{ color: 'black', type: 'normal' }} darkMode={true} />
    )
    const pieceDiv = container.querySelector('.rounded-full')
    // JSDOM converts #f3f4f6 to rgb(243, 244, 246)
    expect(pieceDiv.style.background).toContain('rgb(243, 244, 246)')
  })

  it('dark mode does not change red piece color', () => {
    const { container } = render(
      <CheckerPiece piece={{ color: 'red', type: 'normal' }} darkMode={true} />
    )
    const pieceDiv = container.querySelector('.rounded-full')
    expect(pieceDiv.style.background).toContain('rgb(239, 68, 68)')
  })
})
