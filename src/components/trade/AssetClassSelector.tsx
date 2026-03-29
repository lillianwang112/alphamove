import type { AssetClass } from '../../types';

interface Props {
  value: AssetClass;
  onChange: (cls: AssetClass) => void;
  userLevel: number;
}

const CLASSES: { id: AssetClass; label: string; emoji: string; minLevel: number; desc: string }[] = [
  { id: 'stock',  label: 'Stocks',  emoji: '📈', minLevel: 1, desc: 'Individual company shares' },
  { id: 'etf',    label: 'ETFs',    emoji: '🗂️', minLevel: 1, desc: 'Baskets of assets' },
  { id: 'crypto', label: 'Crypto',  emoji: '₿',  minLevel: 1, desc: 'Digital currencies' },
  { id: 'option', label: 'Options', emoji: '⚡', minLevel: 5, desc: 'Contracts on stocks · Level 5+' },
];

export default function AssetClassSelector({ value, onChange, userLevel }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
        {CLASSES.map((cls) => {
          const locked = userLevel < cls.minLevel;
          const isSelected = value === cls.id;
          return (
            <button
              key={cls.id}
              onClick={() => !locked && onChange(cls.id)}
              disabled={locked}
              title={locked ? `Unlocks at Level ${cls.minLevel}` : cls.desc}
              style={{
                padding: '10px 6px',
                background: isSelected
                  ? 'rgba(99,102,241,0.18)'
                  : locked
                  ? 'rgba(255,255,255,0.02)'
                  : 'var(--surface)',
                border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                cursor: locked ? 'not-allowed' : 'pointer',
                opacity: locked ? 0.45 : 1,
                transition: 'all 0.15s ease',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{locked ? '🔒' : cls.emoji}</span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                  letterSpacing: '0.02em',
                }}
              >
                {cls.label}
              </span>
            </button>
          );
        })}
      </div>
      {value === 'option' && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Options give you the right (not obligation) to buy or sell 100 shares at a set price. They're leveraged — small moves in the stock = large % moves in the option.
        </p>
      )}
      {value === 'crypto' && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Crypto trades 24/7, unlike stocks. Higher volatility means bigger potential gains and losses. Prices via CoinGecko.
        </p>
      )}
    </div>
  );
}
