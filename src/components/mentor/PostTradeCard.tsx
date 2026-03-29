import type { MoveRating } from '../../types';
import MoveRatingBadge from './MoveRatingBadge';

interface PostTradeCardProps {
  analysis: string;
  moveRating: MoveRating;
  xpEarned: number;
  xpReason: string;
  betterMove: string | null;
  onDone: () => void;
}

export default function PostTradeCard({
  analysis,
  moveRating,
  xpEarned,
  xpReason,
  betterMove,
  onDone,
}: PostTradeCardProps) {
  const isPositiveRating = moveRating === 'brilliant' || moveRating === 'great' || moveRating === 'good';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        animation: 'slideInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-elevated)',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--accent)',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '6px',
          }}
        >
          Chess Engine Analysis
        </p>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Move Evaluated
        </h3>
      </div>

      {/* Badge */}
      <div
        style={{
          padding: '28px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <MoveRatingBadge rating={moveRating} xpEarned={xpEarned} />
      </div>

      {/* Analysis */}
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span
            style={{
              width: '4px',
              height: '20px',
              background: 'var(--accent)',
              borderRadius: '2px',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
            Analysis
          </p>
        </div>
        <p
          style={{
            fontSize: '0.925rem',
            color: 'var(--text-primary)',
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          {analysis}
        </p>
      </div>

      {/* Better move suggestion */}
      {betterMove && !isPositiveRating && (
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'rgba(99, 102, 241, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span
              style={{
                fontSize: '1.25rem',
                flexShrink: 0,
                marginTop: '2px',
              }}
            >
              💡
            </span>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Stronger Move
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {betterMove}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* XP breakdown */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--xp-gold-light)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>⚡</span>
        <div>
          <p
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--xp-gold)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '4px',
            }}
          >
            +{xpEarned} XP Earned
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            {xpReason}
          </p>
        </div>
      </div>

      {/* Done button */}
      <div style={{ padding: '16px 20px' }}>
        <button
          onClick={onDone}
          className="btn btn-primary btn-full"
          style={{ fontSize: '1rem', height: '52px' }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
