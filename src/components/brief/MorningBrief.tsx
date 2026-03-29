import type { MorningBrief as MorningBriefType } from '../../types';
import NewsCard from './NewsCard';

interface MorningBriefProps {
  brief: MorningBriefType | null;
  loading: boolean;
  dailyQuestion?: string | null;
}

function BriefSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Greeting skeleton */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div className="skeleton" style={{ width: '200px', height: '14px' }} />
        <div className="skeleton" style={{ width: '100%', height: '60px' }} />
      </div>

      {/* News skeletons */}
      {[1, 2].map((i) => (
        <div
          key={i}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div className="skeleton" style={{ width: '60px', height: '20px' }} />
          <div className="skeleton" style={{ width: '100%', height: '16px' }} />
          <div className="skeleton" style={{ width: '85%', height: '16px' }} />
          <div className="skeleton" style={{ width: '100%', height: '56px' }} />
        </div>
      ))}
    </div>
  );
}

export default function MorningBrief({ brief, loading, dailyQuestion }: MorningBriefProps) {
  if (loading) return <BriefSkeleton />;

  if (!brief) {
    return (
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: '2.5rem' }}>🌅</span>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          No brief available
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Make a trade first and your morning brief will be
          <br />
          personalized to your portfolio.
        </p>
      </div>
    );
  }

  // Parse news events which may have extended fields from the AI response
  const newsEvents = brief.newsEvents || [];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
    >
      {/* Portfolio summary card */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-elevated) 100%)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: '120px',
            height: '120px',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <span style={{ fontSize: '1.5rem' }}>🌅</span>
          <div>
            <p
              style={{
                fontSize: '0.7rem',
                color: 'var(--accent)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '1px',
              }}
            >
              Morning Brief · {brief.date}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, margin: 0 }}>
              Good morning! Here's what moved overnight.
            </p>
          </div>
        </div>

        {brief.portfolioSummary && (
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            {brief.portfolioSummary}
          </p>
        )}

        {/* Suggested actions */}
        {brief.suggestedActions?.length > 0 && (
          <div style={{ marginTop: '14px' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '8px' }}>
              Watch today
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {brief.suggestedActions.map((action, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                >
                  <span style={{ color: 'var(--accent)', flexShrink: 0, fontSize: '0.8rem', marginTop: '2px' }}>→</span>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    {action}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* News section header */}
      {newsEvents.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            News That Matters To You
          </h3>
          <span
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '999px',
              padding: '2px 8px',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
            }}
          >
            {newsEvents.length}
          </span>
        </div>
      )}

      {/* News cards */}
      {newsEvents.map((event, i) => (
        <div
          key={event.id || i}
          style={{
            animationDelay: `${i * 0.1}s`,
          }}
        >
          <NewsCard event={event as Parameters<typeof NewsCard>[0]['event']} />
        </div>
      ))}

      {/* Daily question (levels 1-5) */}
      {dailyQuestion && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              flexShrink: 0,
            }}
          >
            ♟
          </div>
          <div>
            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Alpha's Daily Question
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>
              "{dailyQuestion}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
