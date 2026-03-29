import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WIZARD_SEEN_KEY = 'alphamove.wizardSeen';

export function markWizardSeen() {
  // Also mark tour as seen so the auto-tour doesn't conflict
  window.localStorage.setItem(WIZARD_SEEN_KEY, 'true');
  window.localStorage.setItem('alphamove.tourSeen', 'true');
}

export function hasSeenWizard(): boolean {
  return window.localStorage.getItem(WIZARD_SEEN_KEY) === 'true';
}

interface Step {
  icon: string;
  label: string;
  title: string;
  body: string;
  highlight?: string;
}

const STEPS: Step[] = [
  {
    icon: '🏛️',
    label: 'Investing 101',
    title: 'Investing is how money makes money.',
    body: "When you buy a stock, you buy a tiny piece of a real company. If the company grows and earns more, your piece becomes worth more. If it shrinks, your piece shrinks too. That's the whole game.",
    highlight: 'Unlike a savings account, investing carries real risk — and real upside.',
  },
  {
    icon: '🍕',
    label: 'What is a stock?',
    title: "A stock is like owning a slice of a pizza.",
    body: "Apple has about 15 billion shares outstanding. If you own one share, you own a tiny fraction of Apple — its products, its patents, its profits. As Apple grows, so does your slice. When thousands of people all want to buy Apple's slices at once, the price of each slice goes up.",
    highlight: 'Stocks = ownership. More demand → higher price.',
  },
  {
    icon: '📰',
    label: 'Why prices move',
    title: "Prices change when expectations change.",
    body: "A stock price isn't just what a company is worth today — it's what investors expect it to be worth in the future. Good earnings? Expectations rise, price rises. Bad news? Expectations fall. Your job as an investor is to develop better judgment about the future than the average person.",
    highlight: 'Investing is about forming a thesis and being right more often than wrong.',
  },
  {
    icon: '🎯',
    label: 'Risk is real',
    title: "You can lose money. That's the deal.",
    body: "Every investment carries risk. Even the most \"safe\" companies can drop 30% in a rough market. The question isn't how to eliminate risk — it's how to understand it, size your position correctly, and have a plan when things go wrong.",
    highlight: "Practice trading with your real budget number — not $100K in fake money. Smaller stakes, real psychology.",
  },
  {
    icon: '♟️',
    label: 'Meet Alpha',
    title: "Alpha rates every move you make.",
    body: "Before each trade, Alpha will ask you Socratic questions to sharpen your reasoning. After each trade, Alpha will rate your move like a chess engine: Brilliant, Great, Good, Inaccuracy, Mistake, or Blunder. You earn XP for the quality of your thinking — not for making money.",
    highlight: 'A trade with brilliant reasoning that loses money still earns 100 XP.',
  },
  {
    icon: '🚀',
    label: "You're ready",
    title: "Time to make your first move.",
    body: "Start with a company you know. Ask yourself: what does this company do? Why might it be worth more in the future? What could go wrong? That's your thesis. Alpha will help you sharpen it before you commit.",
    highlight: "Paper trading = no real money at stake. Real learning = your actual reasoning.",
  },
];

interface OnboardingWizardProps {
  startingCapital: number;
  onComplete: () => void;
}

export default function OnboardingWizard({ startingCapital, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const pct = ((step + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (isLast) {
      markWizardSeen();
      onComplete();
      navigate('/trade?ticker=AAPL');
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleSkip = () => {
    markWizardSeen();
    onComplete();
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          top: '5%',
          left: '-60px',
          width: '280px',
          height: '280px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '-40px',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Progress bar */}
      <div style={{ height: '3px', background: 'var(--surface-elevated)', flexShrink: 0 }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'linear-gradient(90deg, var(--accent), #7C3AED)',
            transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
            }}
          >
            ♟
          </div>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            AlphaMove
          </span>
        </div>

        <button
          onClick={handleSkip}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          Skip intro
        </button>
      </div>

      {/* Step indicator dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', padding: '4px 20px', flexShrink: 0 }}>
        {STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === step ? '20px' : '6px',
              height: '6px',
              borderRadius: '3px',
              background: i === step ? 'var(--accent)' : i < step ? 'rgba(99,102,241,0.4)' : 'var(--surface-elevated)',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div
        key={step}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 24px 32px',
          animation: 'slideInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(124,58,237,0.08) 100%)',
            border: '1px solid rgba(99,102,241,0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            marginBottom: '28px',
          }}
        >
          {current.icon}
        </div>

        {/* Step label */}
        <p
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            marginBottom: '10px',
          }}
        >
          {current.label}
        </p>

        {/* Title */}
        <h1
          style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.22,
            letterSpacing: '-0.02em',
            marginBottom: '18px',
          }}
        >
          {current.title}
        </h1>

        {/* Body */}
        <p
          style={{
            fontSize: '0.975rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.68,
            marginBottom: '24px',
            flex: 1,
          }}
        >
          {current.body}
        </p>

        {/* Highlight box */}
        {current.highlight && (
          <div
            style={{
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.20)',
              borderLeft: '3px solid var(--accent)',
              borderRadius: '14px',
              padding: '14px 16px',
              marginBottom: '32px',
            }}
          >
            <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
              {/* Inject capital amount on step 4 */}
              {current.highlight.includes('Practice trading')
                ? current.highlight.replace(
                    "your real budget number",
                    `$${startingCapital.toLocaleString()}`
                  )
                : current.highlight}
            </p>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div style={{ padding: '0 24px 40px', flexShrink: 0 }}>
        {step > 0 && (
          <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Step {step + 1} of {STEPS.length}
          </p>
        )}
        <button
          onClick={handleNext}
          className="btn btn-primary btn-full"
          style={{
            height: '56px',
            fontSize: '1.05rem',
            fontWeight: 700,
            background: isLast
              ? 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)'
              : 'var(--accent)',
            boxShadow: isLast ? '0 0 28px rgba(99,102,241,0.4)' : 'none',
          }}
        >
          {isLast ? `Make my first move →` : 'Got it, next →'}
        </button>

        {step === 0 && (
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '14px' }}>
            6-step intro · Takes about 2 minutes
          </p>
        )}
      </div>
    </div>
  );
}
