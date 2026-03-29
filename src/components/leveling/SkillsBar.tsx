interface SkillXP {
  risk: number;
  macro: number;
  valuation: number;
  discipline: number;
}

interface SkillsBarProps {
  totalXP: number;
  skillXP?: SkillXP;
  compact?: boolean;
}

const SKILL_CONFIG = [
  {
    key: 'valuation' as const,
    label: 'Valuation',
    icon: '📊',
    description: 'Thesis quality, price reasoning',
    color: '#6366F1',
    max: 600,
  },
  {
    key: 'risk' as const,
    label: 'Risk',
    icon: '🛡',
    description: 'Position sizing, loss handling',
    color: '#22C55E',
    max: 500,
  },
  {
    key: 'macro' as const,
    label: 'Macro',
    icon: '🌐',
    description: 'Market context, brief engagement',
    color: '#8B5CF6',
    max: 400,
  },
  {
    key: 'discipline' as const,
    label: 'Discipline',
    icon: '🎯',
    description: 'Consistency, streak, patience',
    color: '#F59E0B',
    max: 400,
  },
];

function deriveSkillXP(totalXP: number): SkillXP {
  return {
    valuation: Math.round(totalXP * 0.34),
    risk: Math.round(totalXP * 0.28),
    macro: Math.round(totalXP * 0.22),
    discipline: Math.round(totalXP * 0.16),
  };
}

export default function SkillsBar({ totalXP, skillXP, compact = false }: SkillsBarProps) {
  const skills = skillXP ?? deriveSkillXP(totalXP);

  if (compact) {
    return (
      <div style={{ display: 'flex', gap: '8px' }}>
        {SKILL_CONFIG.map((sk) => {
          const val = skills[sk.key];
          const pct = Math.min((val / sk.max) * 100, 100);
          return (
            <div key={sk.key} style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{sk.label}</span>
              </div>
              <div style={{ height: '4px', background: 'var(--surface-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: sk.color, borderRadius: '2px', transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Skill Tracks</p>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>XP split across 4 investing disciplines</p>
      </div>
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {SKILL_CONFIG.map((sk) => {
          const val = skills[sk.key];
          const pct = Math.min((val / sk.max) * 100, 100);
          return (
            <div key={sk.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem' }}>{sk.icon}</span>
                  <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{sk.label}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>{sk.description}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: sk.color }}>{val.toLocaleString()} XP</p>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{pct.toFixed(0)}%</p>
                </div>
              </div>
              <div style={{ height: '8px', background: 'var(--surface-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${sk.color}99, ${sk.color})`, borderRadius: '4px', transition: 'width 0.9s cubic-bezier(0.16,1,0.3,1)' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
