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
import { getPositions, removePosition, updateUserData } from '../services/portfolioService';

function getLevelColor(level: number): string {
  if (level <= 2) return '#64748B';
  if (level <= 5) return '#6366F1';
  if (level <= 8) return '#F59E0B';
  return '#26C2A3';
}

export default function ProfilePage() {
  const { user, signOut, updateUser } = useAuth();
  const { beginnerMode, setBeginnerMode, startTour } = useGuidance();
  const { getXPHistory } = useXP();
  const { portfolio, positions } = usePortfolio(user?.uid ?? '');
  const [xpHistory, setXpHistory] = useState<XPEvent[]>([]);
  const [xpLoading, setXpLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [showCapitalModal, setShowCapitalModal] = useState(false);
  const [newCapital, setNewCapital] = useState('');
  const [capitalError, setCapitalError] = useState('');
  const [resetting, setResetting] = useState(false);

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

  const handleResetPortfolio = async () => {
    if (!user) return;
    setResetting(true);
    try {
      // Remove all positions
      const allPositions = await getPositions(user.uid);
      await Promise.all(allPositions.map((p) => removePosition(user.uid, p.id)));
      // Reset cash to starting capital
      await updateUserData(user.uid, {
        currentCash: user.startingCapital,
        totalTrades: 0,
      });
      await updateUser({ currentCash: user.startingCapital, totalTrades: 0 });
      alert('Portfolio reset! Your cash has been restored to $' + user.startingCapital.toLocaleString());
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setResetting(false);
    }
  };

  const handleChangeCapital = async () => {
    if (!user) return;
    const amount = parseInt(newCapital.replace(/[^0-9]/g, ''), 10);
    if (!amount || amount < 100) { setCapitalError('Minimum is $100'); return; }
    if (amount > 100000) { setCapitalError('Maximum is $100,000'); return; }
    setResetting(true);
    try {
      // Clear positions + set new capital
      const allPositions = await getPositions(user.uid);
      await Promise.all(allPositions.map((p) => removePosition(user.uid, p.id)));
      await updateUserData(user.uid, {
        startingCapital: amount,
        currentCash: amount,
        totalTrades: 0,
      });
      await updateUser({ startingCapital: amount, currentCash: amount, totalTrades: 0 });
      setShowCapitalModal(false);
      setNewCapital('');
      setCapitalError('');
      alert(`Portfolio reset with $${amount.toLocaleString()} starting capital!`);
    } catch (err) {
      console.error('Capital change error:', err);
    } finally {
      setResetting(false);
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

      {/* Paper Trading Settings */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
          animationDelay: '0.28s',
        }}
      >
        <div>
          <p style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
            Paper Trading
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Starting capital: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>${(user.startingCapital || 0).toLocaleString()}</span>
            {' · '}
            Cash available: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--success)' }}>${(user.currentCash || 0).toFixed(2)}</span>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => { setShowCapitalModal(true); setNewCapital(String(user.startingCapital || 500)); }}
            className="btn btn-secondary"
            style={{ flex: 1, fontSize: '0.85rem', padding: '10px 12px' }}
          >
            Change Capital
          </button>
          <button
            onClick={() => {
              if (window.confirm('Reset your portfolio? This will clear all positions and restore your cash to $' + (user.startingCapital || 500).toLocaleString() + '.')) {
                void handleResetPortfolio();
              }
            }}
            disabled={resetting}
            className="btn btn-ghost"
            style={{ flex: 1, fontSize: '0.85rem', padding: '10px 12px', color: 'var(--warning)', borderColor: 'rgba(245,158,11,0.3)' }}
          >
            {resetting ? 'Resetting...' : 'Reset Portfolio'}
          </button>
        </div>
      </div>

      {/* Capital Change Modal */}
      {showCapitalModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'flex-end',
            padding: '0',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCapitalModal(false); }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 'var(--app-max-width)',
              margin: '0 auto',
              background: 'var(--surface)',
              borderRadius: '24px 24px 0 0',
              padding: '24px 20px 40px',
              animation: 'slideInUp 0.3s ease both',
            }}
          >
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Change Starting Capital
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              This will reset your portfolio — all positions will be cleared and you'll start fresh with the new amount.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '16px' }}>
              {[200, 500, 1000, 2000].map((p) => (
                <button
                  key={p}
                  onClick={() => { setNewCapital(String(p)); setCapitalError(''); }}
                  style={{
                    padding: '10px 6px',
                    background: parseInt(newCapital) === p ? 'var(--accent-light)' : 'var(--surface-elevated)',
                    border: `1px solid ${parseInt(newCapital) === p ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: '10px',
                    color: parseInt(newCapital) === p ? 'var(--accent)' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ${p.toLocaleString()}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.25rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', pointerEvents: 'none' }}>$</span>
              <input
                type="number"
                value={newCapital}
                onChange={(e) => { setNewCapital(e.target.value.replace(/[^0-9]/g, '')); setCapitalError(''); }}
                className="input"
                style={{ paddingLeft: '32px', fontSize: '1.4rem', fontFamily: 'var(--font-mono)', fontWeight: 600, height: '60px', borderColor: capitalError ? 'var(--danger)' : undefined }}
                placeholder="500"
              />
            </div>
            {capitalError && (
              <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '8px' }}>⚠ {capitalError}</p>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => { setShowCapitalModal(false); setCapitalError(''); }}
                className="btn btn-ghost"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={() => void handleChangeCapital()}
                disabled={resetting}
                className="btn btn-primary"
                style={{ flex: 1.5 }}
              >
                {resetting ? 'Saving...' : 'Reset & Start Fresh'}
              </button>
            </div>
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
