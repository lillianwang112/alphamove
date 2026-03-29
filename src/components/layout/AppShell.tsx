import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

// ─── Theme hook ───────────────────────────────
function useTheme() {
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('alphamove-theme');
    return (saved === 'light' ? 'light' : 'dark') as 'dark' | 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('alphamove-theme', theme);
  }, [theme]);

  const toggleTheme = () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark'));
  return { theme, toggleTheme };
}

// ─── Desktop detection hook ───────────────────
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= 1100
  );
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 1100);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isDesktop;
}

// ─── Desktop Sidebar ──────────────────────────
function DesktopSidebar({
  user,
  isGuest,
  onSignIn,
  theme,
  toggleTheme,
  startTour,
}: {
  user: User | null;
  isGuest?: boolean;
  onSignIn?: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  startTour: (step: number) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const navItems = [
    { path: '/', label: 'Home', icon: '⌂' },
    { path: '/trade', label: 'Trade', icon: '↗' },
    { path: '/portfolio', label: 'Portfolio', icon: '◈' },
    { path: '/mentor', label: 'Mentor', icon: '♟' },
    { path: '/profile', label: 'Profile', icon: '○' },
  ];

  const level = user?.level ?? 1;
  const xp = user?.xp ?? 0;
  const xpToNext = user?.xpToNextLevel ?? 200;
  const xpPct = Math.min((xp / xpToNext) * 100, 100);

  return (
    <aside className="desktop-sidebar">
      {/* Brand */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', color: 'white', boxShadow: '0 0 12px rgba(99,102,241,0.4)',
          }}>
            ♟
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            AlphaMove
          </span>
        </div>

      </div>

      {/* Nav items */}
      <nav style={{ padding: '8px', flex: 1 }}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 12px', borderRadius: '12px', border: 'none',
                background: active ? 'var(--accent-light)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: '0.9rem', fontWeight: active ? 700 : 500,
                transition: 'all 0.15s ease', textAlign: 'left',
                borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
                marginBottom: '2px',
              }}
            >
              <span style={{ fontSize: '1rem', width: '20px', textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom: user info + controls */}
      {user && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          {/* Level info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: `${getLevelColor(level)}28`,
              border: `2px solid ${getLevelColor(level)}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', flexShrink: 0,
            }}>
              {getChessPiece(level)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.displayName || 'Investor'}
              </p>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0 }}>
                Lv.{level} · {getLevelName(level)}
              </p>
            </div>
          </div>

          {/* XP bar */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--xp-gold)', fontFamily: 'var(--font-mono)' }}>
                {xp.toLocaleString()} XP
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{Math.round(xpPct)}%</span>
            </div>
            <div style={{ height: '4px', background: 'var(--surface-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${xpPct}%`, background: 'linear-gradient(90deg, var(--xp-gold), #FBBF24)', borderRadius: '2px', transition: 'width 0.5s ease' }} />
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                flex: 1, padding: '8px', borderRadius: '10px',
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            >
              {theme === 'dark' ? '☀' : '◑'} {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button
              onClick={() => startTour(0)}
              title="Replay app tour"
              style={{
                padding: '8px 12px', borderRadius: '10px',
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
              }}
            >
              ?
            </button>
          </div>

          {/* Guest sign-in */}
          {isGuest && onSignIn && (
            <button
              onClick={onSignIn}
              style={{
                width: '100%', marginTop: '8px', padding: '8px', borderRadius: '10px',
                background: 'var(--accent)', border: 'none', color: 'white',
                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
              }}
            >
              Sign in to save progress
            </button>
          )}
        </div>
      )}
    </aside>
  );
}

export default function AppShell({ children, user, isGuest, onSignIn }: AppShellPropsExtended) {
  const { startTour, maybeStartTour, hasSeenTour } = useGuidance();
  const { theme, toggleTheme } = useTheme();
  const isDesktop = useIsDesktop();
  const level = user?.level ?? 1;
  const xp = user?.xp ?? 0;
  const xpToNext = user?.xpToNextLevel ?? 200;
  const xpPct = Math.min((xp / xpToNext) * 100, 100);

  useEffect(() => {
    if (!user || hasSeenTour) return;
    maybeStartTour();
  }, [hasSeenTour, maybeStartTour, user]);

  if (isDesktop) {
    return (
      <div className="app-container" style={{ maxWidth: 'var(--app-max-width)', display: 'flex', flexDirection: 'row', alignItems: 'stretch' }}>
        <DesktopSidebar
          user={user}
          isGuest={isGuest}
          onSignIn={onSignIn}
          theme={theme}
          toggleTheme={toggleTheme}
          startTour={startTour}
        />

        <div className="desktop-main">
          {/* Desktop header (sticky, not fixed) */}
          <header style={{
            position: 'sticky',
            top: 0,
            width: '100%',
            height: 'var(--header-height)',
            background: 'var(--header-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            zIndex: 50,
          }}>
            <h1 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>
              {user ? getLevelName(level) : 'AlphaMove'}
            </h1>

            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--xp-gold)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                    {xp.toLocaleString()} XP
                  </span>
                  <div style={{ width: '80px', height: '4px', background: 'var(--surface-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${xpPct}%`, background: 'linear-gradient(90deg, var(--xp-gold), #FBBF24)', borderRadius: '2px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lv.{level}</span>
              </div>
            )}
          </header>

          {/* Desktop main content */}
          <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 0 24px', WebkitOverflowScrolling: 'touch' }}>
            {children}
          </main>
        </div>

        <GuidedTour />
        <FloatingAlpha user={user} />
      </div>
    );
  }

  // ─── Mobile layout (unchanged) ──────────────
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
          background: 'var(--header-bg)',
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

        {/* Right: theme + mode toggle + help + level */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
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
                fontSize: '0.9rem',
              }}
            >
              {theme === 'dark' ? '☀' : '◑'}
            </button>

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
