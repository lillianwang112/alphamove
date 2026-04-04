import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getWatchlist, removeFromWatchlist } from '../../services/watchlistService';
import { getQuote } from '../../services/marketService';

interface WatchItem {
  ticker: string;
  price: number;
  changePct: number;
}

export default function WatchlistPanel({ onSelect }: { onSelect: (symbol: string, name: string) => void }) {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    async function load() {
      try {
        const tickers = await getWatchlist(user!.uid);
        if (tickers.length === 0) { setLoading(false); return; }
        const quotes = await Promise.allSettled(
          tickers.map(async (t) => {
            const q = await getQuote(t);
            return { ticker: t, price: q.price, changePct: q.changePct * 100 };
          })
        );
        setItems(quotes.filter(r => r.status === 'fulfilled').map(r => (r as PromiseFulfilledResult<WatchItem>).value));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const handleRemove = async (ticker: string) => {
    if (!user) return;
    await removeFromWatchlist(user.uid, ticker);
    setItems(prev => prev.filter(i => i.ticker !== ticker));
  };

  if (!loading && items.length === 0) return null;

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Watchlist</div>
      </div>
      <div>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '40px', margin: '6px 12px', borderRadius: '8px' }} />
          ))
        ) : (
          items.map((item) => {
            const pos = item.changePct >= 0;
            return (
              <div key={item.ticker} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.03)', gap: '10px' }}>
                <button
                  onClick={() => onSelect(item.ticker, item.ticker)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', minWidth: '50px' }}>{item.ticker}</span>
                  <span style={{ flex: 1 }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>${item.price.toFixed(2)}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: pos ? '#22C55E' : '#EF4444', minWidth: '60px', textAlign: 'right' }}>
                    {pos ? '+' : ''}{item.changePct.toFixed(2)}%
                  </span>
                </button>
                <button
                  onClick={() => handleRemove(item.ticker)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', fontSize: '0.8rem', opacity: 0.5 }}
                  title="Remove from watchlist"
                >×</button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
