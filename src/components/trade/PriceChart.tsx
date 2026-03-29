import { useState, useRef, useCallback } from 'react';

export type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y' | '10Y';

interface PriceChartProps {
  prices: number[];
  timestamps?: number[];
  isPositive: boolean;
  loading?: boolean;
  height?: number;
  range: TimeRange;
  onRangeChange: (r: TimeRange) => void;
  firstPrice?: number;
}

const RANGES: TimeRange[] = ['1W', '1M', '3M', '6M', '1Y', '10Y'];

function formatScrubDate(ts: number | undefined, idx: number, total: number, range: TimeRange): string {
  let date: Date;
  if (ts) {
    date = new Date(ts * 1000);
  } else {
    const daysMap: Record<TimeRange, number> = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '10Y': 3650 };
    const days = daysMap[range];
    const msPerPoint = (days * 24 * 60 * 60 * 1000) / Math.max(total - 1, 1);
    date = new Date(Date.now() - (total - 1 - idx) * msPerPoint);
  }
  if (range === '1W') return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  if (range === '1M') return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

export default function PriceChart({
  prices,
  timestamps,
  isPositive,
  loading,
  height = 110,
  range,
  onRangeChange,
  firstPrice,
}: PriceChartProps) {
  const color = isPositive ? '#22C55E' : '#EF4444';
  const gradId = `cg_${isPositive ? 'up' : 'dn'}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrubIdx, setScrubIdx] = useState<number | null>(null);

  const W = 300, H = height;
  const padY = 6;

  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 1;
  const dataRange = max - min || 1;

  const toX = (i: number) => prices.length < 2 ? 0 : (i / (prices.length - 1)) * W;
  const toY = (v: number) => H - padY - ((v - min) / dataRange) * (H - padY * 2);

  const pts = prices.map((p, i) => `${toX(i).toFixed(1)},${toY(p).toFixed(1)}`);
  const linePath = pts.length >= 2 ? `M ${pts.join(' L ')}` : '';
  const areaPath = pts.length >= 2 ? `M 0,${H} L ${pts.join(' L ')} L ${W},${H} Z` : '';

  const activeIdx = scrubIdx ?? prices.length - 1;
  const displayPrice = prices[activeIdx];
  const periodStart = firstPrice ?? prices[0];
  const periodChange = periodStart && displayPrice != null
    ? ((displayPrice - periodStart) / periodStart) * 100
    : null;
  const periodPositive = periodChange !== null && periodChange >= 0;
  const isScrubbing = scrubIdx !== null;

  const scrubX = isScrubbing ? toX(scrubIdx) : null;
  const scrubY = isScrubbing ? toY(prices[scrubIdx]) : null;

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || prices.length < 2) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    setScrubIdx(Math.round(pct * (prices.length - 1)));
  }, [prices.length]);

  const handlePointerLeave = useCallback(() => setScrubIdx(null), []);

  return (
    <div>
      {/* Range selector */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', alignItems: 'center' }}>
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => onRangeChange(r)}
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              border: `1px solid ${range === r ? color : 'rgba(255,255,255,0.08)'}`,
              background: range === r ? `${color}18` : 'transparent',
              color: range === r ? color : 'var(--text-muted)',
              fontSize: '0.7rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
              WebkitTapHighlightColor: 'transparent',
              flexShrink: 0,
            }}
          >
            {r}
          </button>
        ))}
        <span style={{
          marginLeft: 'auto',
          fontSize: '0.78rem',
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          color: periodPositive ? '#22C55E' : '#EF4444',
          transition: 'color 0.15s',
          flexShrink: 0,
        }}>
          {periodChange !== null ? `${periodPositive ? '+' : ''}${periodChange.toFixed(2)}%` : '—'}
        </span>
      </div>

      {/* Scrub tooltip row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '28px',
        marginBottom: '4px',
        padding: '0 2px',
        transition: 'opacity 0.1s',
        opacity: isScrubbing ? 1 : 0,
        pointerEvents: 'none',
      }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {isScrubbing ? formatScrubDate(timestamps?.[scrubIdx!], scrubIdx!, prices.length, range) : ''}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700, color }}>
          {isScrubbing && displayPrice != null
            ? `$${displayPrice < 1 ? displayPrice.toFixed(4) : displayPrice.toFixed(2)}`
            : ''}
        </span>
      </div>

      {/* Chart */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          borderRadius: '10px',
          overflow: 'hidden',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          cursor: prices.length >= 2 ? 'crosshair' : 'default',
        }}
        onPointerDown={(e) => e.preventDefault()}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        {loading ? (
          <div className="skeleton" style={{ height: `${height}px`, borderRadius: '10px' }} />
        ) : prices.length < 2 ? (
          <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Chart data unavailable</p>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            style={{ width: '100%', height: `${height}px`, display: 'block', overflow: 'visible' }}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={color} stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Area fill */}
            <path d={areaPath} fill={`url(#${gradId})`} />

            {/* Price line */}
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Scrub crosshair */}
            {isScrubbing && scrubX !== null && scrubY !== null && (
              <>
                <line
                  x1={scrubX} y1={padY} x2={scrubX} y2={H}
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <circle
                  cx={scrubX} cy={scrubY}
                  r="4.5"
                  fill={color}
                  stroke="#0A0A0F"
                  strokeWidth="2"
                />
              </>
            )}

            {/* End dot when not scrubbing */}
            {!isScrubbing && (
              <circle
                cx={toX(prices.length - 1)}
                cy={toY(prices[prices.length - 1])}
                r="3.5"
                fill={color}
                stroke="#0A0A0F"
                strokeWidth="2"
              />
            )}
          </svg>
        )}
      </div>
    </div>
  );
}
