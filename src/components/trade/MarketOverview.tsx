import { useState, useEffect } from 'react';
import { getQuote } from '../../services/marketService';

interface TickerQuote {
  ticker: string;
  label: string;
  price: number;
  changePct: number;
  prevClose: number;
  high: number;
  low: number;
}

const WATCH_LIST = [
  { ticker: 'SPY',  label: 'S&P 500' },
  { ticker: 'QQQ',  label: 'Nasdaq' },
  { ticker: 'DIA',  label: 'Dow Jones' },
  { ticker: 'AAPL', label: 'Apple' },
  { ticker: 'NVDA', label: 'NVIDIA' },
  { ticker: 'TSLA', label: 'Tesla' },
  { ticker: 'MSFT', label: 'Microsoft' },
  { ticker: 'AMZN', label: 'Amazon' },
  { ticker: 'META', label: 'Meta' },
  { ticker: 'GOOGL',label: 'Alphabet' },
];

function MiniSparkline({ prevClose, high, low, price, positive }: {
  prevClose: number; high: number; low: number; price: number; positive: boolean;
}) {
  const color = positive ? '#22C55E' : '#EF4444';
  // Synthetic sparkline based on real quote anchors (open, high, low, close)
  const range = high - low || price * 0.01;
  const pts: number[] = Array.from({ length: 8 }, (_, i) => {
    const t = i / 7;
    const base = prevClose + (price - prevClose) * t;
    const wave = range * 0.25 * Math.sin(i * 1.8 + (positive ? 0.5 : 2.5));
    return Math.max(low * 0.999, Math.min(high * 1.001, base + wave));
  });

  const W = 60, H = 28, pad = 2;
  const mn = Math.min(...pts), mx = Math.max(...pts), dr = mx - mn || 1;
  const toX = (i: number) => (i / 7) * W;
  const toY = (v: number) => H - pad - ((v - mn) / dr) * (H - pad * 2);
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)},${toY(p).toFixed(1)}`).join(' ');
  const area = `${d} L ${W},${H} L 0,${H} Z`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', flexShrink: 0 }}>
      <defs>
        <linearGradient id={`mg_${positive}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#mg_${positive})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function MarketOverview({ onSelect }: { onSelect?: (ticker: string, label: string) => void }) {
  const [quotes, setQuotes] = useState<TickerQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      // Quotes only — no candle fetches here to avoid API rate limiting
      const results = await Promise.allSettled(
        WATCH_LIST.map(({ ticker }) => getQuote(ticker).then(q => ({ ticker, q })))
      );
      if (cancelled) return;
      const loaded: TickerQuote[] = [];
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          const { ticker, q } = r.value;
          loaded.push({
            ticker,
            label: WATCH_LIST[i].label,
            price: q.price,
            changePct: q.changePct * 100,
            prevClose: q.prevClose,
            high: q.high,
            low: q.low,
          });
        }
      });
      setQuotes(loaded);
      setLoading(false);
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {WATCH_LIST.slice(0, 5).map((_, i) => (
          <div key={i} className="skeleton" style={{ minWidth: '120px', height: '72px', borderRadius: '12px', flexShrink: 0 }} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
        Market Overview
      </p>
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', scrollbarWidth: 'none' }}>
        {quotes.map((q) => {
          const pos = q.changePct >= 0;
          const color = pos ? '#22C55E' : '#EF4444';
          return (
            <button
              key={q.ticker}
              onClick={() => onSelect?.(q.ticker, q.label)}
              style={{
                minWidth: '120px',
                background: 'var(--surface)',
                border: `1px solid ${pos ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                borderRadius: '12px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                cursor: onSelect ? 'pointer' : 'default',
                textAlign: 'left',
                flexShrink: 0,
                transition: 'background 0.15s',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-elevated)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)', margin: 0 }}>{q.ticker}</p>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap' }}>{q.label}</p>
                </div>
                <MiniSparkline prevClose={q.prevClose} high={q.high} low={q.low} price={q.price} positive={pos} />
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                ${q.price < 10 ? q.price.toFixed(3) : q.price.toFixed(2)}
              </p>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>
                {pos ? '▲' : '▼'} {Math.abs(q.changePct).toFixed(2)}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
