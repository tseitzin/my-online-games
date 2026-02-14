import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import Home from './Home'

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  )
}

beforeEach(() => {
  localStorage.clear()
  document.body.style.backgroundColor = ''
  document.documentElement.style.backgroundColor = ''
})

// ── Rendering ────────────────────────────────────────────────────────

describe('Rendering', () => {
  it('renders "Fun Games!" title', () => {
    renderHome()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Fun Games!')
  })

  it('renders "Choose a game to play" subtitle', () => {
    renderHome()
    expect(screen.getByText('Choose a game to play')).toBeInTheDocument()
  })

  it('renders 6 game cards', () => {
    renderHome()
    const playButtons = screen.getAllByText('Play Now')
    expect(playButtons).toHaveLength(6)
  })

  it('renders all game names', () => {
    renderHome()
    const expectedNames = [
      'Golf',
      'Race Game',
      'Dots and Boxes',
      'Checkers',
      'Archer Fish Racing',
      'Battle Planes',
    ]
    for (const name of expectedNames) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument()
    }
  })

  it('renders 6 "Play Now" buttons', () => {
    renderHome()
    const playNowElements = screen.getAllByText('Play Now')
    expect(playNowElements).toHaveLength(6)
  })

  it('renders "More games coming soon!" footer text', () => {
    renderHome()
    expect(screen.getByText(/More games coming soon!/)).toBeInTheDocument()
  })

  it('renders dark mode toggle button', () => {
    renderHome()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('dark mode toggle shows "Dark" text initially (light mode default)', () => {
    renderHome()
    const toggleButton = screen.getByRole('button')
    expect(toggleButton.textContent).toContain('Dark')
  })
})

// ── Game card links ──────────────────────────────────────────────────

describe('Game card links', () => {
  it('Golf card links to /golf', () => {
    renderHome()
    const links = screen.getAllByRole('link')
    const golfLink = links.find((l) => l.getAttribute('href') === '/golf')
    expect(golfLink).toBeTruthy()
  })

  it('Race card links to /race', () => {
    renderHome()
    const links = screen.getAllByRole('link')
    const raceLink = links.find((l) => l.getAttribute('href') === '/race')
    expect(raceLink).toBeTruthy()
  })

  it('Dots card links to /dots', () => {
    renderHome()
    const links = screen.getAllByRole('link')
    const dotsLink = links.find((l) => l.getAttribute('href') === '/dots')
    expect(dotsLink).toBeTruthy()
  })

  it('Checkers card links to /checkers', () => {
    renderHome()
    const links = screen.getAllByRole('link')
    const checkersLink = links.find((l) => l.getAttribute('href') === '/checkers')
    expect(checkersLink).toBeTruthy()
  })

  it('ArcherFish card links to /archerfish', () => {
    renderHome()
    const links = screen.getAllByRole('link')
    const archerLink = links.find((l) => l.getAttribute('href') === '/archerfish')
    expect(archerLink).toBeTruthy()
  })

  it('BattlePlanes card links to /battleplanes', () => {
    renderHome()
    const links = screen.getAllByRole('link')
    const planesLink = links.find((l) => l.getAttribute('href') === '/battleplanes')
    expect(planesLink).toBeTruthy()
  })
})

// ── Dark mode toggle ─────────────────────────────────────────────────

describe('Dark mode toggle', () => {
  it('toggle button shows "Dark" in light mode', () => {
    renderHome()
    const btn = screen.getByRole('button')
    expect(btn.textContent).toContain('Dark')
    expect(btn.textContent).not.toContain('Light')
  })

  it('clicking toggle switches to dark mode (button shows "Light")', () => {
    renderHome()
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    expect(btn.textContent).toContain('Light')
    expect(btn.textContent).not.toContain('Dark')
  })

  it('clicking toggle again switches back to light mode', () => {
    renderHome()
    const btn = screen.getByRole('button')
    fireEvent.click(btn) // dark
    fireEvent.click(btn) // light
    expect(btn.textContent).toContain('Dark')
    expect(btn.textContent).not.toContain('Light')
  })

  it('dark mode persists to localStorage under key home:darkMode', () => {
    renderHome()
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    expect(localStorage.getItem('home:darkMode')).toBe('true')
  })

  it('reads dark mode from localStorage on mount', () => {
    localStorage.setItem('home:darkMode', 'true')
    renderHome()
    const btn = screen.getByRole('button')
    expect(btn.textContent).toContain('Light')
  })
})

// ── localStorage handling ────────────────────────────────────────────

describe('localStorage handling', () => {
  it('defaults to light mode when localStorage is empty', () => {
    renderHome()
    const btn = screen.getByRole('button')
    expect(btn.textContent).toContain('Dark')
  })

  it('reads true from localStorage and starts in dark mode', () => {
    localStorage.setItem('home:darkMode', 'true')
    renderHome()
    const btn = screen.getByRole('button')
    expect(btn.textContent).toContain('Light')
  })

  it('handles corrupted localStorage gracefully (defaults to light)', () => {
    localStorage.setItem('home:darkMode', '{not-valid-json')
    renderHome()
    const btn = screen.getByRole('button')
    expect(btn.textContent).toContain('Dark')
  })
})

// ── Body background ──────────────────────────────────────────────────

describe('Body background', () => {
  it('sets document.body background to light theme color initially', () => {
    renderHome()
    expect(document.body.style.backgroundColor).toBe('rgb(248, 246, 241)')
  })

  it('updates document.body background when toggling to dark mode', () => {
    renderHome()
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    expect(document.body.style.backgroundColor).toBe('rgb(26, 32, 44)')
  })
})

// ── Game card content ────────────────────────────────────────────────

describe('Game card content', () => {
  it('each card shows game description text', () => {
    renderHome()
    const descriptions = [
      'A classic 8-card golf game. Flip cards, swap strategically, and aim for the lowest score!',
      'Fast-paced oval track racing with AI opponents. Control your car and race to victory!',
      'Strategic turn-based game. Draw lines to complete boxes and score points!',
      'Kid-friendly checkers with drag-and-drop, AI opponents, hints, and undo. Perfect for learning!',
      'Escape evil robots! Shoot water, dodge obstacles, and survive the longest!',
      'Defend the skies! Shoot down enemy fighter jets with lightning power!',
    ]
    for (const desc of descriptions) {
      expect(screen.getByText(desc)).toBeInTheDocument()
    }
  })
})
