type TimeRange = '1W' | '1M' | '3M';

interface PriceChartProps {
  prices: number[];
  isPositive: boolean;
  loading?: boolean;
  height?: number;
  range: TimeRange;
  onRangeChange: (r: TimeRange) => void;
  firstPrice?: number;
}

export type { TimeRange };

export default function PriceChart({ prices, isPositive, loading, height = 100, range, onRangeChange, firstPrice }: PriceChartProps) {
  const color = isPositive ? '#22C55E' : '#EF4444';
  const gradId = `chart_grad_${isPositive ? 'up' : 'dn'}`;

  const w = 300, h = height;
  const padY = 8;

  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 1;
  const range_ = max - min || 1;

  const toX = (i: number) => prices.length < 2 ? 0 : (i / (prices.length - 1)) * w;
  const toY = (v: number) => h - padY - ((v - min) / range_) * (h - padY * 2);

  const pts = prices.map((p, i) => `${toX(i).toFixed(1)},${toY(p).toFixed(1)}`);
  const linePath = pts.length >= 2 ? `M ${pts.join(' L ')}` : '';
  const areaPath = pts.length >= 2
    ? `M 0,${h} L ${pts.join(' L ')} L ${w},${h} Z`
    : '';

  // Period change
  const periodStart = firstPrice ?? prices[0];
  const periodEnd = prices[prices.length - 1];
  const periodChange = periodStart && periodEnd ? ((periodEnd - periodStart) / periodStart) * 100 : null;
  const periodPositive = periodChange !== null && periodChange >= 0;

  return (
    <div>
      {/* Range selector */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {(['1W', '1M', '3M'] as TimeRange[]).map((r) => (
          <button
            key={r}
            onClick={() => onRangeChange(r)}
            style={{
              padding: '5px 14px',
              borderRadius: '999px',
              border: `1px solid ${range === r ? color : 'var(--border)'}`,
              background: range === r ? `${color}18` : 'transparent',
              color: range === r ? color : 'var(--text-muted)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {r}
          </button>
        ))}
        {periodChange !== null && (
          <span style={{
            marginLeft: 'auto',
            fontSize: '0.8rem',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color: periodPositive ? '#22C55E' : '#EF4444',
            alignSelf: 'center',
          }}>
            {periodPositive ? '+' : ''}{periodChange.toFixed(2)}%
          </span>
        )}
      </div>

      {/* Chart */}
      <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div className="skeleton" style={{ height: `${height}px`, borderRadius: '12px' }} />
        ) : prices.length < 2 ? (
          <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Chart data unavailable</p>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${w} ${h}`}
            preserveAspectRatio="none"
            style={{ width: '100%', height: `${height}px`, display: 'block' }}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={color} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#${gradId})`} />
            <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle
              cx={toX(prices.length - 1)}
              cy={toY(prices[prices.length - 1])}
              r="3.5"
              fill={color}
              stroke="var(--surface)"
              strokeWidth="1.5"
            />
          </svg>
        )}
      </div>
    </div>
  );
}
