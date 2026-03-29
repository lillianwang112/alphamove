import type { MoveRating } from '../../types';

interface MoveRatingBadgeProps {
  rating: MoveRating;
  xpEarned: number;
}

const RATING_CONFIG: Record<MoveRating, {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  label: string;
  description: string;
}> = {
  brilliant: {
    color: '#26C2A3',
    bgColor: 'rgba(38, 194, 163, 0.12)',
    borderColor: 'rgba(38, 194, 163, 0.4)',
    icon: '✦',
    label: 'Brilliant!',
    description: 'Exceptional move',
  },
  great: {
    color: '#6366F1',
    bgColor: 'rgba(99, 102, 241, 0.12)',
    borderColor: 'rgba(99, 102, 241, 0.4)',
    icon: '✦',
    label: 'Great Move',
    description: 'Solid execution',
  },
  good: {
    color: '#22C55E',
    bgColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
    icon: '✓',
    label: 'Good Move',
    description: 'Sound reasoning',
  },
  inaccuracy: {
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    icon: '?!',
    label: 'Inaccuracy',
    description: 'Minor flaw',
  },
  mistake: {
    color: '#F97316',
    bgColor: 'rgba(249, 115, 22, 0.12)',
    borderColor: 'rgba(249, 115, 22, 0.4)',
    icon: '✗',
    label: 'Mistake',
    description: 'Flawed reasoning',
  },
  blunder: {
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    icon: '??',
    label: 'Blunder',
    description: 'Critical error',
  },
};

export default function MoveRatingBadge({ rating, xpEarned }: MoveRatingBadgeProps) {
  const config = RATING_CONFIG[rating];
  const isExtreme = rating === 'brilliant' || rating === 'blunder';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        animation: isExtreme ? 'screenShake 0.4s ease 0.7s both' : 'none',
      }}
    >
      {/* Main badge */}
      <div
        style={{
          '--rating-color': config.borderColor,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          padding: '24px 32px',
          background: config.bgColor,
          border: `2px solid ${config.borderColor}`,
          borderRadius: 'var(--radius-xl)',
          boxShadow: `0 0 32px ${config.borderColor}, 0 4px 16px rgba(0,0,0,0.3)`,
          minWidth: '200px',
          textAlign: 'center',
          animation: 'moveRatingSlam 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both, ratingGlow 2s ease-in-out 1s infinite',
        } as React.CSSProperties}
      >
        {/* Icon */}
        <span
          style={{
            fontSize: rating === 'brilliant' ? '2.5rem' : '2rem',
            fontWeight: 700,
            color: config.color,
            lineHeight: 1,
            filter: rating === 'brilliant' ? `drop-shadow(0 0 8px ${config.color})` : 'none',
          }}
        >
          {config.icon}
        </span>

        {/* Label */}
        <span
          style={{
            fontSize: '1.375rem',
            fontWeight: 700,
            color: config.color,
            letterSpacing: '-0.01em',
          }}
        >
          {config.label}
        </span>

        {/* Description */}
        <span
          style={{
            fontSize: '0.8rem',
            color: config.color,
            opacity: 0.8,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {config.description}
        </span>
      </div>

      {/* XP earned */}
      <div
        className="xp-earned-pop"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 20px',
          background: 'var(--xp-gold-light)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '999px',
        }}
      >
        <span style={{ fontSize: '1rem' }}>⚡</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1.125rem',
            fontWeight: 700,
            color: 'var(--xp-gold)',
          }}
        >
          +{xpEarned} XP
        </span>
      </div>
    </div>
  );
}
