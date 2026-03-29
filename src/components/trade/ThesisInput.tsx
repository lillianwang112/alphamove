import { useState, useEffect, useRef } from 'react';

interface ThesisInputProps {
  ticker: string;
  action: 'buy' | 'sell';
  price: number;
  companyName: string;
  onSubmit: (thesis: string) => void;
  onBack: () => void;
}

const HINTS = [
  'What does this company actually do?',
  'Why do you think the price will move in your favor?',
  'What would have to be true for this trade to work out?',
  'What news or trend made you notice this stock?',
];

export default function ThesisInput({ ticker, action, price, companyName, onSubmit, onBack }: ThesisInputProps) {
  const [thesis, setThesis] = useState('');
  const [activeHint, setActiveHint] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setActiveHint((h) => (h + 1) % HINTS.length), 3000);
    return () => clearInterval(timer);
  }, []);

  const words = thesis.trim().split(/\s+/).filter(Boolean).length;
  const isBuy = action === 'buy';
  const canSubmit = words >= 5;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'slideInUp 0.35s cubic-bezier(0.16,1,0.3,1) both' }}>
      {/* Step header */}
      <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(20,21,34,0.96) 60%)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 'var(--radius-xl)', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>2</div>
          <div>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Step 2 of 3 — Your thesis</p>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>Why {isBuy ? 'buy' : 'sell'} {ticker}?</h2>
          </div>
        </div>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
          Before Alpha can help you, write your reasoning in plain English. One to three sentences is enough — the point is to make your thinking visible before you commit.
        </p>
      </div>

      {/* Trade context strip */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>You're planning to</p>
          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: isBuy ? 'var(--success)' : 'var(--danger)' }}>
            {isBuy ? '↗ Buy' : '↙ Sell'} <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{ticker}</span>
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{companyName}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Price</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>${price.toFixed(2)}</p>
        </div>
      </div>

      {/* Input area */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Thesis</label>
            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: words >= 5 ? 'var(--success)' : 'var(--text-muted)', fontWeight: 600 }}>
              {words} {words === 1 ? 'word' : 'words'} {words >= 5 ? '✓' : '(5 min)'}
            </span>
          </div>
          <textarea
            ref={textareaRef}
            value={thesis}
            onChange={(e) => setThesis(e.target.value)}
            placeholder={HINTS[activeHint]}
            rows={4}
            className="input"
            style={{ resize: 'none', fontSize: '0.95rem', lineHeight: 1.6, minHeight: '100px', paddingTop: '12px' }}
          />
        </div>

        {/* Hint chips */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Prompts to help you start</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {HINTS.map((hint, i) => (
              <button
                key={i}
                onClick={() => setThesis((t) => t ? t + ' ' + hint.toLowerCase().replace('?', '.') : hint)}
                style={{
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {hint}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={() => canSubmit && onSubmit(thesis.trim())}
            disabled={!canSubmit}
            className={`btn btn-full ${canSubmit ? 'btn-primary' : ''}`}
            style={{ fontSize: '1rem', height: '52px', background: canSubmit ? undefined : 'var(--surface-elevated)', color: canSubmit ? undefined : 'var(--text-muted)', border: canSubmit ? 'none' : '1px solid var(--border)' }}
          >
            {canSubmit ? 'Have Alpha score my thesis →' : 'Write at least 5 words to continue'}
          </button>
          <button onClick={onBack} className="btn btn-ghost btn-full" style={{ fontSize: '0.9rem' }}>
            ← Back to {ticker} preview
          </button>
        </div>
      </div>
    </div>
  );
}
