export default function DarkModeToggle({ darkMode, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        background: darkMode ? '#374151' : '#fff',
        color: darkMode ? '#fbbf24' : '#1a202c',
        border: darkMode ? '2px solid #4b5563' : '2px solid #1a202c',
        borderRadius: 8,
        padding: '8px 16px',
        fontSize: 14,
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 1000,
        transition: 'all 0.3s ease',
      }}
    >
      {darkMode ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}
