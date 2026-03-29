import { useEffect, useState } from 'react';
import { getChessPiece, getLevelColor } from './LevelBadge';
import { LEVEL_CONFIGS } from '../../config/constants';

interface LevelUpModalProps {
  newLevel: number;
  onDismiss: () => void;
}

const PARTICLE_COUNT = 24;
const PARTICLE_COLORS = ['#6366F1', '#F59E0B', '#22C55E', '#26C2A3', '#EC4899', '#8B5CF6'];

function Particle({ index }: { index: number }) {
  const angle = (index / PARTICLE_COUNT) * 360;
  const distance = 80 + Math.random() * 60;
  const size = 4 + Math.random() * 6;
  const color = PARTICLE_COLORS[index % PARTICLE_COLORS.length];
  const delay = Math.random() * 0.3;
  const duration = 0.6 + Math.random() * 0.4;

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: color,
        transform: 'translate(-50%, -50%)',
        animation: `particle-burst ${duration}s ease-out ${delay}s both`,
        '--angle': `${angle}deg`,
        '--distance': `${distance}px`,
        boxShadow: `0 0 6px ${color}`,
      } as React.CSSProperties}
    />
  );
}

export default function LevelUpModal({ newLevel, onDismiss }: LevelUpModalProps) {
  const [visible, setVisible] = useState(false);
  const color = getLevelColor(newLevel);
  const piece = getChessPiece(newLevel);
  const config = LEVEL_CONFIGS[newLevel - 1];
  const levelName = config?.name ?? 'New Level';
  const unlockedFeatures = config?.unlockedFeatures ?? [];

  useEffect(() => {
    // Slight delay for mount animation
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
      onClick={handleDismiss}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '360px',
          background: 'linear-gradient(160deg, var(--surface-elevated) 0%, var(--surface) 100%)',
          border: `1px solid ${color}40`,
          borderRadius: '28px',
          padding: '40px 28px 32px',
          textAlign: 'center',
          position: 'relative',
          boxShadow: `0 0 80px ${color}30, 0 20px 60px rgba(0,0,0,0.5)`,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(20px)',
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Particles */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: 0, height: 0, pointerEvents: 'none' }}>
          {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
            <Particle key={i} index={i} />
          ))}
        </div>

        {/* Glow ring */}
        <div
          style={{
            position: 'absolute',
            top: '-2px',
            left: '-2px',
            right: '-2px',
            bottom: '-2px',
            borderRadius: '30px',
            background: `linear-gradient(135deg, ${color}30, transparent 60%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Level badge */}
        <div
          className="level-up-text"
          style={{
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            background: `${color}22`,
            border: `3px solid ${color}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: `0 0 40px ${color}60, 0 0 80px ${color}30`,
            animation: 'levelUpBadge 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both',
          }}
        >
          <span style={{ fontSize: '2.5rem', lineHeight: 1, color: 'white', WebkitTextStroke: '0.5px rgba(255,255,255,0.5)' }}>
            {piece}
          </span>
          <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'white', opacity: 0.85, marginTop: '2px' }}>
            LVL {newLevel}
          </span>
        </div>

        {/* LEVEL UP text */}
        <div
          className="level-up-text"
          style={{ animationDelay: '0.2s' }}
        >
          <p
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: color,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            ✦ Level Up ✦
          </p>
          <h2
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: '4px',
              background: `linear-gradient(135deg, white, ${color})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {levelName}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Level {newLevel} unlocked
          </p>
        </div>

        {/* Unlocked features */}
        {unlockedFeatures.length > 0 && (
          <div
            className="level-up-text"
            style={{
              background: `${color}10`,
              border: `1px solid ${color}25`,
              borderRadius: '14px',
              padding: '14px 16px',
              marginBottom: '24px',
              textAlign: 'left',
              animationDelay: '0.35s',
            }}
          >
            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
              Unlocked
            </p>
            {unlockedFeatures.map((feature, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: i < unlockedFeatures.length - 1 ? '6px' : 0 }}>
                <span style={{ color: color, fontSize: '0.75rem', flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{feature}</span>
              </div>
            ))}
          </div>
        )}

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="btn btn-primary btn-full"
          style={{
            fontSize: '1rem',
            height: '52px',
            background: `linear-gradient(135deg, ${color}, ${color}BB)`,
            boxShadow: `0 4px 24px ${color}40`,
            animation: 'level-up-text 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both',
          }}
        >
          Let's keep playing ♟
        </button>
      </div>
    </div>
  );
}
