import { useState, useEffect } from 'react';
import { getQuote } from '../../services/marketService';

const FIXED_INCOME = [
  { ticker: 'TLT', label: '20+ Yr Treasury', desc: 'Long duration' },
  { ticker: 'IEF', label: '7-10 Yr Treasury', desc: 'Intermediate' },
  { ticker: 'SHY', label: '1-3 Yr Treasury', desc: 'Short duration' },
  { ticker: 'BND', label: 'Total Bond Mkt', desc: 'Broad market' },
  { ticker: 'HYG', label: 'High Yield Corp', desc: 'Junk bonds' },
  { ticker: 'LQD', label: 'Invest. Grade Corp', desc: 'IG bonds' },
  { ticker: 'TIPS', label: 'Inflation Protected', desc: 'TIPS' },
  { ticker: 'MUB', label: 'Municipal Bonds', desc: 'Tax-exempt' },
];

interface BondItem {
  ticker: string;
  label: string;
  desc: string;
  price: number;
  changePct: number;
  change: number;
}

export default function FixedIncomePanel({ onSelect }: { onSelect: (sym: string, name: string) => void }) {
  const [data, setData] = useState<BondItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled(
      FIXED_INCOME.map(async (b) => {
        try {
          const q = await getQuote(b.ticker);
          return { ...b, price: q.price, changePct: q.changePct * 100, change: q.change };
        } catch {
          return { ...b, price: 0, changePct: 0, change: 0 };
        }
      })
    ).then((results) => {
      setData(results.map((r, i) =>
        r.status === 'fulfilled' ? r.value : { ...FIXED_INCOME[i], price: 0, changePct: 0, change: 0 }
      ));
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--border)' }}>
        <div className="section-label" style={{ marginBottom: 0 }}>Fixed Income</div>
      </div>
      <div>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '48px', margin: '6px 12px', borderRadius: '8px' }} />
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
                  background: 'none', border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  cursor: 'pointer', textAlign: 'left', WebkitTapHighlightColor: 'transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-elevated)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                  background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.62rem', fontWeight: 800, color: '#F59E0B', fontFamily: 'var(--font-mono)',
                }}>{item.ticker.slice(0, 3)}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.price > 0 ? `$${item.price.toFixed(2)}` : '—'}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: pos ? '#22C55E' : '#EF4444' }}>
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
