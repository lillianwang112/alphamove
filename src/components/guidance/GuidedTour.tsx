import { useGuidance } from '../../context/GuidanceContext';

export default function GuidedTour() {
  const {
    currentStep,
    stepIndex,
    totalSteps,
    tourOpen,
    nextStep,
    previousStep,
    skipTour,
  } = useGuidance();

  if (!tourOpen || !currentStep) return null;

  const isLastStep = stepIndex === totalSteps - 1;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 140,
        pointerEvents: 'none',
        background: 'rgba(6, 8, 14, 0.45)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: 'calc(var(--bottom-nav-height) + 12px)',
          width: 'calc(100% - 24px)',
          maxWidth: 'calc(var(--app-max-width) - 16px)',
          background: 'linear-gradient(135deg, rgba(21, 23, 38, 0.98) 0%, rgba(13, 15, 25, 0.98) 100%)',
          border: '1px solid var(--border-strong)',
          borderRadius: '20px',
          padding: '16px',
          boxShadow: 'var(--shadow-lg)',
          pointerEvents: 'auto',
          animation: 'slideInUp 0.28s ease both',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Tour {stepIndex + 1} of {totalSteps}
          </span>
          <button
            onClick={skipTour}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Skip
          </button>
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          {currentStep.title}
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '10px' }}>
          {currentStep.body}
        </p>
        <div
          style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.18)',
            borderRadius: '14px',
            padding: '10px 12px',
            marginBottom: '14px',
          }}
        >
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            Why beginners should care
          </p>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
            {currentStep.whyItMatters}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={previousStep}
            disabled={stepIndex === 0}
            className="btn btn-ghost"
            style={{ flex: 1, fontSize: '0.9rem', padding: '12px 14px' }}
          >
            Back
          </button>
          <button
            onClick={nextStep}
            className="btn btn-primary"
            style={{ flex: 1.4, fontSize: '0.9rem', padding: '12px 14px' }}
          >
            {isLastStep ? 'Finish tour' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
