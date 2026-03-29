import { useEffect, useState } from 'react';

interface ScoreDimension {
  score: number;
  note: string;
}

interface ThesisScoreData {
  clarity: ScoreDimension;
  riskAwareness: ScoreDimension;
  macroAwareness: ScoreDimension;
  overallFeedback: string;
  canProceed: boolean;
}

interface ThesisScoreProps {
  thesis: string;
  ticker: string;
  action: 'buy' | 'sell';
  scores: ThesisScoreData | null;
  loading: boolean;
  onProceed: () => void;
  onRevise: () => void;
}

const DIMENSION_CONFIG = {
  clarity: { label: 'Clarity', icon: '🎯', desc: 'Is your reasoning specific and falsifiable?' },
  riskAwareness: { label: 'Risk Awareness', icon: '🛡', desc: 'Do you acknowledge what could go wrong?' },
  macroAwareness: { label: 'Macro Awareness', icon: '🌐', desc: 'Are you connected to current market context?' },
};

function ScoreBar({ score, color }: { score: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { setTimeout(() => setWidth((score / 5) * 100), 200); }, [score]);
  return (
    <div style={{ height: '6px', background: 'var(--surface-elevated)', borderRadius: '3px', overflow: 'hidden', marginTop: '6px' }}>
      <div style={{ height: '100%', width: `${width}%`, background: color, borderRadius: '3px', transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)' }} />
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 4) return 'var(--success)';
  if (score >= 3) return '#F59E0B';
  return 'var(--danger)';
}

function scoreLabel(score: number): string {
  if (score >= 5) return 'Excellent';
  if (score >= 4) return 'Strong';
  if (score >= 3) return 'Decent';
  if (score >= 2) return 'Weak';
  return 'Missing';
}

export default function ThesisScore({ thesis, ticker, action, scores, loading, onProceed, onRevise }: ThesisScoreProps) {
  const isBuy = action === 'buy';

  if (loading) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', animation: 'slideInUp 0.35s cubic-bezier(0.16,1,0.3,1) both' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', animation: 'pulse 1.5s ease-in-out infinite' }}>♟</div>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Alpha is evaluating your thesis…</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Scoring clarity, risk awareness, and macro context</p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', animation: `bounce 1.2s ${i * 0.18}s infinite ease-in-out` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!scores) return null;

  const avgScore = (scores.clarity.score + scores.riskAwareness.score + scores.macroAwareness.score) / 3;
  const overallColor = scoreColor(avgScore);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', animation: 'slideInUp 0.35s cubic-bezier(0.16,1,0.3,1) both' }}>
      {/* Step header */}
      <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(20,21,34,0.96) 60%)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 'var(--radius-xl)', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>3</div>
          <div>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Step 3 of 3 — Alpha's verdict</p>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>Thesis scored for {isBuy ? 'buying' : 'selling'} {ticker}</h2>
          </div>
        </div>
        {/* User's thesis */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 14px' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Your thesis</p>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.55, fontStyle: 'italic', margin: 0 }}>"{thesis}"</p>
        </div>
      </div>

      {/* Scores card */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        {/* Overall */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Overall thesis quality</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: overallColor }}>
            {avgScore.toFixed(1)} / 5 — {scoreLabel(avgScore)}
          </span>
        </div>

        {/* 3 dimensions */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(Object.entries(DIMENSION_CONFIG) as [keyof typeof DIMENSION_CONFIG, typeof DIMENSION_CONFIG[keyof typeof DIMENSION_CONFIG]][]).map(([key, cfg]) => {
            const dim = scores[key];
            const color = scoreColor(dim.score);
            return (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1rem' }}>{cfg.icon}</span>
                    <div>
                      <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{cfg.label}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>{cfg.desc}</p>
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700, color, flexShrink: 0, marginLeft: '8px' }}>
                    {dim.score}/5
                  </span>
                </div>
                <ScoreBar score={dim.score} color={color} />
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '6px' }}>{dim.note}</p>
              </div>
            );
          })}
        </div>

        {/* Alpha's overall feedback */}
        <div style={{ padding: '14px 20px', background: 'rgba(99,102,241,0.06)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>♟</span>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>
              {scores.overallFeedback}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={onProceed}
            className={`btn btn-full ${scores.canProceed ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '1rem', height: '52px' }}
          >
            {scores.canProceed ? `Continue to set trade size →` : 'Proceed anyway (not recommended)'}
          </button>
          <button onClick={onRevise} className="btn btn-ghost btn-full" style={{ fontSize: '0.9rem' }}>
            Revise my thesis
          </button>
        </div>
      </div>
    </div>
  );
}
