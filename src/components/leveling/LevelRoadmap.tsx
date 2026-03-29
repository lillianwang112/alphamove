interface LevelRoadmapProps {
  currentLevel: number;
  currentXP: number;
}

const LEVELS = [
  { level: 1, name: 'Paper Rookie', xpRequired: 0, mentorBehavior: 'Directive', unlocks: 'Basic buy/sell, 5 pre-set tickers' },
  { level: 2, name: 'Market Observer', xpRequired: 200, mentorBehavior: 'Directive', unlocks: 'Full ticker search, portfolio view' },
  { level: 3, name: 'Thesis Builder', xpRequired: 500, mentorBehavior: 'Collaborative', unlocks: 'Morning brief, watchlist' },
  { level: 4, name: 'Risk Aware', xpRequired: 1000, mentorBehavior: 'Collaborative', unlocks: 'Sector view, risk metrics' },
  { level: 5, name: 'Pattern Spotter', xpRequired: 1800, mentorBehavior: 'Collaborative', unlocks: 'Price alerts, performance charts' },
  { level: 6, name: 'Independent Thinker', xpRequired: 3000, mentorBehavior: 'Advisory', unlocks: 'Mentor goes quiet unless asked' },
  { level: 7, name: 'Portfolio Strategist', xpRequired: 4500, mentorBehavior: 'Advisory', unlocks: 'Rebalancing suggestions' },
  { level: 8, name: 'Market Analyst', xpRequired: 6500, mentorBehavior: 'Advisory', unlocks: 'Earnings calendar integration' },
  { level: 9, name: 'Alpha Seeker', xpRequired: 9000, mentorBehavior: 'Autonomous', unlocks: 'Full autonomy, mentor is optional' },
  { level: 10, name: 'Graduation', xpRequired: 12000, mentorBehavior: 'Autonomous', unlocks: '"Ready for real brokerage" badge' },
];

function getLevelColor(level: number): string {
  if (level <= 2) return '#64748B';
  if (level <= 5) return '#6366F1';
  if (level <= 8) return '#F59E0B';
  return '#26C2A3';
}

function getMentorBehaviorColor(behavior: string): string {
  switch (behavior) {
    case 'Directive': return '#6366F1';
    case 'Collaborative': return '#22C55E';
    case 'Advisory': return '#F59E0B';
    case 'Autonomous': return '#26C2A3';
    default: return '#64748B';
  }
}

export default function LevelRoadmap({ currentLevel, currentXP }: LevelRoadmapProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {LEVELS.map((lvl, index) => {
        const isCompleted = currentLevel > lvl.level;
        const isCurrent = currentLevel === lvl.level;
        const isLocked = currentLevel < lvl.level;
        const color = getLevelColor(lvl.level);
        const behaviorColor = getMentorBehaviorColor(lvl.mentorBehavior);

        return (
          <div key={lvl.level} style={{ display: 'flex', gap: '0', position: 'relative' }}>
            {/* Timeline */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '40px',
                flexShrink: 0,
              }}
            >
              {/* Circle */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: isCompleted
                    ? color
                    : isCurrent
                    ? `${color}20`
                    : 'var(--surface-elevated)',
                  border: `2px solid ${isLocked ? 'var(--border)' : color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: isCompleted ? 'white' : isLocked ? 'var(--text-muted)' : color,
                  fontFamily: 'var(--font-mono)',
                  flexShrink: 0,
                  zIndex: 1,
                  boxShadow: isCurrent ? `0 0 16px ${color}60` : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                {isCompleted ? '✓' : lvl.level}
              </div>

              {/* Line */}
              {index < LEVELS.length - 1 && (
                <div
                  style={{
                    width: '2px',
                    flex: 1,
                    minHeight: '20px',
                    background: isCompleted
                      ? color
                      : 'var(--border)',
                    margin: '4px 0',
                  }}
                />
              )}
            </div>

            {/* Content */}
            <div
              style={{
                flex: 1,
                paddingLeft: '12px',
                paddingBottom: index < LEVELS.length - 1 ? '16px' : '0',
                opacity: isLocked ? 0.45 : 1,
                transition: 'opacity 0.3s ease',
              }}
            >
              <div
                style={{
                  background: isCurrent ? `${color}08` : 'transparent',
                  border: isCurrent ? `1px solid ${color}30` : '1px solid transparent',
                  borderRadius: 'var(--radius-md)',
                  padding: isCurrent ? '12px' : '8px 12px',
                  transition: 'all 0.3s ease',
                }}
              >
                {/* Level name + XP */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div>
                    <span
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: isLocked ? 'var(--text-muted)' : 'var(--text-primary)',
                      }}
                    >
                      {lvl.name}
                    </span>
                    {isCurrent && (
                      <span
                        style={{
                          marginLeft: '8px',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          background: `${color}20`,
                          color: color,
                          padding: '1px 6px',
                          borderRadius: '999px',
                          border: `1px solid ${color}40`,
                          letterSpacing: '0.03em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Current
                      </span>
                    )}
                  </div>
                  {lvl.xpRequired > 0 && (
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem',
                        color: isCompleted ? 'var(--success)' : isCurrent ? 'var(--xp-gold)' : 'var(--text-muted)',
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {lvl.xpRequired.toLocaleString()} XP
                    </span>
                  )}
                </div>

                {/* Mentor behavior + unlock */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: behaviorColor,
                      background: `${behaviorColor}18`,
                      padding: '2px 7px',
                      borderRadius: '999px',
                      border: `1px solid ${behaviorColor}30`,
                      letterSpacing: '0.03em',
                    }}
                  >
                    {lvl.mentorBehavior}
                  </span>
                </div>

                <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
                  {lvl.unlocks}
                </p>

                {/* Current level progress */}
                {isCurrent && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Progress</span>
                      <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--xp-gold)', fontWeight: 600 }}>
                        {currentXP.toLocaleString()} / {LEVELS[index + 1]?.xpRequired.toLocaleString() || lvl.xpRequired.toLocaleString()} XP
                      </span>
                    </div>
                    <div
                      style={{
                        height: '4px',
                        background: 'var(--surface-elevated)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(((currentXP - lvl.xpRequired) / ((LEVELS[index + 1]?.xpRequired || lvl.xpRequired + 200) - lvl.xpRequired)) * 100, 100)}%`,
                          background: `linear-gradient(90deg, ${color}, ${color}AA)`,
                          borderRadius: '2px',
                          transition: 'width 0.8s ease',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
