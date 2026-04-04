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

function formatAxisDate(ts: number | undefined, idx: number, total: number, range: TimeRange): string {
  let date: Date;
  if (ts) {
    date = new Date(ts * 1000);
  } else {
    const daysMap: Record<TimeRange, number> = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '10Y': 3650 };
    const days = daysMap[range];
    const msPerPoint = (days * 24 * 60 * 60 * 1000) / Math.max(total - 1, 1);
    date = new Date(Date.now() - (total - 1 - idx) * msPerPoint);
  }
  if (range === '1W') return date.toLocaleDateString('en-US', { weekday: 'short' });
  if (range === '1M') return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (range === '3M' || range === '6M') return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

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

function formatPrice(p: number): string {
  if (p >= 1000) return `$${(p / 1000).toFixed(1)}k`;
  if (p >= 1) return `$${p.toFixed(0)}`;
  if (p >= 0.01) return `$${p.toFixed(3)}`;
  return `$${p.toFixed(5)}`;
}

export default function PriceChart({
  prices,
  timestamps,
  isPositive,
  loading,
  height = 180,
  range,
  onRangeChange,
  firstPrice,
}: PriceChartProps) {
  const color = isPositive ? '#22C55E' : '#EF4444';
  const gradId = `cg_${isPositive ? 'up' : 'dn'}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrubIdx, setScrubIdx] = useState<number | null>(null);

  // SVG dimensions with room for Y-axis labels (right) and X-axis labels (bottom)
  const W = 300;
  const H = height;
  const padY = 8;
  const padRight = 52; // space for Y-axis price labels
  const padBottom = 22; // space for X-axis date labels
  const chartW = W - padRight;
  const chartH = H - padBottom;

  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 1;
  const dataRange = max - min || 1;

  const toX = (i: number) => prices.length < 2 ? 0 : (i / (prices.length - 1)) * chartW;
  const toY = (v: number) => H - padBottom - padY - ((v - min) / dataRange) * (chartH - padY * 2);

  const pts = prices.map((p, i) => `${toX(i).toFixed(1)},${toY(p).toFixed(1)}`);
  const linePath = pts.length >= 2 ? `M ${pts.join(' L ')}` : '';
  const areaPath = pts.length >= 2 ? `M 0,${chartH - padY} L ${pts.join(' L ')} L ${chartW},${chartH - padY} Z` : '';

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

  // Y-axis labels: 4 levels
  const yLevels = [0, 0.33, 0.66, 1];
  const yLabels = yLevels.map(pct => ({
    price: min + pct * dataRange,
    y: H - padBottom - padY - pct * (chartH - padY * 2),
  }));

  // X-axis labels: 4 evenly spaced indices
  const xLabelCount = 4;
  const xLabelIndices = prices.length >= 4
    ? Array.from({ length: xLabelCount }, (_, i) => Math.round((i / (xLabelCount - 1)) * (prices.length - 1)))
    : [];

  // Baseline (period start) Y position
  const baselineY = periodStart ? toY(periodStart) : null;

  // Gridlines at 25%, 50%, 75% chart height
  const gridYs = [0.25, 0.5, 0.75].map(pct => H - padBottom - padY - pct * (chartH - padY * 2));

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || prices.length < 2) return;
    const rect = containerRef.current.getBoundingClientRect();
    // Only use chartW portion of the container for scrubbing
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / (rect.width * (chartW / W))));
    setScrubIdx(Math.round(pct * (prices.length - 1)));
  }, [prices.length, chartW]);

  const handlePointerLeave = useCallback(() => setScrubIdx(null), []);

  return (
    <div>
      {/* Range selector */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', alignItems: 'center' }}>
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => onRangeChange(r)}
            style={{
              padding: '5px 10px',
              borderRadius: '7px',
              border: `1px solid ${range === r ? color : 'rgba(255,255,255,0.06)'}`,
              background: range === r ? `${color}22` : 'rgba(255,255,255,0.03)',
              color: range === r ? color : 'var(--text-muted)',
              fontSize: '0.68rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
              WebkitTapHighlightColor: 'transparent',
              flexShrink: 0,
              letterSpacing: '0.04em',
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

      {/* Scrub info row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '24px',
        marginBottom: '6px',
        padding: '0 2px',
        transition: 'opacity 0.1s',
        opacity: isScrubbing ? 1 : 0,
        pointerEvents: 'none',
      }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {isScrubbing ? formatScrubDate(timestamps?.[scrubIdx!], scrubIdx!, prices.length, range) : ''}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 700, color }}>
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
                <stop offset="0%" stopColor={color} stopOpacity="0.28" />
                <stop offset="75%" stopColor={color} stopOpacity="0.06" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Gridlines */}
            {gridYs.map((gy, i) => (
              <line
                key={i}
                x1={0} y1={gy} x2={chartW} y2={gy}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="1"
              />
            ))}

            {/* Baseline reference line at period start price */}
            {baselineY !== null && baselineY > padY && baselineY < chartH && (
              <line
                x1={0} y1={baselineY} x2={chartW} y2={baselineY}
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            )}

            {/* Area fill */}
            <path d={areaPath} fill={`url(#${gradId})`} />

            {/* Price line */}
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Y-axis price labels */}
            {yLabels.map((label, i) => (
              <text
                key={i}
                x={chartW + 4}
                y={label.y + 4}
                fontSize="9"
                fill="rgba(148,163,184,0.7)"
                fontFamily="'JetBrains Mono', monospace"
                textAnchor="start"
              >
                {formatPrice(label.price)}
              </text>
            ))}

            {/* X-axis date labels */}
            {xLabelIndices.map((idx, i) => {
              const x = toX(idx);
              const label = formatAxisDate(timestamps?.[idx], idx, prices.length, range);
              const anchor = i === 0 ? 'start' : i === xLabelIndices.length - 1 ? 'end' : 'middle';
              return (
                <text
                  key={i}
                  x={x}
                  y={H - 4}
                  fontSize="8.5"
                  fill="rgba(148,163,184,0.55)"
                  fontFamily="system-ui, sans-serif"
                  textAnchor={anchor}
                >
                  {label}
                </text>
              );
            })}

            {/* X-axis separator line */}
            <line
              x1={0} y1={chartH - padY} x2={chartW} y2={chartH - padY}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />

            {/* Scrub crosshair */}
            {isScrubbing && scrubX !== null && scrubY !== null && (
              <>
                <line
                  x1={scrubX} y1={padY} x2={scrubX} y2={chartH - padY}
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <line
                  x1={0} y1={scrubY} x2={chartW} y2={scrubY}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <circle
                  cx={scrubX} cy={scrubY}
                  r="5"
                  fill={color}
                  stroke="#08080F"
                  strokeWidth="2.5"
                />
              </>
            )}

            {/* End dot when not scrubbing */}
            {!isScrubbing && (
              <>
                <circle
                  cx={toX(prices.length - 1)}
                  cy={toY(prices[prices.length - 1])}
                  r="4"
                  fill={color}
                  stroke="#08080F"
                  strokeWidth="2.5"
                />
                {/* Pulse ring */}
                <circle
                  cx={toX(prices.length - 1)}
                  cy={toY(prices[prices.length - 1])}
                  r="8"
                  fill="none"
                  stroke={color}
                  strokeWidth="1"
                  strokeOpacity="0.35"
                />
              </>
            )}
          </svg>
        )}
      </div>
    </div>
  );
}
