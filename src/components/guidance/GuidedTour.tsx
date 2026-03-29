import { createPortal } from 'react-dom';
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

  const card = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        background: 'rgba(6, 8, 14, 0.45)',
      }}
      onClick={skipTour}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '430px',
          margin: '0 auto',
          background: 'linear-gradient(160deg, #15172A 0%, #0D0F19 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '20px 20px 0 0',
          padding: '20px 20px 36px',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
          animation: 'slideInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
      >
        {/* Drag handle */}
        <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.15)', margin: '0 auto 16px' }} />

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          {/* Step dots */}
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === stepIndex ? '16px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  background: i === stepIndex ? 'var(--accent)' : i < stepIndex ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.12)',
                  transition: 'all 0.25s ease',
                }}
              />
            ))}
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '6px', fontWeight: 600 }}>
              {stepIndex + 1}/{totalSteps}
            </span>
          </div>

          <button
            onClick={skipTour}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '999px',
              color: 'var(--text-muted)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px 12px',
            }}
          >
            Skip tour
          </button>
        </div>

        {/* Content */}
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.3 }}>
          {currentStep.title}
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '8px' }}>
          {currentStep.body}
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--accent)', lineHeight: 1.55, marginBottom: '20px', fontStyle: 'italic' }}>
          {currentStep.whyItMatters}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={previousStep}
            disabled={stepIndex === 0}
            className="btn btn-ghost"
            style={{
              flex: 1,
              fontSize: '0.9rem',
              padding: '13px',
              opacity: stepIndex === 0 ? 0.35 : 1,
            }}
          >
            ← Back
          </button>
          <button
            onClick={nextStep}
            className="btn btn-primary"
            style={{ flex: 1.8, fontSize: '0.9rem', padding: '13px', fontWeight: 700 }}
          >
            {isLastStep ? 'Done ✓' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(card, document.body);
}
