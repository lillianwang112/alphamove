interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
}

export function getChessPiece(level: number): string {
  if (level <= 2) return '♟';  // Pawn
  if (level <= 4) return '♞';  // Knight
  if (level <= 6) return '♝';  // Bishop
  if (level <= 8) return '♜';  // Rook
  if (level === 9) return '♛'; // Queen
  return '♚';                  // King
}

export function getLevelColor(level: number): string {
  if (level <= 2) return '#64748B';
  if (level <= 5) return '#6366F1';
  if (level <= 8) return '#F59E0B';
  return '#26C2A3';
}

const SIZES = {
  sm: { outer: 28, pieceSize: '0.85rem', numSize: '0.6rem', borderWidth: 2 },
  md: { outer: 40, pieceSize: '1.15rem', numSize: '0.72rem', borderWidth: 2 },
  lg: { outer: 60, pieceSize: '1.6rem',  numSize: '0.9rem',  borderWidth: 3 },
};

export default function LevelBadge({ level, size = 'md', showNumber = false }: LevelBadgeProps) {
  const color = getLevelColor(level);
  const dims = SIZES[size];
  const piece = getChessPiece(level);

  return (
    <div
      style={{
        width: `${dims.outer}px`,
        height: `${dims.outer}px`,
        borderRadius: '50%',
        background: `${color}22`,
        border: `${dims.borderWidth}px solid ${color}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: `0 0 12px ${color}40`,
        position: 'relative',
        gap: '0',
      }}
    >
      <span style={{ fontSize: dims.pieceSize, lineHeight: 1, color: 'white', WebkitTextStroke: '0.4px rgba(255,255,255,0.5)' }}>{piece}</span>
      {showNumber && (
        <span style={{
          fontSize: dims.numSize,
          fontWeight: 700,
          color: 'white',
          fontFamily: 'var(--font-mono)',
          lineHeight: 1,
          marginTop: '1px',
          opacity: 0.85,
        }}>
          {level}
        </span>
      )}
    </div>
  );
}
