import { useState } from 'react';

interface CapitalInputProps {
  onSubmit: (amount: number) => void;
  userName: string;
}

const PRESETS = [200, 500, 1000, 2000];

export default function CapitalInput({ onSubmit, userName }: CapitalInputProps) {
  const [value, setValue] = useState<string>('500');
  const [error, setError] = useState<string>('');

  const firstName = userName?.split(' ')[0] || 'there';

  const numericValue = parseInt(value.replace(/[^0-9]/g, ''), 10);

  const handlePreset = (amount: number) => {
    setValue(String(amount));
    setError('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setValue(raw);
    setError('');
  };

  const handleSubmit = () => {
    if (!numericValue || numericValue < 100) {
      setError('Minimum starting capital is $100');
      return;
    }
    if (numericValue > 100000) {
      setError('Maximum starting capital is $100,000');
      return;
    }
    onSubmit(numericValue);
  };

  const isValid = numericValue >= 100 && numericValue <= 100000;

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
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
          top: '10%',
          right: '-80px',
          width: '250px',
          height: '250px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '48px',
          animation: 'fadeIn 0.4s ease both',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
          }}
        >
          ♟
        </div>
        <span
          style={{
            fontWeight: 700,
            fontSize: '1.125rem',
            color: 'var(--text-primary)',
          }}
        >
          AlphaMove
        </span>
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
          animationDelay: '0.1s',
        }}
      >
        {/* Greeting */}
        <div style={{ marginBottom: '32px' }}>
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--accent)',
              fontWeight: 600,
              marginBottom: '8px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Welcome, {firstName}!
          </p>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              marginBottom: '12px',
            }}
          >
            How much could you
            <br />
            realistically invest?
          </h1>
          <p
            style={{
              fontSize: '0.925rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}
          >
            We'll use this as your starting capital. Real constraints teach real lessons — managing $500 is a fundamentally different skill than playing with $100K fake money.
          </p>
        </div>

        {/* Amount input */}
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: '16px',
                fontSize: '1.5rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                pointerEvents: 'none',
                fontWeight: 500,
              }}
            >
              $
            </span>
            <input
              type="number"
              value={value}
              onChange={handleChange}
              min={100}
              max={100000}
              className="input"
              style={{
                paddingLeft: '36px',
                fontSize: '1.75rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                height: '72px',
                letterSpacing: '-0.02em',
                borderColor: error ? 'var(--danger)' : undefined,
              }}
              placeholder="500"
            />
          </div>
          {error && (
            <p
              style={{
                color: 'var(--danger)',
                fontSize: '0.8rem',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>⚠</span> {error}
            </p>
          )}
        </div>

        {/* Preset buttons */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            marginBottom: '32px',
          }}
        >
          {PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => handlePreset(preset)}
              style={{
                padding: '12px 8px',
                background: numericValue === preset ? 'var(--accent-light)' : 'var(--surface)',
                border: `1px solid ${numericValue === preset ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
                color: numericValue === preset ? 'var(--accent)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              ${preset.toLocaleString()}
            </button>
          ))}
        </div>

        {/* Info card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            marginBottom: '32px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
          }}
        >
          <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>💡</span>
          <div>
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                fontWeight: 600,
                marginBottom: '4px',
              }}
            >
              Why does this matter?
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Unlike simulators that give you $100K in fake money, AlphaMove works with what you'd actually invest. The psychology of managing real-sized positions is the lesson.
            </p>
          </div>
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="btn btn-primary btn-full"
          style={{ fontSize: '1.05rem', height: '54px' }}
        >
          {isValid
            ? `Start with $${numericValue.toLocaleString()}`
            : "Let's Start"}
        </button>

        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: '16px',
            lineHeight: 1.5,
          }}
        >
          This is paper trading — no real money is used.
          <br />
          You can always reset your portfolio later.
        </p>
      </div>
    </div>
  );
}
