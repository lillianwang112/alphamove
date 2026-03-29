import { useState } from 'react';
import type { Portfolio } from '../../types';
import BottomSheet from '../guidance/BottomSheet';
import InfoButton from '../guidance/InfoButton';

interface PortfolioSummaryProps {
  portfolio: Portfolio;
}

function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1000) {
    return `$${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${abs.toFixed(2)}`;
}

function formatPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
}

export default function PortfolioSummary({ portfolio }: PortfolioSummaryProps) {
  const [open, setOpen] = useState<null | 'value' | 'cash'>(null);
  const isPositive = portfolio.allTimeReturn >= 0;
  const isDayPositive = portfolio.dayChange >= 0;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-elevated) 100%)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '160px',
          height: '160px',
          background: `radial-gradient(circle, ${isPositive ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)'} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Total value */}
      <div style={{ marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: '0',
            }}
          >
            Total Portfolio Value
          </p>
          <InfoButton label="How to read this" onClick={() => setOpen('value')} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '2.25rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            ${portfolio.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: isPositive ? 'var(--success)' : 'var(--danger)',
              background: isPositive ? 'var(--success-light)' : 'var(--danger-light)',
              padding: '3px 10px',
              borderRadius: '999px',
              marginBottom: '4px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {isPositive ? '+' : '-'}{formatCurrency(portfolio.allTimeReturn)} ({formatPct(portfolio.allTimeReturnPct)})
          </span>
        </div>
      </div>

      <div
        style={{
          height: '1px',
          background: 'var(--border)',
          margin: '16px 0',
        }}
      />

      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
        }}
      >
        {/* Day change */}
        <div>
          <p
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}
          >
            Today
          </p>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1rem',
              fontWeight: 600,
              color: isDayPositive ? 'var(--success)' : 'var(--danger)',
            }}
          >
            {isDayPositive ? '+' : '-'}{formatCurrency(portfolio.dayChange)}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: isDayPositive ? 'var(--success)' : 'var(--danger)',
              opacity: 0.8,
            }}
          >
            {formatPct(portfolio.dayChangePct)}
          </p>
        </div>

        {/* Cash available */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <p
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                fontWeight: 500,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: 0,
              }}
            >
              Cash Available
            </p>
            <InfoButton label="?" onClick={() => setOpen('cash')} />
          </div>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            ${(portfolio.totalValue - portfolio.totalInvested).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}
          >
            Invested: ${portfolio.totalInvested.toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
      </div>

      <BottomSheet
        open={open === 'value'}
        onClose={() => setOpen(null)}
        title="Portfolio value"
        subtitle="This is your paper account in one number."
      >
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
          Portfolio value combines the current value of your positions with any cash you have not invested yet. It is the clearest snapshot of your overall position.
        </p>
      </BottomSheet>

      <BottomSheet
        open={open === 'cash'}
        onClose={() => setOpen(null)}
        title="Cash available"
        subtitle="Cash available is the part of your account that is still on the sidelines."
      >
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
          Use it to size your next move. Beginners usually learn faster by leaving some cash uncommitted instead of going all in on one idea.
        </p>
      </BottomSheet>
    </div>
  );
}
