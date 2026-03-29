import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePortfolio } from '../hooks/usePortfolio';
import { useNewsBrief } from '../hooks/useNewsBrief';
import MorningBrief from '../components/brief/MorningBrief';
import PortfolioSummary from '../components/portfolio/PortfolioSummary';
import XPBar from '../components/leveling/XPBar';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { portfolio, loading: portfolioLoading } = usePortfolio(user?.uid ?? '');
  const { brief, loading: briefLoading, generateIfMissing } = useNewsBrief(
    user?.uid ?? '',
    portfolio,
    user?.level ?? 1
  );
  const requestedBriefRef = useRef(false);
  // Extract daily question from brief — available for levels 1-5
  const dailyQuestion = (user?.level ?? 1) <= 5
    ? (brief as unknown as { dailyQuestion?: string })?.dailyQuestion ?? null
    : null;

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const firstName = user?.displayName?.split(' ')[0] || 'Trader';

  useEffect(() => {
    if (requestedBriefRef.current || portfolioLoading || briefLoading || !portfolio) return;
    requestedBriefRef.current = true;
    void generateIfMissing();
  }, [portfolioLoading, briefLoading, portfolio, generateIfMissing]);

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Greeting */}
      <div style={{ animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
          {greeting},
        </p>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0' }}>
          {firstName} 👋
        </h1>
      </div>

      {/* Streak + XP */}
      {user && (
        <div
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'stretch',
            animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
            animationDelay: '0.05s',
          }}
        >
          {/* Streak badge */}
          {user.streak > 0 && (
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                minWidth: '80px',
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>🔥</span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: '#F97316',
                }}
              >
                {user.streak}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                day streak
              </span>
            </div>
          )}

          {/* XP bar */}
          <div
            style={{
              flex: 1,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '12px 14px',
            }}
          >
            <XPBar
              level={user.level}
              xp={user.xp}
              xpToNextLevel={user.xpToNextLevel}
            />
          </div>
        </div>
      )}

      {/* Quick trade CTA */}
      <button
        onClick={() => navigate('/trade')}
        className="btn btn-primary btn-full"
        style={{
          height: '54px',
          fontSize: '1rem',
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
          boxShadow: '0 0 24px rgba(99, 102, 241, 0.35)',
          animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
          animationDelay: '0.1s',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M2 20L8 14L12 18L22 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 4H22V10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Make a Move
      </button>

      {/* Portfolio summary */}
      {!portfolioLoading && portfolio && (
        <div style={{ animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both', animationDelay: '0.15s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Portfolio</h3>
            <button
              onClick={() => navigate('/portfolio')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              View all →
            </button>
          </div>
          <PortfolioSummary portfolio={portfolio} />
        </div>
      )}

      {portfolioLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="skeleton" style={{ height: '14px', width: '80px' }} />
          <div className="skeleton" style={{ height: '140px', borderRadius: '16px' }} />
        </div>
      )}

      {/* Morning brief */}
      <div style={{ animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both', animationDelay: '0.2s' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
          Morning Brief
        </h3>
        <MorningBrief
          brief={brief}
          loading={briefLoading}
          dailyQuestion={dailyQuestion}
        />
      </div>
    </div>
  );
}
