import { Crown } from 'lucide-react';
import { PLAYER_COLORS, PIECE_TYPES, PIECE_COLORS } from '../constants';


const CheckerPiece = ({ piece, isSelected, darkMode = false }) => {
  if (!piece) return null;

  const isRed = piece.color === PLAYER_COLORS.RED;
  const isKing = piece.type === PIECE_TYPES.KING;

  // Adjust black piece color for dark mode
  let pieceColor = isRed ? PIECE_COLORS.RED : PIECE_COLORS.BLACK;
  let pieceLightColor = isRed ? PIECE_COLORS.RED_LIGHT : PIECE_COLORS.BLACK_LIGHT;

  if (!isRed && darkMode) {
    // Make black pieces more visible in dark mode
    pieceColor = '#f3f4f6'; // light gray
    pieceLightColor = '#a3a3a3'; // medium gray
  }

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      <div
        className="rounded-full shadow-lg flex items-center justify-center cursor-pointer"
        style={{
          width: '80%',
          height: '80%',
          minWidth: '80%',
          minHeight: '80%',
          maxWidth: '80%',
          maxHeight: '80%',
          boxSizing: 'border-box',
          background: `radial-gradient(circle at 30% 30%, ${pieceLightColor}, ${pieceColor})`,
          border: isSelected ? '3px solid #fbbf24' : '2px solid rgba(0,0,0,0.2)',
          boxShadow: isSelected
            ? '0 8px 16px rgba(0,0,0,0.3), 0 0 20px rgba(251, 191, 36, 0.5)'
            : '0 4px 8px rgba(0,0,0,0.2)',
          transform: 'none !important',
          animation: 'none !important',
          overflow: 'hidden',
          flexShrink: 0,
          flexGrow: 0
        }}
      >
        {isKing && (
          <Crown
            size={18}
            strokeWidth={2.5}
            style={{
              flexShrink: 0,
              color: '#fde047',
              fill: '#fde047'
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CheckerPiece;
