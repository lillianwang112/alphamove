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
        justifyContent: 'space-between',
        padding: '0',
        background: 'var(--bg)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background: dot grid pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
        }}
      />

      {/* Glow orbs */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '420px',
          height: '420px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.13) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '-80px',
          width: '280px',
          height: '280px',
          background: 'radial-gradient(circle, rgba(38, 194, 163, 0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '30%',
          right: '-60px',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Hero Section */}
      <div
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 28px 32px',
          gap: '0',
          animation: 'slideInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: '88px',
            height: '88px',
            borderRadius: '24px',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '44px',
            marginBottom: '28px',
            boxShadow: '0 0 60px rgba(99, 102, 241, 0.45), 0 12px 40px rgba(0,0,0,0.6)',
            position: 'relative',
          }}
        >
          ♟
          {/* Outer glow ring */}
          <div
            style={{
              position: 'absolute',
              inset: '-3px',
              borderRadius: '27px',
              background: 'transparent',
              border: '1.5px solid rgba(99, 102, 241, 0.3)',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* App name */}
        <h1
          style={{
            fontSize: '3.2rem',
            fontWeight: 800,
            letterSpacing: '-0.05em',
            background: 'linear-gradient(135deg, #F1F5F9 0%, #94A3B8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '10px',
            textAlign: 'center',
            lineHeight: 1,
          }}
        >
          AlphaMove
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontSize: '1.125rem',
            color: 'var(--text-primary)',
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: 1.45,
            marginBottom: '8px',
            letterSpacing: '-0.01em',
          }}
        >
          The chess engine for your portfolio
        </p>
        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            lineHeight: 1.6,
            marginBottom: '36px',
            maxWidth: '28ch',
          }}
        >
          AI mentor. Real market data.
          Your actual budget.
        </p>

        {/* Feature cards — 3 horizontal */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '10px',
            width: '100%',
            marginBottom: '36px',
          }}
        >
          {[
            { icon: '♟', title: 'Every move rated', sub: 'Like a chess engine' },
            { icon: '🧠', title: 'Socratic mentor', sub: 'Think first' },
            { icon: '📈', title: 'Level up', sub: 'Real judgment' },
          ].map((f) => (
            <div
              key={f.title}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '14px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{f.icon}</span>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, margin: 0 }}>
                {f.title}
              </p>
              <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>
                {f.sub}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section — pinned at bottom */}
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '0 28px calc(32px + env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          animation: 'slideInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both',
        }}
      >
        {/* Google sign-in — primary CTA */}
        <button
          onClick={onSignIn}
          disabled={loading}
          className="btn btn-primary btn-full btn-lg"
          style={{ position: 'relative', overflow: 'hidden' }}
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
                  flexShrink: 0,
                }}
              />
              Signing in…
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

        {/* Guest option — secondary */}
        <button
          onClick={handleGuestSignIn}
          disabled={loading || guestLoading}
          className="btn btn-ghost btn-full"
          style={{ fontSize: '0.9rem', color: guestLoading ? 'var(--accent)' : 'var(--text-secondary)' }}
        >
          {guestLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '14px', height: '14px', border: '2px solid rgba(99,102,241,0.3)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
              Starting guest session…
            </span>
          ) : 'Continue as Guest'}
        </button>

        {guestError && (
          <p style={{ color: 'var(--danger)', fontSize: '0.78rem', textAlign: 'center' }}>⚠ {guestError}</p>
        )}

        <p
          style={{
            fontSize: '0.68rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            lineHeight: 1.6,
          }}
        >
          Paper trading only · No real money · Educational use<br />
          Guest progress is saved to this device.
        </p>
      </div>
    </div>
  );
}
