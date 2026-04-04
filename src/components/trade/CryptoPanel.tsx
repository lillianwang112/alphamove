import { useState, useEffect } from 'react';
import { getCryptoQuote } from '../../services/cryptoService';

const TOP_CRYPTOS = [
  { id: 'BTC', label: 'Bitcoin', emoji: '₿' },
  { id: 'ETH', label: 'Ethereum', emoji: 'Ξ' },
  { id: 'SOL', label: 'Solana', emoji: '◎' },
  { id: 'BNB', label: 'BNB', emoji: '⬡' },
  { id: 'XRP', label: 'XRP', emoji: '✕' },
  { id: 'ADA', label: 'Cardano', emoji: '₳' },
  { id: 'DOGE', label: 'Dogecoin', emoji: 'Ð' },
  { id: 'AVAX', label: 'Avalanche', emoji: '🔺' },
];

interface CryptoItem {
  id: string;
  label: string;
  emoji: string;
  price: number;
  changePct: number;
}

export default function CryptoPanel({ onSelect }: { onSelect: (sym: string, name: string) => void }) {
  const [data, setData] = useState<CryptoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled(
      TOP_CRYPTOS.map(async (c) => {
        try {
          const q = await getCryptoQuote(c.id);
          return { ...c, price: q.price, changePct: q.changePct24h * 100 };
        } catch {
          return { ...c, price: 0, changePct: 0 };
        }
      })
    ).then((results) => {
      setData(results.map((r, i) =>
        r.status === 'fulfilled' ? r.value : { ...TOP_CRYPTOS[i], price: 0, changePct: 0 }
      ));
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--border)' }}>
        <div className="section-label" style={{ marginBottom: 0 }}>Popular Crypto</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border)' }}>
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '60px', margin: '6px', borderRadius: '8px' }} />
          ))
        ) : (
          data.map((item) => {
            const pos = item.changePct >= 0;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id, item.label)}
                style={{
                  background: 'var(--surface)', border: 'none', padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  cursor: 'pointer', textAlign: 'left', WebkitTapHighlightColor: 'transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-elevated)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; }}
              >
                <span style={{
                  width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                  background: pos ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', fontWeight: 700,
                  color: pos ? '#22C55E' : '#EF4444',
                }}>{item.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.id}</div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700,
                    color: pos ? '#22C55E' : '#EF4444',
                  }}>
                    {item.price > 0 ? `${pos ? '+' : ''}${item.changePct.toFixed(2)}%` : '—'}
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'right' }}>
                  {item.price >= 1000 ? `$${(item.price/1000).toFixed(1)}k` : item.price >= 1 ? `$${item.price.toFixed(2)}` : item.price > 0 ? `$${item.price.toFixed(4)}` : '—'}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
