import { useState, useEffect, useRef } from 'react';
import { getQuote } from '../../services/marketService';

type Region = 'US' | 'Europe' | 'Asia';

const MARKETS: Record<Region, Array<{ ticker: string; label: string; flag: string }>> = {
  US: [
    { ticker: 'SPY', label: 'S&P 500', flag: '🇺🇸' },
    { ticker: 'QQQ', label: 'NASDAQ', flag: '🇺🇸' },
    { ticker: 'DIA', label: 'Dow Jones', flag: '🇺🇸' },
    { ticker: 'IWM', label: 'Russell 2000', flag: '🇺🇸' },
    { ticker: 'VIX', label: 'VIX', flag: '📊' },
  ],
  Europe: [
    { ticker: 'VGK', label: 'Europe', flag: '🇪🇺' },
    { ticker: 'EWG', label: 'Germany', flag: '🇩🇪' },
    { ticker: 'EWU', label: 'UK', flag: '🇬🇧' },
    { ticker: 'EWI', label: 'Italy', flag: '🇮🇹' },
    { ticker: 'EWP', label: 'Spain', flag: '🇪🇸' },
  ],
  Asia: [
    { ticker: 'EWJ', label: 'Japan', flag: '🇯🇵' },
    { ticker: 'KWEB', label: 'China', flag: '🇨🇳' },
    { ticker: 'EWT', label: 'Taiwan', flag: '🇹🇼' },
    { ticker: 'EWY', label: 'S. Korea', flag: '🇰🇷' },
    { ticker: 'INDA', label: 'India', flag: '🇮🇳' },
  ],
};

interface MarketItem {
  ticker: string;
  label: string;
  flag: string;
  price: number;
  changePct: number;
}

export default function GlobalMarkets({ onSelect }: { onSelect: (sym: string, name: string) => void }) {
  const [region, setRegion] = useState<Region>('US');
  const [data, setData] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const cache = useRef<Partial<Record<Region, MarketItem[]>>>({});

  useEffect(() => {
    if (cache.current[region]) { setData(cache.current[region]!); setLoading(false); return; }
    setLoading(true);
    Promise.allSettled(
      MARKETS[region].map(async (m) => {
        try {
          const q = await getQuote(m.ticker);
          return { ...m, price: q.price, changePct: q.changePct * 100 };
        } catch {
          return { ...m, price: 0, changePct: 0 };
        }
      })
    ).then((results) => {
      const items = results.map((r, i) =>
        r.status === 'fulfilled' ? r.value : { ...MARKETS[region][i], price: 0, changePct: 0 }
      );
      cache.current[region] = items;
      setData(items);
      setLoading(false);
    });
  }, [region]);

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
      {/* Region tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {(['US', 'Europe', 'Asia'] as Region[]).map((r) => (
          <button
            key={r}
            onClick={() => setRegion(r)}
            style={{
              flex: 1, padding: '10px 4px', background: 'none', border: 'none',
              borderBottom: region === r ? '2px solid var(--accent)' : '2px solid transparent',
              color: region === r ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {r === 'US' ? '🇺🇸 US' : r === 'Europe' ? '🇪🇺 Europe' : '🌏 Asia'}
          </button>
        ))}
      </div>

      {/* Market rows */}
      <div>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '44px', margin: '6px 12px', borderRadius: '8px' }} />
          ))
        ) : (
          data.map((item) => {
            const pos = item.changePct >= 0;
            return (
              <button
                key={item.ticker}
                onClick={() => onSelect(item.ticker, item.label)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  padding: '10px 14px', gap: '10px',
                  background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.03)',
                  cursor: 'pointer', textAlign: 'left', WebkitTapHighlightColor: 'transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-elevated)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
              >
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.flag}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.label}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{item.ticker}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.price > 0 ? `$${item.price.toFixed(2)}` : '—'}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: pos ? '#22C55E' : '#EF4444' }}>
                    {item.price > 0 ? `${pos ? '+' : ''}${item.changePct.toFixed(2)}%` : '—'}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
