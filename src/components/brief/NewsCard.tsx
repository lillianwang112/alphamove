import type { NewsEvent } from '../../types';

interface NewsCardProps {
  event: NewsEvent & { whyItMatters?: string; actionToConsider?: string };
}

function timeAgo(timestamp: { toDate?: () => Date; seconds?: number } | Date | string | null | undefined): string {
  try {
    let date: Date;
    if (!timestamp) return '';
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'object' && 'toDate' in timestamp && typeof (timestamp as { toDate?: unknown }).toDate === 'function') {
      date = (timestamp as { toDate: () => Date }).toDate();
    } else if (typeof timestamp === 'object' && 'seconds' in timestamp) {
      date = new Date((timestamp as { seconds: number }).seconds * 1000);
    } else {
      return '';
    }
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return '';
  }
}

export default function NewsCard({ event }: NewsCardProps) {
  const timeStr = timeAgo(event.publishedAt as Parameters<typeof timeAgo>[0]);

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        animation: 'fadeIn 0.3s ease both',
      }}
    >
      {/* Tickers */}
      {event.relatedTickers?.length > 0 && (
        <div
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            background: 'var(--surface-elevated)',
          }}
        >
          {event.relatedTickers.slice(0, 4).map((ticker) => (
            <span
              key={ticker}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--accent)',
                background: 'var(--accent-light)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                letterSpacing: '0.02em',
              }}
            >
              {ticker}
            </span>
          ))}
        </div>
      )}

      <div style={{ padding: '16px' }}>
        {/* Headline */}
        <h4
          style={{
            fontSize: '0.9rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.4,
            marginBottom: '10px',
          }}
        >
          {event.headline}
        </h4>

        {/* Why it matters */}
        {(event.whyItMatters || event.mentorAnalysis) && (
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.06)',
              border: '1px solid rgba(99, 102, 241, 0.15)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              marginBottom: '10px',
            }}
          >
            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>
              Why it matters
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
              {event.whyItMatters || event.mentorAnalysis}
            </p>
          </div>
        )}

        {/* Impact on portfolio */}
        {event.impactOnPortfolio && (
          <div
            style={{
              background: 'rgba(34, 197, 94, 0.06)',
              border: '1px solid rgba(34, 197, 94, 0.15)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              marginBottom: '10px',
            }}
          >
            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>
              Your portfolio
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
              {event.impactOnPortfolio}
            </p>
          </div>
        )}

        {/* Action to consider */}
        {event.actionToConsider && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start',
              marginBottom: '10px',
            }}
          >
            <span style={{ color: 'var(--xp-gold)', flexShrink: 0, fontSize: '0.9rem' }}>→</span>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {event.actionToConsider}
            </p>
          </div>
        )}

        {/* Footer: source + time */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '8px',
          }}
        >
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {event.source}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path d="M18 13V19C18 19.5523 17.5523 20 17 20H5C4.44772 20 4 19.5523 4 19V7C4 6.44772 4.44772 6 5 6H11M15 3H21M21 3V9M21 3L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          {timeStr && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {timeStr}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
