import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// Mock all game components to simple stubs to avoid timer/RAF/canvas complexity
vi.mock('./games/golf/GolfGame.jsx', () => ({
  default: () => <div data-testid="golf-game">Golf Game</div>,
}))
vi.mock('./games/race/RaceGame.tsx', () => ({
  default: () => <div data-testid="race-game">Race Game</div>,
}))
vi.mock('./games/dots/DotsGame.jsx', () => ({
  default: () => <div data-testid="dots-game">Dots Game</div>,
}))
vi.mock('./games/checkers/CheckersGame.jsx', () => ({
  default: () => <div data-testid="checkers-game">Checkers Game</div>,
}))
vi.mock('./games/archerfish/ArcherFishGame.tsx', () => ({
  default: () => <div data-testid="archerfish-game">ArcherFish Game</div>,
}))
vi.mock('./games/battleplanes/BattlePlanesGame.tsx', () => ({
  default: () => <div data-testid="battleplanes-game">BattlePlanes Game</div>,
}))

import Home from './pages/Home.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import GolfGame from './games/golf/GolfGame.jsx'
import RaceGame from './games/race/RaceGame.tsx'
import DotsGame from './games/dots/DotsGame.jsx'
import CheckersGame from './games/checkers/CheckersGame.jsx'
import ArcherFishGame from './games/archerfish/ArcherFishGame.tsx'
import BattlePlanesGame from './games/battleplanes/BattlePlanesGame.tsx'

function renderWithRoute(initialRoute) {
  return render(
    <ErrorBoundary>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/golf" element={<GolfGame />} />
          <Route path="/race" element={<RaceGame />} />
          <Route path="/dots" element={<DotsGame />} />
          <Route path="/checkers" element={<CheckersGame />} />
          <Route path="/archerfish" element={<ArcherFishGame />} />
          <Route path="/battleplanes" element={<BattlePlanesGame />} />
        </Routes>
      </MemoryRouter>
    </ErrorBoundary>
  )
}

describe('App routing', () => {
  describe('Home route', () => {
    it('renders the Home page at "/"', () => {
      renderWithRoute('/')
      expect(screen.getByText('Fun Games!')).toBeInTheDocument()
      expect(screen.getByText('Choose a game to play')).toBeInTheDocument()
    })

    it('does not render any game component at "/"', () => {
      renderWithRoute('/')
      expect(screen.queryByTestId('golf-game')).not.toBeInTheDocument()
      expect(screen.queryByTestId('race-game')).not.toBeInTheDocument()
      expect(screen.queryByTestId('dots-game')).not.toBeInTheDocument()
      expect(screen.queryByTestId('checkers-game')).not.toBeInTheDocument()
      expect(screen.queryByTestId('archerfish-game')).not.toBeInTheDocument()
      expect(screen.queryByTestId('battleplanes-game')).not.toBeInTheDocument()
    })
  })

  describe('Game routes', () => {
    it('renders Golf game at "/golf"', () => {
      renderWithRoute('/golf')
      expect(screen.getByTestId('golf-game')).toBeInTheDocument()
    })

    it('renders Race game at "/race"', () => {
      renderWithRoute('/race')
      expect(screen.getByTestId('race-game')).toBeInTheDocument()
    })

    it('renders Dots game at "/dots"', () => {
      renderWithRoute('/dots')
      expect(screen.getByTestId('dots-game')).toBeInTheDocument()
    })

    it('renders Checkers game at "/checkers"', () => {
      renderWithRoute('/checkers')
      expect(screen.getByTestId('checkers-game')).toBeInTheDocument()
    })

    it('renders ArcherFish game at "/archerfish"', () => {
      renderWithRoute('/archerfish')
      expect(screen.getByTestId('archerfish-game')).toBeInTheDocument()
    })

    it('renders BattlePlanes game at "/battleplanes"', () => {
      renderWithRoute('/battleplanes')
      expect(screen.getByTestId('battleplanes-game')).toBeInTheDocument()
    })
  })

  describe('Route isolation', () => {
    it('does not render Home page when at "/golf"', () => {
      renderWithRoute('/golf')
      expect(screen.queryByText('Fun Games!')).not.toBeInTheDocument()
      expect(screen.queryByText('Choose a game to play')).not.toBeInTheDocument()
    })

    it('does not render other games when at "/golf"', () => {
      renderWithRoute('/golf')
      expect(screen.getByTestId('golf-game')).toBeInTheDocument()
      expect(screen.queryByTestId('race-game')).not.toBeInTheDocument()
      expect(screen.queryByTestId('dots-game')).not.toBeInTheDocument()
      expect(screen.queryByTestId('checkers-game')).not.toBeInTheDocument()
      expect(screen.queryByTestId('archerfish-game')).not.toBeInTheDocument()
      expect(screen.queryByTestId('battleplanes-game')).not.toBeInTheDocument()
    })
  })

  describe('ErrorBoundary wrapping', () => {
    it('renders content without error UI when no error occurs', () => {
      renderWithRoute('/')
      expect(screen.getByText('Fun Games!')).toBeInTheDocument()
      expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument()
    })
  })

  describe('Unknown route', () => {
    it('does not render any game or Home content at "/unknown-path"', () => {
      renderWithRoute('/unknown-path')
      expect(screen.queryByText('Fun Games!')).not.toBeInTheDocument()
      expect(screen.queryByTestId('golf-game')).not.toBeInTheDocument()
      expect(screen.queryByTestId('race-game')).not.toBeInTheDocument()
      expect(screen.queryByTestId('dots-game')).not.toBeInTheDocument()
      expect(screen.queryByTestId('checkers-game')).not.toBeInTheDocument()
      expect(screen.queryByTestId('archerfish-game')).not.toBeInTheDocument()
      expect(screen.queryByTestId('battleplanes-game')).not.toBeInTheDocument()
    })
  })
})
