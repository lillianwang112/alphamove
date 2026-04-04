import { useState, useEffect } from 'react';
import { getMarketMovers, type MarketMover } from '../../services/marketService';

type MoversTab = 'gainers' | 'losers' | 'actives';

export default function MarketMovers({ onSelect }: { onSelect: (symbol: string, name: string) => void }) {
  const [tab, setTab] = useState<MoversTab>('gainers');
  const [data, setData] = useState<MarketMover[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMarketMovers(tab)
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
      {/* Tab header */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {([
          { id: 'gainers', label: '▲ Gainers', color: '#22C55E' },
          { id: 'losers', label: '▼ Losers', color: '#EF4444' },
          { id: 'actives', label: '⚡ Active', color: '#6366F1' },
        ] as const).map(({ id, label, color }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1, padding: '10px 4px',
              background: 'none', border: 'none',
              borderBottom: tab === id ? `2px solid ${color}` : '2px solid transparent',
              color: tab === id ? color : 'var(--text-muted)',
              fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >{label}</button>
        ))}
      </div>

      {/* Rows */}
      <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '44px', margin: '6px 12px', borderRadius: '8px' }} />
          ))
        ) : data.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Data unavailable
          </div>
        ) : (
          data.map((mover) => {
            const pos = mover.changesPercentage >= 0;
            return (
              <button
                key={mover.symbol}
                onClick={() => onSelect(mover.symbol, mover.name)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  padding: '10px 14px', gap: '10px',
                  background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.03)',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.15s',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-elevated)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
              >
                <span style={{
                  minWidth: '44px', padding: '3px 6px',
                  background: pos ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  color: pos ? '#22C55E' : '#EF4444',
                  borderRadius: '5px', fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem', fontWeight: 800, textAlign: 'center',
                }}>{mover.symbol}</span>

                <span style={{
                  flex: 1, fontSize: '0.78rem', color: 'var(--text-secondary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{mover.name}</span>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    ${mover.price.toFixed(2)}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: pos ? '#22C55E' : '#EF4444' }}>
                    {pos ? '+' : ''}{mover.changesPercentage.toFixed(2)}%
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
