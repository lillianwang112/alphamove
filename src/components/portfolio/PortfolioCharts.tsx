import type { Portfolio, Position } from '../../types';

interface PortfolioChartsProps {
  portfolio: Portfolio;
  positions: Position[];
}

function formatCurrency(v: number) {
  const abs = Math.abs(v);
  if (abs >= 1000) return `$${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  return `$${abs.toFixed(2)}`;
}

// Horizontal bar chart for allocation
function AllocationChart({ positions, totalValue }: { positions: Position[]; totalValue: number }) {
  if (positions.length === 0) return null;
  const COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#EC4899'];
  const sorted = [...positions].sort((a, b) => b.marketValue - a.marketValue);
  const cashValue = totalValue - positions.reduce((s, p) => s + p.marketValue, 0);

  return (
    <div>
      {/* Stacked bar */}
      <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', marginBottom: '14px', gap: '2px' }}>
        {sorted.map((p, i) => {
          const pct = (p.marketValue / totalValue) * 100;
          return (
            <div
              key={p.ticker}
              style={{ width: `${pct}%`, background: COLORS[i % COLORS.length], borderRadius: i === 0 ? '6px 0 0 6px' : i === sorted.length - 1 && cashValue <= 0 ? '0 6px 6px 0' : '0', minWidth: '3px', flexShrink: 0 }}
              title={`${p.ticker}: ${pct.toFixed(1)}%`}
            />
          );
        })}
        {cashValue > 0 && (
          <div
            style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: '0 6px 6px 0', minWidth: '4px' }}
            title={`Cash: ${((cashValue / totalValue) * 100).toFixed(1)}%`}
          />
        )}
      </div>

      {/* Legend rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {sorted.map((p, i) => {
          const pct = (p.marketValue / totalValue) * 100;
          return (
            <div key={p.ticker} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)', flexShrink: 0, minWidth: '44px' }}>{p.ticker}</span>
              {/* Bar */}
              <div style={{ flex: 1, height: '6px', background: 'var(--surface-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: COLORS[i % COLORS.length], borderRadius: '3px', transition: 'width 0.6s ease' }} />
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0, minWidth: '36px', textAlign: 'right' }}>{pct.toFixed(1)}%</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', flexShrink: 0, minWidth: '56px', textAlign: 'right' }}>{formatCurrency(p.marketValue)}</span>
            </div>
          );
        })}
        {cashValue > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0, minWidth: '44px' }}>CASH</span>
            <div style={{ flex: 1, height: '6px', background: 'var(--surface-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${(cashValue / totalValue) * 100}%`, height: '100%', background: 'rgba(255,255,255,0.12)', borderRadius: '3px' }} />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0, minWidth: '36px', textAlign: 'right' }}>{((cashValue / totalValue) * 100).toFixed(1)}%</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', flexShrink: 0, minWidth: '56px', textAlign: 'right' }}>{formatCurrency(cashValue)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// P&L bar chart per position
function PnLChart({ positions }: { positions: Position[] }) {
  if (positions.length === 0) return null;
  const sorted = [...positions].sort((a, b) => b.totalReturnPct - a.totalReturnPct);
  const maxAbs = Math.max(...sorted.map((p) => Math.abs(p.totalReturnPct)), 0.01);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
      {sorted.map((p) => {
        const pos = p.totalReturnPct >= 0;
        const color = pos ? '#22C55E' : '#EF4444';
        const pct = (Math.abs(p.totalReturnPct) / maxAbs) * 100;
        return (
          <div key={p.ticker} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)', flexShrink: 0, minWidth: '44px' }}>{p.ticker}</span>
            <div style={{ flex: 1, position: 'relative', height: '20px', display: 'flex', alignItems: 'center' }}>
              {/* Center line */}
              <div style={{ position: 'absolute', left: '50%', top: 0, width: '1px', height: '100%', background: 'rgba(255,255,255,0.08)' }} />
              {/* Bar fills from center */}
              <div style={{
                position: 'absolute',
                height: '8px',
                borderRadius: '4px',
                background: color,
                opacity: 0.85,
                transition: 'width 0.6s ease',
                ...(pos
                  ? { left: '50%', width: `${pct / 2}%` }
                  : { right: '50%', width: `${pct / 2}%` }
                ),
              }} />
            </div>
            <div style={{ flexShrink: 0, minWidth: '80px', textAlign: 'right' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color }}>
                {pos ? '+' : ''}{(p.totalReturnPct * 100).toFixed(2)}%
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                {pos ? '+' : '-'}{formatCurrency(Math.abs(p.totalReturn))}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PortfolioCharts({ portfolio, positions }: PortfolioChartsProps) {
  if (positions.length === 0) return null;

  const totalReturn = portfolio.allTimeReturn;
  const totalReturnPct = portfolio.allTimeReturnPct * 100;
  const isPositive = totalReturn >= 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Overall P&L hero */}
      <div style={{
        background: isPositive
          ? 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(20,21,34,0.98) 70%)'
          : 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(20,21,34,0.98) 70%)',
        border: `1px solid ${isPositive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
        borderRadius: 'var(--radius-xl)',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', fontWeight: 700 }}>Total Return</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 700, color: isPositive ? '#22C55E' : '#EF4444', lineHeight: 1 }}>
            {isPositive ? '+' : '-'}{formatCurrency(Math.abs(totalReturn))}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{
            display: 'inline-block', padding: '8px 14px', borderRadius: '999px',
            background: isPositive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            color: isPositive ? '#22C55E' : '#EF4444',
            fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700,
          }}>
            {isPositive ? '▲' : '▼'} {Math.abs(totalReturnPct).toFixed(2)}%
          </span>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            vs ${portfolio.totalInvested.toLocaleString('en-US', { maximumFractionDigits: 0 })} invested
          </p>
        </div>
      </div>

      {/* Allocation breakdown */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '16px 20px' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
          Allocation
        </p>
        <AllocationChart positions={positions} totalValue={portfolio.totalValue} />
      </div>

      {/* Per-position P&L */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '16px 20px' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
          Position Performance
        </p>
        <PnLChart positions={positions} />
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {[
          { label: 'Positions', value: String(positions.length) },
          { label: 'Best', value: positions.length ? `+${(Math.max(...positions.map(p => p.totalReturnPct)) * 100).toFixed(1)}%` : '—', color: '#22C55E' },
          { label: 'Worst', value: positions.length ? `${(Math.min(...positions.map(p => p.totalReturnPct)) * 100).toFixed(1)}%` : '—', color: '#EF4444' },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '12px 14px', textAlign: 'center' }}>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', fontWeight: 700 }}>{s.label}</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 700, color: s.color || 'var(--text-primary)' }}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
