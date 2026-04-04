import { useState, useEffect } from 'react';
import { getQuote } from '../../services/marketService';

const SECTORS = [
  { ticker: 'XLK', label: 'Tech' },
  { ticker: 'XLF', label: 'Finance' },
  { ticker: 'XLE', label: 'Energy' },
  { ticker: 'XLV', label: 'Health' },
  { ticker: 'XLY', label: 'Cons. Disc.' },
  { ticker: 'XLI', label: 'Industl.' },
  { ticker: 'XLC', label: 'Comm.' },
  { ticker: 'XLP', label: 'Staples' },
  { ticker: 'XLU', label: 'Utilities' },
  { ticker: 'XLRE', label: 'Real Est.' },
  { ticker: 'XLB', label: 'Materials' },
];

interface SectorData {
  ticker: string;
  label: string;
  changePct: number;
}

function getHeatColor(pct: number): string {
  const abs = Math.min(Math.abs(pct), 4);
  const intensity = abs / 4;
  if (pct > 0) {
    const g = Math.round(100 + intensity * 97);
    return `rgba(34, ${g}, 94, ${0.15 + intensity * 0.45})`;
  } else {
    const r = Math.round(180 + intensity * 59);
    return `rgba(${r}, 68, 68, ${0.15 + intensity * 0.45})`;
  }
}

export default function SectorHeatmap({ onSelect }: { onSelect: (symbol: string, name: string) => void }) {
  const [data, setData] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const results = await Promise.allSettled(
        SECTORS.map(async (s) => {
          const q = await getQuote(s.ticker);
          return { ticker: s.ticker, label: s.label, changePct: q.changePct * 100 };
        })
      );
      const settled = results
        .map((r, i) => r.status === 'fulfilled' ? r.value : { ...SECTORS[i], changePct: 0 })
        .filter(Boolean) as SectorData[];
      setData(settled);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '14px 16px' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>S&P 500 Sectors</div>
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '52px', borderRadius: '8px' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
          {data.map((s) => {
            const pos = s.changePct >= 0;
            return (
              <button
                key={s.ticker}
                onClick={() => onSelect(s.ticker, s.label + ' ETF')}
                style={{
                  background: getHeatColor(s.changePct),
                  border: `1px solid ${pos ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  borderRadius: '8px',
                  padding: '8px 6px',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '3px',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.75'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              >
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{s.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 800, color: pos ? '#22C55E' : '#EF4444' }}>
                  {pos ? '+' : ''}{s.changePct.toFixed(2)}%
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
