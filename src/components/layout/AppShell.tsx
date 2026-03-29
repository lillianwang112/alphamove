import { useEffect, type ReactNode } from 'react';
import BottomNav from './BottomNav';
import type { User } from '../../types';
import { useGuidance } from '../../context/GuidanceContext';
import GuidedTour from '../guidance/GuidedTour';
import FloatingAlpha from '../mentor/FloatingAlpha';
import { getChessPiece, getLevelColor as getColor } from '../leveling/LevelBadge';

interface AppShellProps {
  children: ReactNode;
  user: User | null;
}

function getLevelName(level: number): string {
  const names: Record<number, string> = {
    1: 'Paper Rookie', 2: 'Market Observer', 3: 'Thesis Builder',
    4: 'Risk Aware', 5: 'Pattern Spotter', 6: 'Independent Thinker',
    7: 'Portfolio Strategist', 8: 'Market Analyst', 9: 'Alpha Seeker', 10: 'Graduated',
  };
  return names[level] || 'Paper Rookie';
}

function getLevelColor(level: number): string {
  return getColor(level);
}

interface AppShellPropsExtended extends AppShellProps {
  isGuest?: boolean;
  onSignIn?: () => void;
}

export default function AppShell({ children, user, isGuest, onSignIn }: AppShellPropsExtended) {
  const { startTour, maybeStartTour, hasSeenTour, tradeMode, setTradeMode } = useGuidance();
  const level = user?.level ?? 1;
  const xp = user?.xp ?? 0;
  const xpToNext = user?.xpToNextLevel ?? 200;
  const xpPct = Math.min((xp / xpToNext) * 100, 100);

  useEffect(() => {
    if (!user || hasSeenTour) return;
    maybeStartTour();
  }, [hasSeenTour, maybeStartTour, user]);

  return (
    <div className="app-container">
      {/* Header */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 'var(--app-max-width)',
          height: 'var(--header-height)',
          background: 'rgba(10, 10, 15, 0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 99,
        }}
      >
        {/* Logo / Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 700,
              color: 'white',
              boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)',
            }}
          >
            ♟
          </div>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              fontSize: '1.125rem',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            AlphaMove
          </span>
        </div>

        {/* Right: Help + Level + XP */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Trade mode toggle */}
            <div
              onClick={() => setTradeMode(tradeMode === 'learning' ? 'simulation' : 'learning')}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '999px',
                padding: '2px',
                cursor: 'pointer',
                gap: '0',
                userSelect: 'none',
              }}
              title={tradeMode === 'learning' ? 'Switch to Simulation mode' : 'Switch to Learning mode'}
            >
              {(['learning', 'simulation'] as const).map((mode) => (
                <span
                  key={mode}
                  style={{
                    padding: '4px 9px',
                    borderRadius: '999px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    background: tradeMode === mode ? 'var(--accent)' : 'transparent',
                    color: tradeMode === mode ? 'white' : 'var(--text-muted)',
                    transition: 'all 0.2s ease',
                    textTransform: 'capitalize',
                  }}
                >
                  {mode === 'learning' ? 'Learn' : 'Sim'}
                </span>
              ))}
            </div>

            <button
              onClick={() => startTour(0)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
              aria-label="Replay app tour"
              title="Replay app tour"
            >
              ?
            </button>

            {/* XP mini bar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--xp-gold)',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {xp.toLocaleString()} XP
                </span>
              </div>
              <div
                style={{
                  width: '60px',
                  height: '3px',
                  background: 'var(--surface-elevated)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${xpPct}%`,
                    background: 'linear-gradient(90deg, var(--xp-gold), #FBBF24)',
                    borderRadius: '2px',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>

            {/* Level badge — chess piece */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: `${getLevelColor(level)}28`,
                border: `2px solid ${getLevelColor(level)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                color: 'white',
                WebkitTextStroke: '0.4px rgba(255,255,255,0.6)',
                flexShrink: 0,
                boxShadow: `0 0 8px ${getLevelColor(level)}40`,
              }}
              title={`${getLevelName(level)} (Level ${level})`}
            >
              {getChessPiece(level)}
            </div>
          </div>
        )}
      </header>

      {/* Guest banner */}
      {isGuest && onSignIn && (
        <div style={{
          position: 'fixed',
          top: 'var(--header-height)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 'var(--app-max-width)',
          background: 'rgba(99,102,241,0.12)',
          borderBottom: '1px solid rgba(99,102,241,0.25)',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          zIndex: 98,
        }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
            Guest mode · progress saved locally
          </p>
          <button
            onClick={onSignIn}
            style={{ background: 'var(--accent)', border: 'none', borderRadius: '999px', color: 'white', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', padding: '5px 12px', flexShrink: 0 }}
          >
            Sign in to save
          </button>
        </div>
      )}

      {/* Main scrollable content */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingTop: isGuest ? 'calc(var(--header-height) + 37px)' : 'var(--header-height)',
          paddingBottom: 'var(--bottom-nav-height)',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </main>

      {/* Bottom navigation */}
      <BottomNav />
      <GuidedTour />
      <FloatingAlpha user={user} />
    </div>
  );
}
