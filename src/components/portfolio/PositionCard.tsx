import type { Position } from '../../types';

interface PositionCardProps {
  position: Position;
  onSell: (position: Position) => void;
}

export default function PositionCard({ position, onSell }: PositionCardProps) {
  const isPositive = position.totalReturn >= 0;
  const pctDisplay = `${isPositive ? '+' : ''}${(position.totalReturnPct * 100).toFixed(2)}%`;
  const returnDisplay = `${isPositive ? '+' : '-'}$${Math.abs(position.totalReturn).toFixed(2)}`;

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'border-color 0.2s ease',
        animation: 'fadeIn 0.3s ease both',
      }}
    >
      {/* Top row: ticker + price */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            {/* Ticker badge */}
            <span
              style={{
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.03em',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}
            >
              {position.ticker}
            </span>
          </div>
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              marginTop: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {position.companyName}
          </p>
        </div>

        {/* Current price */}
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            ${position.currentPrice.toFixed(2)}
          </p>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginTop: '1px',
            }}
          >
            per share
          </p>
        </div>
      </div>

      {/* Middle row: position details */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
          background: 'var(--surface-elevated)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 12px',
        }}
      >
        <div>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
            Shares
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {position.shares}
          </p>
        </div>
        <div>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
            Avg Cost
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            ${position.avgCostBasis.toFixed(2)}
          </p>
        </div>
        <div>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
            Value
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            ${position.marketValue.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Bottom row: return + sell button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '0.9rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: isPositive ? 'var(--success)' : 'var(--danger)',
            }}
          >
            {returnDisplay}
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: isPositive ? 'var(--success)' : 'var(--danger)',
              background: isPositive ? 'var(--success-light)' : 'var(--danger-light)',
              padding: '2px 8px',
              borderRadius: '999px',
            }}
          >
            {pctDisplay}
          </span>
        </div>

        <button
          onClick={() => onSell(position)}
          className="btn btn-sm btn-danger"
          style={{ minWidth: '64px' }}
        >
          Sell
        </button>
      </div>
    </div>
  );
}
