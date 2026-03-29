import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { generateCoachGuidance } from '../../services/mentorService';

interface CoachPanelProps {
  open: boolean;
  onClose: () => void;
  widgetName: string;
  contextData: string;
  userLevel?: number;
}

export default function CoachPanel({ open, onClose, widgetName, contextData, userLevel = 1 }: CoachPanelProps) {
  const [points, setPoints] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!open || fetched) return;
    setLoading(true);
    setFetched(true);
    generateCoachGuidance(widgetName, contextData, userLevel)
      .then((result) => setPoints(result.points))
      .catch(() => setPoints([
        'Look at the numbers critically — not just whether they\'re up or down, but why.',
        'Compare today\'s data to what you expected. The gap is where learning happens.',
        'What would you do differently if you were starting fresh right now?',
      ]))
      .finally(() => setLoading(false));
  }, [open, fetched, widgetName, contextData, userLevel]);

  if (!open) return null;

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'rgba(6,8,14,0.5)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg,#15172A 0%,#0D0F19 100%)',
          borderRadius: '20px 20px 0 0',
          border: '1px solid rgba(99,102,241,0.2)',
          borderBottom: 'none',
          padding: '0 0 env(safe-area-inset-bottom)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
          animation: 'slideInUp 0.25s cubic-bezier(0.16,1,0.3,1) both',
          width: '100%',
          maxWidth: '430px',
          margin: '0 auto',
        }}
      >
        <div style={{ width: '36px', height: '4px', background: 'rgba(255,255,255,0.12)', borderRadius: '2px', margin: '12px auto 0' }} />
        <div style={{ padding: '14px 20px 4px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.3rem' }}>🔍</span>
            <div>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>What to notice here</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600 }}>{widgetName}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px', color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer', padding: '4px 10px' }}>×</button>
        </div>

        <div style={{ padding: '20px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: '56px', borderRadius: '12px' }} />)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {points.map((point, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '14px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>{point}</p>
                </div>
              ))}
            </div>
          )}
          <button onClick={onClose} className="btn btn-ghost btn-full" style={{ marginTop: '16px', fontSize: '0.9rem' }}>Got it</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
