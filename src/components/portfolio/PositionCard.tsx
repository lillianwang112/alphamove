import type { Position } from '../../types';

interface PositionCardProps {
  position: Position;
  onSell: (position: Position) => void;
}

export default function PositionCard({ position, onSell }: PositionCardProps) {
  const isPositive = position.totalReturn >= 0;
  const pctDisplay = `${isPositive ? '+' : ''}${(position.totalReturnPct * 100).toFixed(2)}%`;
  const returnDisplay = `${isPositive ? '+' : '-'}$${Math.abs(position.totalReturn).toFixed(2)}`;
  const borderColor = isPositive ? 'var(--success)' : 'var(--danger)';

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: 'var(--radius-lg)',
        padding: '16px 16px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        transition: 'border-color 0.2s ease, background 0.2s ease',
        animation: 'fadeIn 0.3s ease both',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle background tint from P/L */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '120px',
          height: '100%',
          background: `radial-gradient(ellipse at right center, ${isPositive ? 'rgba(34,197,94,0.04)' : 'rgba(239,68,68,0.04)'} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Top row: company info + price */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="ticker" style={{ fontSize: '1rem', letterSpacing: '-0.01em' }}>{position.ticker}</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
            {position.companyName}
          </p>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1, margin: 0 }}>
            ${position.currentPrice < 1 ? position.currentPrice.toFixed(4) : position.currentPrice.toFixed(2)}
          </p>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '3px', margin: '3px 0 0', letterSpacing: '0.03em' }}>per share</p>
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '0',
          background: 'var(--surface-elevated)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
        }}
      >
        {[
          { label: 'Shares', value: String(position.shares) },
          { label: 'Avg Cost', value: `$${position.avgCostBasis.toFixed(2)}` },
          { label: 'Value', value: `$${position.marketValue >= 1000 ? (position.marketValue / 1000).toFixed(1) + 'K' : position.marketValue.toFixed(0)}` },
        ].map((s, i) => (
          <div
            key={s.label}
            style={{
              padding: '10px 12px',
              borderRight: i < 2 ? '1px solid var(--border)' : 'none',
            }}
          >
            <p style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px', margin: '0 0 3px' }}>
              {s.label}
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom row: P/L + sell */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1.05rem',
              fontWeight: 800,
              color: isPositive ? 'var(--success)' : 'var(--danger)',
              letterSpacing: '-0.02em',
            }}
          >
            {returnDisplay}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: isPositive ? 'var(--success)' : 'var(--danger)',
              background: isPositive ? 'var(--success-light)' : 'var(--danger-light)',
              padding: '3px 9px',
              borderRadius: '999px',
              border: `1px solid ${isPositive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}
          >
            {pctDisplay}
          </span>
        </div>

        <button
          onClick={() => onSell(position)}
          style={{
            background: 'var(--gradient-danger)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '7px 18px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '-0.01em',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(239,68,68,0.4)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}
        >
          Sell
        </button>
      </div>
    </div>
  );
}
