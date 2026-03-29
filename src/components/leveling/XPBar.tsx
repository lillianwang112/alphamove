import { useState } from 'react';
import LevelBadge from './LevelBadge';
import InfoButton from '../guidance/InfoButton';
import BottomSheet from '../guidance/BottomSheet';
import { XP_THRESHOLDS } from '../../config/constants';

interface XPBarProps {
  level: number;
  xp: number;
  xpToNextLevel: number;
}

const LEVEL_NAMES: Record<number, string> = {
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

function getLevelColor(level: number): string {
  if (level <= 2) return '#64748B';
  if (level <= 5) return '#6366F1';
  if (level <= 8) return '#F59E0B';
  return '#26C2A3';
}

export default function XPBar({ level, xp, xpToNextLevel }: XPBarProps) {
  const [open, setOpen] = useState(false);
  const isMaxLevel = level >= 10;
  // Calculate progress within the current level range
  const currentLevelThreshold = XP_THRESHOLDS[level - 1] ?? 0;
  const xpInLevel = xp - currentLevelThreshold;
  const xpForLevel = xpToNextLevel; // remaining XP is the gap for this level progress
  const pct = isMaxLevel ? 100 : Math.min(xpForLevel > 0 ? ((xpInLevel / (xpInLevel + xpForLevel)) * 100) : 100, 100);
  const color = getLevelColor(level);
  const levelName = LEVEL_NAMES[level] || 'Paper Rookie';
  // Next level threshold for display
  const nextThreshold = isMaxLevel ? xp : xp + xpToNextLevel;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Top row: badge + level info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <LevelBadge level={level} size="md" />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                Level {level} · {levelName}
              </span>
              <InfoButton label="What is this?" onClick={() => setOpen(true)} />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--xp-gold)',
              }}
            >
              {isMaxLevel ? 'MAX' : `${xp.toLocaleString()} / ${nextThreshold.toLocaleString()} XP`}
            </span>
          </div>

          {/* Progress bar */}
          <div
            style={{
              width: '100%',
              height: '8px',
              background: 'var(--surface-elevated)',
              borderRadius: '4px',
              overflow: 'hidden',
              border: '1px solid var(--border)',
            }}
          >
            <div
              className="xp-bar-fill"
              style={{
                '--xp-fill-pct': `${pct}%`,
                height: '100%',
                width: `${pct}%`,
                background: isMaxLevel
                  ? `linear-gradient(90deg, ${color}, #26C2A3)`
                  : `linear-gradient(90deg, ${color}, ${color}CC)`,
                borderRadius: '4px',
                transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)',
              } as React.CSSProperties}
            />
          </div>
        </div>
      </div>

      {/* XP label below bar */}
      {!isMaxLevel && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, paddingLeft: '52px' }}>
          {xpToNextLevel.toLocaleString()} XP to Level {level + 1}
        </p>
      )}

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="XP and levels"
        subtitle="AlphaMove scores the quality of your thinking, not how many buttons you press."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            XP is earned when you explain your reasoning, manage risk, and review moves honestly.
          </p>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Level names show how independent you are becoming. The point is better judgment, not more trading.
          </p>
        </div>
      </BottomSheet>
    </div>
  );
}
