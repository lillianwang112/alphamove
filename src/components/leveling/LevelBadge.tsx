interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
}

function getLevelColor(level: number): string {
  if (level <= 2) return '#64748B';
  if (level <= 5) return '#6366F1';
  if (level <= 8) return '#F59E0B';
  return '#26C2A3';
}

const SIZES = {
  sm: { outer: 28, inner: 22, fontSize: '0.7rem', borderWidth: 2 },
  md: { outer: 40, inner: 32, fontSize: '0.875rem', borderWidth: 2 },
  lg: { outer: 60, inner: 48, fontSize: '1.125rem', borderWidth: 3 },
};

export default function LevelBadge({ level, size = 'md' }: LevelBadgeProps) {
  const color = getLevelColor(level);
  const dims = SIZES[size];

  return (
    <div
      style={{
        width: `${dims.outer}px`,
        height: `${dims.outer}px`,
        borderRadius: '50%',
        background: `${color}20`,
        border: `${dims.borderWidth}px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: dims.fontSize,
        fontWeight: 700,
        color: color,
        fontFamily: 'var(--font-mono)',
        flexShrink: 0,
        boxShadow: `0 0 12px ${color}40`,
      }}
    >
      {level}
    </div>
  );
}
