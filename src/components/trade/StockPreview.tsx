interface QuoteData {
  price: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
}

interface ProfileData {
  name: string;
  ticker: string;
  logo: string;
  industry: string;
  marketCap: number;
  weburl: string;
}

interface StockPreviewProps {
  ticker: string;
  companyName: string;
  quote: QuoteData;
  profile: ProfileData | null;
  onBuy: () => void;
  onSell: () => void;
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${value.toLocaleString()}`;
}

export default function StockPreview({
  ticker,
  companyName,
  quote,
  profile,
  onBuy,
  onSell,
}: StockPreviewProps) {
  const isPositive = quote.change >= 0;
  const changePctDisplay = `${isPositive ? '+' : ''}${quote.changePct.toFixed(2)}%`;
  const changeDisplay = `${isPositive ? '+' : ''}$${quote.change.toFixed(2)}`;

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {profile?.logo ? (
            <img
              src={profile.logo}
              alt={companyName}
              style={{ width: '36px', height: '36px', objectFit: 'contain' }}
              onError={(e) => {
                const el = e.currentTarget as HTMLImageElement;
                el.style.display = 'none';
                const parent = el.parentElement;
                if (parent) {
                  parent.textContent = ticker.charAt(0);
                  parent.style.fontSize = '1.25rem';
                  parent.style.fontWeight = '700';
                  parent.style.color = 'var(--accent)';
                }
              }}
            />
          ) : (
            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--accent)',
              }}
            >
              {ticker.charAt(0)}
            </span>
          )}
        </div>

        {/* Name and ticker */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {profile?.name || companyName}
            </h3>
            <span
              style={{
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                flexShrink: 0,
              }}
            >
              {ticker}
            </span>
          </div>
          {profile?.industry && (
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginTop: '2px',
              }}
            >
              {profile.industry}
            </p>
          )}
        </div>
      </div>

      {/* Price */}
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <p
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              Current Price
            </p>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '2rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              ${quote.price.toFixed(2)}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '999px',
                background: isPositive ? 'var(--success-light)' : 'var(--danger-light)',
                color: isPositive ? 'var(--success)' : 'var(--danger)',
                fontSize: '0.875rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {isPositive ? '▲' : '▼'} {changePctDisplay}
            </span>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: isPositive ? 'var(--success)' : 'var(--danger)',
                marginTop: '4px',
                textAlign: 'right',
              }}
            >
              {changeDisplay} today
            </p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
        }}
      >
        {[
          { label: 'High', value: `$${quote.high.toFixed(2)}`, color: 'var(--success)' },
          { label: 'Low', value: `$${quote.low.toFixed(2)}`, color: 'var(--danger)' },
          { label: 'Open', value: `$${quote.open.toFixed(2)}`, color: undefined },
          { label: 'Prev Close', value: `$${quote.prevClose.toFixed(2)}`, color: undefined },
          ...(profile?.marketCap
            ? [{ label: 'Market Cap', value: formatMarketCap(profile.marketCap), color: undefined }]
            : []),
        ].map((stat) => (
          <div key={stat.label}>
            <p
              style={{
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '3px',
              }}
            >
              {stat.label}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: stat.color || 'var(--text-primary)',
              }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div
        style={{
          padding: '16px 20px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
        }}
      >
        <button
          onClick={onBuy}
          className="btn btn-success"
          style={{ fontSize: '0.95rem' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          Buy
        </button>
        <button
          onClick={onSell}
          className="btn btn-danger"
          style={{ fontSize: '0.95rem' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M5 12H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          Sell
        </button>
      </div>
    </div>
  );
}
