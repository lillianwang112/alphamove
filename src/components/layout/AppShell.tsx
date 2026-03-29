import { type ReactNode } from 'react';
import BottomNav from './BottomNav';
import type { User } from '../../types';

interface AppShellProps {
  children: ReactNode;
  user: User | null;
}

function getLevelName(level: number): string {
  const names: Record<number, string> = {
    1: 'Paper Rookie',
    2: 'Market Observer',
    3: 'Thesis Builder',
    4: 'Risk Aware',
    5: 'Pattern Spotter',
    6: 'Independent Thinker',
    7: 'Portfolio Strategist',
    8: 'Market Analyst',
    9: 'Alpha Seeker',
    10: 'Graduated',
  };
  return names[level] || 'Paper Rookie';
}

function getLevelColor(level: number): string {
  if (level <= 2) return '#64748B';
  if (level <= 5) return '#6366F1';
  if (level <= 8) return '#F59E0B';
  return '#26C2A3';
}

export default function AppShell({ children, user }: AppShellProps) {
  const level = user?.level ?? 1;
  const xp = user?.xp ?? 0;
  const xpToNext = user?.xpToNextLevel ?? 200;
  const xpPct = Math.min((xp / xpToNext) * 100, 100);

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

        {/* Right: Level + XP */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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

            {/* Level badge */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: `${getLevelColor(level)}22`,
                border: `2px solid ${getLevelColor(level)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: getLevelColor(level),
                flexShrink: 0,
              }}
              title={getLevelName(level)}
            >
              {level}
            </div>
          </div>
        )}
      </header>

      {/* Main scrollable content */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingTop: 'var(--header-height)',
          paddingBottom: 'var(--bottom-nav-height)',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
