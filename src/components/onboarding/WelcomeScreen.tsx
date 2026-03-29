import { useState } from 'react';

interface WelcomeScreenProps {
  onSignIn: () => void;
  onGuestSignIn: () => Promise<void>;
  loading: boolean;
}

export default function WelcomeScreen({ onSignIn, onGuestSignIn, loading }: WelcomeScreenProps) {
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState('');

  const handleGuestSignIn = async () => {
    setGuestLoading(true);
    setGuestError('');
    try {
      await onGuestSignIn();
    } catch (err) {
      console.error('Guest sign-in failed:', err);
      setGuestError('Could not start guest session. Please try again.');
      setGuestLoading(false);
    }
  };
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        background: 'var(--bg)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(38, 194, 163, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0',
          animation: 'slideInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
      >
        {/* Chess piece icon */}
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
            marginBottom: '28px',
            boxShadow: '0 0 40px rgba(99, 102, 241, 0.4), 0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          ♟
        </div>

        {/* App name */}
        <h1
          style={{
            fontSize: '2.75rem',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, #F8FAFC 0%, #94A3B8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '12px',
            textAlign: 'center',
          }}
        >
          AlphaMove
        </h1>

        {/* Primary tagline */}
        <p
          style={{
            fontSize: '1.125rem',
            color: 'var(--text-primary)',
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: 1.4,
            marginBottom: '8px',
          }}
        >
          Chess.com meets Duolingo
          <br />
          for investing
        </p>

        {/* Sub tagline */}
        <p
          style={{
            fontSize: '0.95rem',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            lineHeight: 1.6,
            marginBottom: '48px',
          }}
        >
          Your AI mentor rates every trade like a chess engine.
          Learn by doing — with your real budget.
        </p>

        {/* Feature pills */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'center',
            marginBottom: '48px',
          }}
        >
          {[
            { icon: '⚡', text: 'Real-time market data' },
            { icon: '🧠', text: 'AI mentor on every trade' },
            { icon: '♟', text: 'Chess-engine feedback' },
            { icon: '📈', text: 'Level up your judgment' },
          ].map((feature) => (
            <div
              key={feature.text}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '999px',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                fontWeight: 500,
              }}
            >
              <span>{feature.icon}</span>
              <span>{feature.text}</span>
            </div>
          ))}
        </div>

        {/* Sign in button */}
        <button
          onClick={onSignIn}
          disabled={loading}
          className="btn btn-primary btn-full btn-lg"
          style={{
            fontSize: '1.05rem',
            letterSpacing: '-0.01em',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  display: 'inline-block',
                }}
              />
              Signing in...
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </span>
          )}
        </button>

        {/* Guest sign-in */}
        <button
          onClick={handleGuestSignIn}
          disabled={loading || guestLoading}
          style={{
            background: 'none',
            border: 'none',
            color: guestLoading ? 'var(--accent)' : 'var(--text-muted)',
            fontSize: '0.88rem',
            cursor: guestLoading ? 'default' : 'pointer',
            marginTop: '16px',
            padding: '12px 16px',
            textDecoration: guestLoading ? 'none' : 'underline',
            textDecorationColor: 'rgba(148,163,184,0.35)',
            textUnderlineOffset: '3px',
            WebkitTapHighlightColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minHeight: '44px',
          }}
        >
          {guestLoading ? (
            <>
              <span style={{ width: '14px', height: '14px', border: '2px solid rgba(99,102,241,0.3)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block', flexShrink: 0 }} />
              Starting guest session…
            </>
          ) : (
            'Continue as Guest →'
          )}
        </button>

        {guestError && (
          <p style={{ color: 'var(--danger)', fontSize: '0.78rem', textAlign: 'center', marginTop: '4px' }}>
            ⚠ {guestError}
          </p>
        )}

        {/* Disclaimer */}
        <p
          style={{
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: '14px',
            lineHeight: 1.5,
          }}
        >
          Paper trading only · No real money · Educational use
          <br />
          Guest progress is saved to this device.
        </p>
      </div>
    </div>
  );
}
