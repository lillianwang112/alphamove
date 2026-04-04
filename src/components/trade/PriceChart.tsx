import { useState, useRef, useCallback } from 'react';

export type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y' | '10Y';
export type ChartMode = 'line' | 'candle';

interface PriceChartProps {
  prices: number[];
  timestamps?: number[];
  highs?: number[];
  lows?: number[];
  opens?: number[];
  volumes?: number[];
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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

function formatPrice(p: number): string {
  if (p >= 1000) return `$${(p / 1000).toFixed(1)}k`;
  if (p >= 1) return `$${p.toFixed(0)}`;
  return `$${p.toFixed(3)}`;
}

function formatVolume(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

export default function PriceChart({
  prices,
  timestamps,
  highs = [],
  lows = [],
  opens = [],
  volumes = [],
  isPositive,
  loading,
  height = 200,
  range,
  onRangeChange,
  firstPrice,
}: PriceChartProps) {
  const color = isPositive ? '#22C55E' : '#EF4444';
  const gradId = `cg_${isPositive ? 'up' : 'dn'}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrubIdx, setScrubIdx] = useState<number | null>(null);
  const [chartMode, setChartMode] = useState<ChartMode>('line');

  const hasOHLC = opens.length === prices.length && highs.length === prices.length && lows.length === prices.length;
  const hasVolume = volumes.length === prices.length && volumes.some(v => v > 0);
  const canShowCandle = hasOHLC && prices.length > 1;

  // SVG layout
  const W = 320;
  const volH = hasVolume ? 36 : 0;
  const padY = 8;
  const padRight = 54;
  const padBottom = 22;
  const chartW = W - padRight;
  const mainH = height - padBottom - volH;

  // Price domain
  const allPrices = hasOHLC ? [...prices, ...highs, ...lows] : prices;
  const minP = allPrices.length ? Math.min(...allPrices) : 0;
  const maxP = allPrices.length ? Math.max(...allPrices) : 1;
  const priceRange = maxP - minP || 1;

  const toX = (i: number) => prices.length < 2 ? 0 : (i / (prices.length - 1)) * chartW;
  const toY = (v: number) => mainH - padY - ((v - minP) / priceRange) * (mainH - padY * 2);

  // Volume domain
  const maxVol = hasVolume ? Math.max(...volumes) : 1;
  const toVolH = (v: number) => (v / maxVol) * (volH - 4);

  // Line chart paths
  const pts = prices.map((p, i) => `${toX(i).toFixed(1)},${toY(p).toFixed(1)}`);
  const linePath = pts.length >= 2 ? `M ${pts.join(' L ')}` : '';
  const areaPath = pts.length >= 2 ? `M 0,${mainH - padY} L ${pts.join(' L ')} L ${chartW},${mainH - padY} Z` : '';

  // Candle width
  const candleW = prices.length > 1 ? Math.max(1.5, (chartW / prices.length) * 0.7) : 6;

  const activeIdx = scrubIdx ?? prices.length - 1;
  const displayClose = prices[activeIdx];
  const displayOpen = opens[activeIdx];
  const displayHigh = highs[activeIdx];
  const displayLow = lows[activeIdx];
  const displayVol = volumes[activeIdx];

  const periodStart = firstPrice ?? prices[0];
  const periodChange = periodStart && displayClose != null
    ? ((displayClose - periodStart) / periodStart) * 100
    : null;
  const periodPositive = periodChange !== null && periodChange >= 0;
  const isScrubbing = scrubIdx !== null;

  const scrubX = isScrubbing ? toX(scrubIdx) : null;
  const scrubY = isScrubbing ? toY(prices[scrubIdx]) : null;

  // Y-axis labels
  const yLevels = [0, 0.33, 0.66, 1];
  const yLabels = yLevels.map(pct => ({
    price: minP + pct * priceRange,
    y: mainH - padY - pct * (mainH - padY * 2),
  }));

  // X-axis labels
  const xLabelCount = 4;
  const xLabelIndices = prices.length >= 4
    ? Array.from({ length: xLabelCount }, (_, i) => Math.round((i / (xLabelCount - 1)) * (prices.length - 1)))
    : [];

  // Baseline
  const baselineY = periodStart ? toY(periodStart) : null;

  // Gridlines
  const gridYs = [0.25, 0.5, 0.75].map(pct => mainH - padY - pct * (mainH - padY * 2));

  // Notable movements: indices where daily move > 3%
  const notableIndices: Array<{ idx: number; up: boolean }> = [];
  for (let i = 1; i < prices.length; i++) {
    const pct = (prices[i] - prices[i - 1]) / prices[i - 1];
    if (Math.abs(pct) > 0.03) {
      notableIndices.push({ idx: i, up: pct > 0 });
    }
  }

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || prices.length < 2) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const effectiveW = rect.width * (chartW / W);
    const pct = Math.max(0, Math.min(1, x / effectiveW));
    setScrubIdx(Math.round(pct * (prices.length - 1)));
  }, [prices.length, chartW]);

  const handlePointerLeave = useCallback(() => setScrubIdx(null), []);

  const effectiveMode = (chartMode === 'candle' && canShowCandle) ? 'candle' : 'line';

  return (
    <div>
      {/* Top controls: range + mode toggle */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '3px', flex: 1, flexWrap: 'wrap' }}>
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              style={{
                padding: '4px 9px',
                borderRadius: '6px',
                border: `1px solid ${range === r ? color : 'rgba(255,255,255,0.06)'}`,
                background: range === r ? `${color}22` : 'rgba(255,255,255,0.03)',
                color: range === r ? color : 'var(--text-muted)',
                fontSize: '0.67rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s',
                WebkitTapHighlightColor: 'transparent',
                letterSpacing: '0.04em',
              }}
            >{r}</button>
          ))}
        </div>
        {/* Mode toggle */}
        {canShowCandle && (
          <div style={{ display: 'flex', background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
            {(['line', 'candle'] as ChartMode[]).map(m => (
              <button key={m} onClick={() => setChartMode(m)} style={{
                padding: '4px 8px', border: 'none', fontSize: '0.62rem', fontWeight: 700,
                background: chartMode === m ? 'var(--accent)' : 'transparent',
                color: chartMode === m ? 'white' : 'var(--text-muted)',
                cursor: 'pointer', textTransform: 'capitalize', letterSpacing: '0.03em',
              }}>{m}</button>
            ))}
          </div>
        )}
      </div>

      {/* OHLCV info bar */}
      <div style={{
        display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap',
        marginBottom: '8px', minHeight: '20px',
        fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 600,
      }}>
        {isScrubbing ? (
          <>
            {displayOpen != null && <span><span style={{ color: 'var(--text-muted)' }}>O </span><span style={{ color: 'var(--text-primary)' }}>${displayOpen.toFixed(2)}</span></span>}
            {displayHigh != null && <span><span style={{ color: 'var(--text-muted)' }}>H </span><span style={{ color: '#22C55E' }}>${displayHigh.toFixed(2)}</span></span>}
            {displayLow != null && <span><span style={{ color: 'var(--text-muted)' }}>L </span><span style={{ color: '#EF4444' }}>${displayLow.toFixed(2)}</span></span>}
            {displayClose != null && <span><span style={{ color: 'var(--text-muted)' }}>C </span><span style={{ color: color }}>${displayClose.toFixed(2)}</span></span>}
            {displayVol > 0 && <span><span style={{ color: 'var(--text-muted)' }}>V </span><span style={{ color: 'var(--text-secondary)' }}>{formatVolume(displayVol)}</span></span>}
            <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'system-ui' }}>
              {formatScrubDate(timestamps?.[scrubIdx!], scrubIdx!, prices.length, range)}
            </span>
          </>
        ) : (
          <span style={{
            marginLeft: 'auto',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: periodPositive ? '#22C55E' : '#EF4444',
          }}>
            {periodChange !== null ? `${periodPositive ? '+' : ''}${periodChange.toFixed(2)}%` : '—'}
          </span>
        )}
      </div>

      {/* Chart */}
      <div
        ref={containerRef}
        style={{ position: 'relative', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', cursor: prices.length >= 2 ? 'crosshair' : 'default' }}
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
            viewBox={`0 0 ${W} ${height}`}
            preserveAspectRatio="none"
            style={{ width: '100%', height: `${height}px`, display: 'block', overflow: 'visible' }}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.28" />
                <stop offset="75%" stopColor={color} stopOpacity="0.04" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Gridlines */}
            {gridYs.map((gy, i) => (
              <line key={i} x1={0} y1={gy} x2={chartW} y2={gy} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            ))}

            {/* Baseline */}
            {baselineY !== null && baselineY > padY && baselineY < mainH && (
              <line x1={0} y1={baselineY} x2={chartW} y2={baselineY}
                stroke="rgba(255,255,255,0.14)" strokeWidth="1" strokeDasharray="4,4" />
            )}

            {/* X-axis separator */}
            <line x1={0} y1={mainH - padY} x2={chartW} y2={mainH - padY} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

            {/* LINE MODE */}
            {effectiveMode === 'line' && (
              <>
                <path d={areaPath} fill={`url(#${gradId})`} />
                <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </>
            )}

            {/* CANDLESTICK MODE */}
            {effectiveMode === 'candle' && prices.map((close, i) => {
              const open = opens[i] ?? close;
              const high = highs[i] ?? close;
              const low = lows[i] ?? close;
              const bullish = close >= open;
              const cColor = bullish ? '#22C55E' : '#EF4444';
              const cx = toX(i);
              const bodyTop = toY(Math.max(open, close));
              const bodyBot = toY(Math.min(open, close));
              const bodyH = Math.max(bodyBot - bodyTop, 1);
              const wickTop = toY(high);
              const wickBot = toY(low);
              return (
                <g key={i}>
                  {/* Wick */}
                  <line x1={cx} y1={wickTop} x2={cx} y2={wickBot} stroke={cColor} strokeWidth="1.2" />
                  {/* Body */}
                  <rect
                    x={cx - candleW / 2} y={bodyTop}
                    width={candleW} height={bodyH}
                    fill={cColor}
                    fillOpacity={0.85}
                    rx="1"
                  />
                </g>
              );
            })}

            {/* Notable movement markers */}
            {notableIndices.slice(0, 8).map(({ idx, up }) => {
              const nx = toX(idx);
              const ny = toY(prices[idx]);
              const markerY = up ? ny - 10 : ny + 10;
              const markerColor = up ? '#22C55E' : '#EF4444';
              return (
                <g key={`notable-${idx}`}>
                  <circle cx={nx} cy={markerY} r="3.5" fill={markerColor} fillOpacity="0.9" />
                </g>
              );
            })}

            {/* Volume bars */}
            {hasVolume && (
              <g transform={`translate(0, ${mainH + 4})`}>
                {volumes.map((v, i) => {
                  const bx = toX(i);
                  const bh = toVolH(v);
                  const close = prices[i];
                  const open = opens[i] ?? close;
                  const bullish = close >= open;
                  return (
                    <rect
                      key={i}
                      x={bx - candleW / 2} y={volH - 4 - bh}
                      width={candleW} height={bh}
                      fill={bullish ? '#22C55E' : '#EF4444'}
                      fillOpacity="0.35"
                      rx="1"
                    />
                  );
                })}
              </g>
            )}

            {/* Y-axis price labels */}
            {yLabels.map((label, i) => (
              <text key={i} x={chartW + 4} y={label.y + 4}
                fontSize="9" fill="rgba(148,163,184,0.7)"
                fontFamily="'JetBrains Mono', monospace" textAnchor="start">
                {formatPrice(label.price)}
              </text>
            ))}

            {/* X-axis labels */}
            {xLabelIndices.map((idx, i) => {
              const x = toX(idx);
              const label = formatAxisDate(timestamps?.[idx], idx, prices.length, range);
              const anchor = i === 0 ? 'start' : i === xLabelIndices.length - 1 ? 'end' : 'middle';
              return (
                <text key={i} x={x} y={height - 4}
                  fontSize="8.5" fill="rgba(148,163,184,0.5)"
                  fontFamily="system-ui, sans-serif" textAnchor={anchor}>
                  {label}
                </text>
              );
            })}

            {/* Scrub crosshair */}
            {isScrubbing && scrubX !== null && scrubY !== null && (
              <>
                <line x1={scrubX} y1={padY} x2={scrubX} y2={mainH - padY}
                  stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3,3" />
                <line x1={0} y1={scrubY} x2={chartW} y2={scrubY}
                  stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3,3" />
                <circle cx={scrubX} cy={scrubY} r="5"
                  fill={color} stroke="#08080F" strokeWidth="2.5" />
              </>
            )}

            {/* End dot (not scrubbing, line mode) */}
            {!isScrubbing && effectiveMode === 'line' && (
              <>
                <circle cx={toX(prices.length - 1)} cy={toY(prices[prices.length - 1])}
                  r="4" fill={color} stroke="#08080F" strokeWidth="2.5" />
                <circle cx={toX(prices.length - 1)} cy={toY(prices[prices.length - 1])}
                  r="8" fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.3" />
              </>
            )}
          </svg>
        )}
      </div>
    </div>
  );
}
