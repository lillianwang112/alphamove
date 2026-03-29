import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePortfolio } from '../hooks/usePortfolio';
import { useNewsBrief } from '../hooks/useNewsBrief';
import { useTrade } from '../hooks/useTrade';
import { useGuidance } from '../context/GuidanceContext';
import MorningBrief from '../components/brief/MorningBrief';
import PortfolioSummary from '../components/portfolio/PortfolioSummary';
import XPBar from '../components/leveling/XPBar';
import SkillsBar from '../components/leveling/SkillsBar';
import TourAnchor from '../components/guidance/TourAnchor';
import LearnSheet from '../components/guidance/LearnSheet';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { beginnerMode, startTour } = useGuidance();
  const { portfolio, loading: portfolioLoading } = usePortfolio(user?.uid ?? '');
  const { brief, loading: briefLoading, generateIfMissing } = useNewsBrief(
    user?.uid ?? '',
    portfolio,
    user?.level ?? 1
  );
  const { fetchRecentTrades } = useTrade();
  const requestedBriefRef = useRef(false);
  const [learnOpen, setLearnOpen] = useState(false);
  const [sparklineData, setSparklineData] = useState<number[]>([]);
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
  const isFirstTrade = (user?.totalTrades ?? 0) === 0;

  useEffect(() => {
    if (requestedBriefRef.current || portfolioLoading || briefLoading || !portfolio) return;
    requestedBriefRef.current = true;
    void generateIfMissing();
  }, [portfolioLoading, briefLoading, portfolio, generateIfMissing]);

  // Generate sparkline from trades + current portfolio value
  useEffect(() => {
    if (!user?.uid || portfolioLoading || !portfolio) return;
    fetchRecentTrades(user.uid, 20)
      .then((trades) => {
        if (trades.length === 0) {
          setSparklineData([portfolio.totalValue]);
          return;
        }
        const sorted = [...trades].sort((a, b) => {
          const tA = a.executedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
          const tB = b.executedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
          return tA - tB;
        });
        // Build cumulative portfolio value history from starting capital
        let runningValue = user.startingCapital;
        const points: number[] = [runningValue];
        for (const trade of sorted) {
          if (trade.action === 'buy') runningValue -= trade.totalValue;
          else runningValue += trade.totalValue;
          // Add a slight drift to make the chart look natural
          points.push(Math.max(0, runningValue + (portfolio.totalValue - runningValue) * 0.3));
        }
        // End at current total value
        points.push(portfolio.totalValue);
        setSparklineData(points);
      })
      .catch(() => {});
  }, [user?.uid, user?.startingCapital, portfolioLoading, portfolio, fetchRecentTrades]);

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Greeting */}
      <div style={{ animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
          {greeting},
        </p>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0' }}>
          {firstName}
        </h1>
        {beginnerMode && (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '34ch' }}>
            Start with one clear move: learn a concept, ask Alpha a question, or try a small practice trade.
          </p>
        )}
      </div>

      {/* ── Decision Feed: Position Signals ── */}
      {!portfolioLoading && portfolio && portfolio.positions.length > 0 && (() => {
        const sorted = [...portfolio.positions].sort((a, b) => Math.abs(b.totalReturnPct) - Math.abs(a.totalReturnPct));
        const topMover = sorted[0];
        const atRisk = portfolio.positions.filter((p) => p.totalReturnPct < -0.05);
        const bigWinner = portfolio.positions.find((p) => p.totalReturnPct > 0.1);
        const concentrationPct = topMover ? (topMover.marketValue / portfolio.totalValue) * 100 : 0;
        const signals: { icon: string; label: string; value: string; color: string; sub?: string }[] = [];

        if (atRisk.length > 0) {
          signals.push({
            icon: '⚠',
            label: atRisk.length === 1 ? `${atRisk[0].ticker} down` : `${atRisk.length} positions at risk`,
            value: atRisk.length === 1 ? `${(atRisk[0].totalReturnPct * 100).toFixed(1)}%` : `worst: ${(atRisk[0].totalReturnPct * 100).toFixed(1)}%`,
            color: 'var(--danger)',
            sub: 'Review your thesis',
          });
        }
        if (bigWinner) {
          signals.push({
            icon: '↗',
            label: `${bigWinner.ticker} running`,
            value: `+${(bigWinner.totalReturnPct * 100).toFixed(1)}%`,
            color: 'var(--success)',
            sub: 'Consider your exit plan',
          });
        }
        if (concentrationPct > 45) {
          signals.push({
            icon: '◈',
            label: 'Concentration risk',
            value: `${topMover.ticker} = ${concentrationPct.toFixed(0)}% of portfolio`,
            color: '#F59E0B',
            sub: 'High concentration, consider sizing down',
          });
        }

        if (signals.length === 0) return null;

        return (
          <div style={{ animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both', animationDelay: '0.01s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444', display: 'inline-block', boxShadow: '0 0 6px #EF4444' }} />
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Signals</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {signals.map((sig, i) => (
                <div key={i} style={{ background: 'var(--surface)', border: `1px solid ${sig.color}25`, borderLeft: `3px solid ${sig.color}`, borderRadius: 'var(--radius-md)', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: sig.color, fontSize: '0.9rem', flexShrink: 0 }}>{sig.icon}</span>
                    <div>
                      <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{sig.label}</p>
                      {sig.sub && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, marginTop: '1px' }}>{sig.sub}</p>}
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: sig.color, flexShrink: 0 }}>{sig.value}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <TourAnchor id="home-start">
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.14) 0%, rgba(20, 21, 34, 0.96) 62%)',
            border: '1px solid rgba(99, 102, 241, 0.28)',
            borderRadius: 'var(--radius-xl)',
            padding: '18px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
            animationDelay: '0.02s',
          }}
        >
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
              Start here
            </p>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              {isFirstTrade ? 'Your first job is not to predict the market.' : 'Keep building judgment one move at a time.'}
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {isFirstTrade
                ? 'Pick one idea, understand why it moves, then let Alpha pressure-test your reasoning.'
                : 'Use the brief for context, the trade tab for rehearsal, and Alpha when you want a cleaner explanation.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => navigate(isFirstTrade ? '/trade?ticker=AAPL' : '/trade')}
              className="btn btn-primary btn-full"
              style={{ padding: '14px 16px', fontSize: '0.95rem', fontWeight: 700 }}
            >
              {isFirstTrade ? '♟ Make my first practice move' : '♟ Open trade'}
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={() => setLearnOpen(true)}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '12px 14px', fontSize: '0.86rem' }}
              >
                Learn a concept
              </button>
              <button
                onClick={() => navigate('/mentor', {
                  state: {
                    suggestedPrompt: isFirstTrade
                      ? 'I am brand new. Help me choose a simple first practice move and explain why.'
                      : 'Help me decide what deserves my attention today.',
                  },
                })}
                className="btn btn-ghost"
                style={{ width: '100%', padding: '12px 14px', fontSize: '0.86rem' }}
              >
                Ask Alpha first
              </button>
            </div>
            <button
              onClick={() => startTour(0)}
              className="btn btn-ghost btn-full"
              style={{ padding: '10px 14px', fontSize: '0.82rem', color: 'var(--text-muted)' }}
            >
              Take the guided tour ↗
            </button>
          </div>

          {beginnerMode && (
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '12px',
              }}
            >
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Why this home screen matters
              </p>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                Think of this screen as your pre-game board: XP shows skill growth, portfolio shows your position, and the brief tells you what changed before you make another move.
              </p>
            </div>
          )}
        </div>
      </TourAnchor>

      {/* Streak + XP */}
      {user && (
        <TourAnchor id="home-xp">
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
        </TourAnchor>
      )}

      {/* Skills tracks */}
      {user && user.xp > 0 && (
        <div style={{ animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both', animationDelay: '0.08s' }}>
          <SkillsBar totalXP={user.xp} skillXP={user.skillXP} compact={false} />
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

      {/* Suggested Moves */}
      {!portfolioLoading && portfolio && (() => {
        const suggestions: { icon: string; label: string; sub: string; ticker?: string; action?: string; color: string }[] = [];

        if (portfolio.positions.length === 0) {
          suggestions.push({
            icon: '♟',
            label: 'Ready for your first move?',
            sub: 'Tap to start with a stock you know',
            ticker: 'AAPL',
            color: 'var(--accent)',
          });
        } else {
          // Take profit on a big winner
          const bigWinner = [...portfolio.positions].find((p) => p.totalReturnPct > 0.1);
          if (bigWinner) {
            suggestions.push({
              icon: '↗',
              label: `Take profit on ${bigWinner.ticker}?`,
              sub: `Up ${(bigWinner.totalReturnPct * 100).toFixed(1)}% — consider your exit`,
              ticker: bigWinner.ticker,
              action: 'sell',
              color: 'var(--success)',
            });
          }
          // Diversify from concentration
          const topPos = [...portfolio.positions].sort((a, b) => b.marketValue - a.marketValue)[0];
          if (topPos && (topPos.marketValue / portfolio.totalValue) > 0.5) {
            suggestions.push({
              icon: '◈',
              label: `Diversify from ${topPos.ticker}?`,
              sub: `${((topPos.marketValue / portfolio.totalValue) * 100).toFixed(0)}% concentrated — explore another sector`,
              color: '#F59E0B',
            });
          }
          // Cash sitting idle
          const cashPct = (portfolio.totalValue - portfolio.totalInvested) / portfolio.totalValue;
          if (cashPct > 0.6 && portfolio.positions.length > 0) {
            suggestions.push({
              icon: '💡',
              label: 'Cash sitting idle',
              sub: `${(cashPct * 100).toFixed(0)}% uninvested — consider your next move`,
              color: 'var(--accent)',
            });
          }
        }

        if (suggestions.length === 0) return null;

        return (
          <div style={{ animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both', animationDelay: '0.12s' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              Suggested Moves
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (s.ticker && s.action) {
                      navigate(`/trade?ticker=${s.ticker}&action=${s.action}`);
                    } else if (s.ticker) {
                      navigate(`/trade?ticker=${s.ticker}`);
                    } else {
                      navigate('/trade');
                    }
                  }}
                  style={{
                    background: 'var(--surface)',
                    border: `1px solid ${s.color}30`,
                    borderLeft: `3px solid ${s.color}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'transform 0.15s ease, background 0.15s ease',
                  }}
                  onTouchStart={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                  onTouchEnd={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1rem', color: s.color, flexShrink: 0 }}>{s.icon}</span>
                    <div>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{s.label}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>{s.sub}</p>
                    </div>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', flexShrink: 0 }}>→</span>
                </button>
              ))}
            </div>
          </div>
        );
      })()}

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
          {beginnerMode && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
              This is your current position: what you own, what cash is still free, and how your practice account is changing.
            </p>
          )}
          <PortfolioSummary portfolio={portfolio} sparklineData={sparklineData} />
        </div>
      )}

      {portfolioLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="skeleton" style={{ height: '14px', width: '80px' }} />
          <div className="skeleton" style={{ height: '140px', borderRadius: '16px' }} />
        </div>
      )}

      {/* Morning brief */}
      <TourAnchor id="home-brief">
        <div style={{ animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both', animationDelay: '0.2s' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
          Morning Brief
        </h3>
        {beginnerMode && (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '12px 14px',
              marginBottom: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
              Read this before you trade. It helps you separate market noise from the headlines that actually affect your next move.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/mentor', {
                  state: {
                    suggestedPrompt: brief
                      ? `Explain today's morning brief in plain English and tell me what matters most first. Summary: ${brief.portfolioSummary}`
                      : 'Explain what a morning brief is and how I should use it as a beginner.',
                  },
                })}
                className="btn btn-secondary"
                style={{ padding: '10px 12px', fontSize: '0.82rem' }}
              >
                Explain this with Alpha
              </button>
              <button
                onClick={() => setLearnOpen(true)}
                className="btn btn-ghost"
                style={{ padding: '10px 12px', fontSize: '0.82rem' }}
              >
                Why this matters
              </button>
            </div>
          </div>
        )}
        <MorningBrief
          brief={brief}
          loading={briefLoading}
          dailyQuestion={dailyQuestion}
        />
        </div>
      </TourAnchor>

      <LearnSheet
        open={learnOpen}
        onClose={() => setLearnOpen(false)}
        onAskAlpha={(topic) => {
          setLearnOpen(false);
          navigate('/mentor', {
            state: {
              suggestedPrompt: `Teach me ${topic} in plain English and connect it to a beginner's first investing move.`,
            },
          });
        }}
      />
    </div>
  );
}
