import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useXP } from '../hooks/useXP';
import { usePortfolio } from '../hooks/usePortfolio';
import { useGuidance } from '../context/GuidanceContext';
import XPBar from '../components/leveling/XPBar';
import LevelRoadmap from '../components/leveling/LevelRoadmap';
import TourAnchor from '../components/guidance/TourAnchor';
import { useEffect } from 'react';
import type { XPEvent } from '../types';

function getLevelColor(level: number): string {
  if (level <= 2) return '#64748B';
  if (level <= 5) return '#6366F1';
  if (level <= 8) return '#F59E0B';
  return '#26C2A3';
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { beginnerMode, setBeginnerMode, startTour } = useGuidance();
  const { getXPHistory } = useXP();
  const { portfolio, positions } = usePortfolio(user?.uid ?? '');
  const [xpHistory, setXpHistory] = useState<XPEvent[]>([]);
  const [xpLoading, setXpLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    getXPHistory(user.uid)
      .then(setXpHistory)
      .catch(console.error)
      .finally(() => setXpLoading(false));
  }, [getXPHistory, user?.uid]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      setSigningOut(false);
    }
  };

  if (!user) return null;

  const level = user.level ?? 1;
  const levelColor = getLevelColor(level);

  // Stats
  const totalReturn = portfolio?.allTimeReturn ?? 0;
  const isPositiveReturn = totalReturn >= 0;
  const returnPct = portfolio?.allTimeReturnPct ?? 0;

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Profile header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${levelColor}44, ${levelColor}22)`,
            border: `2px solid ${levelColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: levelColor,
            flexShrink: 0,
            boxShadow: `0 0 20px ${levelColor}40`,
          }}
        >
          {user.displayName?.charAt(0)?.toUpperCase() || '?'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user.displayName}
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.email}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: levelColor,
                background: `${levelColor}20`,
                padding: '2px 8px',
                borderRadius: '999px',
                border: `1px solid ${levelColor}40`,
              }}
            >
              Level {level}
            </span>
            {user.streak > 0 && (
              <span style={{ fontSize: '0.75rem', color: '#F97316' }}>
                🔥 {user.streak} day streak
              </span>
            )}
          </div>
        </div>
      </div>

      {/* XP Bar */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
          animationDelay: '0.05s',
        }}
      >
        <XPBar
          level={user.level}
          xp={user.xp}
          xpToNextLevel={user.xpToNextLevel}
        />
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
          animationDelay: '0.1s',
        }}
      >
        {[
          {
            icon: '📊',
            label: 'Total Trades',
            value: user.totalTrades?.toString() ?? '0',
            color: 'var(--accent)',
          },
          {
            icon: '⚡',
            label: 'Total XP',
            value: (user.xp ?? 0).toLocaleString(),
            color: 'var(--xp-gold)',
          },
          {
            icon: '💰',
            label: 'All-Time Return',
            value: `${isPositiveReturn ? '+' : '-'}$${Math.abs(totalReturn).toFixed(2)}`,
            color: isPositiveReturn ? 'var(--success)' : 'var(--danger)',
          },
          {
            icon: '📈',
            label: 'Return %',
            value: `${isPositiveReturn ? '+' : ''}${(returnPct * 100).toFixed(2)}%`,
            color: isPositiveReturn ? 'var(--success)' : 'var(--danger)',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>{stat.icon}</span>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, margin: 0 }}>
              {stat.label}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1rem',
                fontWeight: 700,
                color: stat.color,
                margin: 0,
              }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Portfolio holdings count */}
      {positions.length > 0 && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
            animationDelay: '0.15s',
          }}
        >
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Active Positions
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {positions.length}
          </span>
        </div>
      )}

      {/* Level roadmap toggle */}
      <div style={{ animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both', animationDelay: '0.2s' }}>
        <button
          onClick={() => setShowRoadmap(!showRoadmap)}
          style={{
            width: '100%',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            transition: 'border-color 0.2s ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.125rem' }}>🗺️</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Level Roadmap
            </span>
          </div>
          <span
            style={{
              color: 'var(--text-muted)',
              transition: 'transform 0.2s ease',
              display: 'inline-block',
              transform: showRoadmap ? 'rotate(180deg)' : 'none',
            }}
          >
            ▾
          </span>
        </button>

        {showRoadmap && (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 16px',
              marginTop: '8px',
              animation: 'slideInUp 0.3s ease both',
              maxHeight: '500px',
              overflowY: 'auto',
            }}
          >
            <LevelRoadmap currentLevel={user.level} currentXP={user.xp} />
          </div>
        )}
      </div>

      <TourAnchor id="profile-guidance">
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
            animationDelay: '0.22s',
          }}
        >
          <div>
            <p style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
              Guidance
            </p>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
              Keep the app more guided while you are learning, then replay the tour anytime you want a quick reset.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '12px 14px',
            }}
          >
            <div>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                Beginner Mode
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                More helper copy, learning cues, and safer framing
              </p>
            </div>
            <button
              onClick={() => setBeginnerMode(!beginnerMode)}
              aria-pressed={beginnerMode}
              style={{
                width: '56px',
                height: '32px',
                borderRadius: '999px',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                background: beginnerMode ? 'rgba(99, 102, 241, 0.28)' : 'var(--surface)',
                position: 'relative',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '3px',
                  left: beginnerMode ? '28px' : '3px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: beginnerMode ? 'var(--accent)' : 'var(--text-muted)',
                  transition: 'left 0.2s ease',
                }}
              />
            </button>
          </div>

          <button
            onClick={() => startTour(0)}
            className="btn btn-secondary btn-full"
            style={{ fontSize: '0.92rem' }}
          >
            Replay app tour
          </button>
        </div>
      </TourAnchor>

      {/* XP history */}
      {xpLoading && (
        <div style={{ animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both', animationDelay: '0.25s' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Recent XP
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div className="skeleton" style={{ height: '14px', flex: 1 }} />
                <div className="skeleton" style={{ height: '14px', width: '56px' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {!xpLoading && xpHistory.length > 0 && (
        <div style={{ animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both', animationDelay: '0.25s' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Recent XP
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {xpHistory.slice(0, 5).map((event) => (
              <div
                key={event.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, flex: 1, marginRight: '12px' }}>
                  {event.reason}
                </p>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: 'var(--xp-gold)',
                    flexShrink: 0,
                  }}
                >
                  +{event.amount} XP
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sign out */}
      <div style={{ animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both', animationDelay: '0.3s', paddingBottom: '8px' }}>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="btn btn-ghost btn-full"
          style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
        >
          {signingOut ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '16px', height: '16px', border: '2px solid rgba(239,68,68,0.3)', borderTopColor: 'var(--danger)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
              Signing out...
            </span>
          ) : 'Sign Out'}
        </button>
      </div>
    </div>
  );
}
