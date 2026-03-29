import { useState } from 'react';

interface Scenario {
  title: string;
  description: string;
  priceTarget: number;
  probability: string;
}

interface ScenarioData {
  bull: Scenario;
  base: Scenario;
  bear: Scenario;
}

interface ScenarioReplayProps {
  ticker: string;
  action: 'buy' | 'sell';
  price: number;
  scenarios: ScenarioData | null;
  loading: boolean;
}

const SCENARIO_CONFIG = {
  bull: { label: 'Bull Case', color: '#22C55E', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', icon: '▲' },
  base: { label: 'Base Case', color: '#6366F1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)', icon: '→' },
  bear: { label: 'Bear Case', color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', icon: '▼' },
};

export default function ScenarioReplay({ ticker, action, price, scenarios, loading }: ScenarioReplayProps) {
  const [expanded, setExpanded] = useState<'bull' | 'base' | 'bear' | null>('base');

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', animation: 'slideInUp 0.45s cubic-bezier(0.16,1,0.3,1) both' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg,rgba(99,102,241,0.08) 0%,transparent 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.4rem' }}>🎬</span>
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>What happens next?</p>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>3 paths for {ticker} in 3 months</h3>
          </div>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.55 }}>
          Alpha modeled 3 scenarios for your {action} at ${price.toFixed(2)}. Your thesis quality — not luck — predicts which path you'd recognize and act on.
        </p>
      </div>

      {/* Scenarios */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading ? (
          <>
            {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: '72px', borderRadius: '14px' }} />)}
          </>
        ) : !scenarios ? null : (
          (Object.entries(SCENARIO_CONFIG) as [keyof typeof SCENARIO_CONFIG, typeof SCENARIO_CONFIG[keyof typeof SCENARIO_CONFIG]][]).map(([key, cfg]) => {
            const s = scenarios[key];
            const isOpen = expanded === key;
            const pctChange = ((s.priceTarget - price) / price) * 100;
            return (
              <div
                key={key}
                onClick={() => setExpanded(isOpen ? null : key)}
                style={{
                  background: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                  borderRadius: '14px',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.1rem', color: cfg.color, fontWeight: 700 }}>{cfg.icon}</span>
                    <div>
                      <p style={{ fontSize: '0.85rem', fontWeight: 700, color: cfg.color, lineHeight: 1 }}>{cfg.label}</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.2 }}>{s.title}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700, color: cfg.color }}>
                      ${s.priceTarget.toFixed(0)}
                    </p>
                    <p style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: cfg.color }}>
                      {pctChange >= 0 ? '+' : ''}{pctChange.toFixed(1)}%
                    </p>
                  </div>
                </div>
                {isOpen && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${cfg.border}` }}>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.65, margin: 0 }}>{s.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px', padding: '3px 10px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Probability: {s.probability}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {!loading && scenarios && (
        <div style={{ padding: '0 20px 16px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.55, textAlign: 'center' }}>
            These scenarios are for learning purposes. The goal is to recognize catalysts, not to predict outcomes.
          </p>
        </div>
      )}
    </div>
  );
}
