import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import DarkModeToggle from '../components/DarkModeToggle.jsx'
import { useDarkMode } from '../hooks/useDarkMode.js'

const games = [
  {
    id: 'golf',
    name: 'Golf',
    description: 'A classic 8-card golf game. Flip cards, swap strategically, and aim for the lowest score!',
    path: '/golf',
    emoji: '⛳',
    color: '#14532D',
  },
  {
    id: 'race-game',
    name: 'Race Game',
    description: 'Fast-paced oval track racing with AI opponents. Control your car and race to victory!',
    path: '/race',
    emoji: '🏎️',
    color: '#DC2626',
  },
  {
    id: 'dots',
    name: 'Dots and Boxes',
    description: 'Strategic turn-based game. Draw lines to complete boxes and score points!',
    path: '/dots',
    emoji: '🔲',
    color: '#3B82F6',
  },
  {
    id: 'checkers',
    name: 'Checkers',
    description: 'Kid-friendly checkers with drag-and-drop, AI opponents, hints, and undo. Perfect for learning!',
    path: '/checkers',
    emoji: '👑',
    color: '#059669',
  },
  {
    id: 'archerfish',
    name: 'Archer Fish Racing',
    description: 'Escape evil robots! Shoot water, dodge obstacles, and survive the longest!',
    path: '/archerfish',
    emoji: '🐠',
    color: '#0EA5E9',
  },
  {
    id: 'battleplanes',
    name: 'Battle Planes',
    description: 'Defend the skies! Shoot down enemy fighter jets with lightning power!',
    path: '/battleplanes',
    emoji: '✈️',
    color: '#0EA5E9',
  },
]

export default function Home() {
  const { darkMode, toggleDarkMode } = useDarkMode('home:darkMode')

  const theme = {
    light: {
      background: '#f8f6f1',
      cardBg: '#ffffff',
      text: '#222',
      secondaryText: '#666',
      border: '#e5e5e5',
    },
    dark: {
      background: '#1a202c',
      cardBg: '#2d3748',
      text: '#e5e5e5',
      secondaryText: '#a3a3a3',
      border: '#4a5568',
    },
  }

  const currentTheme = darkMode ? theme.dark : theme.light

  useEffect(() => {
    document.body.style.backgroundColor = currentTheme.background
    document.documentElement.style.backgroundColor = currentTheme.background
  }, [currentTheme.background])

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: currentTheme.background,
        padding: '40px 20px',
        transition: 'background-color 0.3s ease',
      }}
    >
      <DarkModeToggle darkMode={darkMode} onToggle={toggleDarkMode} />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1
          style={{
            fontSize: 48,
            fontWeight: 'bold',
            color: currentTheme.text,
            marginBottom: 12,
          }}
        >
          Fun Games!
        </h1>
        <p
          style={{
            fontSize: 18,
            color: currentTheme.secondaryText,
            maxWidth: 500,
            margin: '0 auto',
          }}
        >
          Choose a game to play
        </p>
      </div>

      {/* Games Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 24,
          maxWidth: 900,
          margin: '0 auto',
        }}
      >
        {games.map((game) => (
          <Link
            key={game.id}
            to={game.path}
            style={{
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
              <div
                style={{
                  backgroundColor: currentTheme.cardBg,
                  borderRadius: 16,
                  padding: 24,
                  border: `2px solid ${currentTheme.border}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  height: '100%',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'
                  e.currentTarget.style.borderColor = game.color
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                  e.currentTarget.style.borderColor = currentTheme.border
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    marginBottom: 16,
                    textAlign: 'center',
                  }}
                >
                  {game.emoji}
                </div>
                <h2
                  style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: currentTheme.text,
                    marginBottom: 8,
                    textAlign: 'center',
                  }}
                >
                  {game.name}
                </h2>
                <p
                  style={{
                    fontSize: 14,
                    color: currentTheme.secondaryText,
                    textAlign: 'center',
                    lineHeight: 1.5,
                  }}
                >
                  {game.description}
                </p>
                <div
                  style={{
                    marginTop: 16,
                    textAlign: 'center',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      backgroundColor: game.color,
                      color: '#fff',
                      padding: '8px 20px',
                      borderRadius: 8,
                      fontWeight: '600',
                      fontSize: 14,
                    }}
                  >
                    Play Now
                  </span>
                </div>
              </div>
          </Link>
        ))}
      </div>

      {/* Coming Soon Placeholder */}
      <div
        style={{
          textAlign: 'center',
          marginTop: 48,
          padding: 24,
          color: currentTheme.secondaryText,
          fontSize: 14,
        }}
      >
        <p>More games coming soon! 🎲</p>
      </div>
    </div>
  )
}
