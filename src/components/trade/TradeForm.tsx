import { useState } from 'react';

interface TradeFormProps {
  action: 'buy' | 'sell';
  ticker: string;
  price: number;
  availableCash: number;
  maxShares?: number;
  onSubmit: (shares: number) => void;
  onBack?: () => void;
}

export default function TradeForm({
  action,
  ticker,
  price,
  availableCash,
  maxShares,
  onSubmit,
  onBack,
}: TradeFormProps) {
  const [shares, setShares] = useState<string>('1');
  const [error, setError] = useState<string>('');

  const numShares = parseFloat(shares) || 0;
  const totalCost = numShares * price;
  const isBuy = action === 'buy';
  const maxBuyShares = Math.floor(availableCash / price);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setShares(val);
      setError('');
    }
  };

  const handleSubmit = () => {
    if (!numShares || numShares <= 0) {
      setError('Enter a valid number of shares');
      return;
    }
    if (isBuy && totalCost > availableCash) {
      setError(`Insufficient cash. Max ${maxBuyShares} shares at this price.`);
      return;
    }
    if (!isBuy && maxShares && numShares > maxShares) {
      setError(`You only own ${maxShares} shares of ${ticker}`);
      return;
    }
    onSubmit(numShares);
  };

  const quickAmounts = isBuy
    ? [
        { label: '25%', shares: Math.floor(maxBuyShares * 0.25) },
        { label: '50%', shares: Math.floor(maxBuyShares * 0.5) },
        { label: '75%', shares: Math.floor(maxBuyShares * 0.75) },
        { label: 'Max', shares: maxBuyShares },
      ].filter((a) => a.shares > 0)
    : maxShares
    ? [
        { label: '25%', shares: Math.floor(maxShares * 0.25) },
        { label: '50%', shares: Math.floor(maxShares * 0.5) },
        { label: 'All', shares: maxShares },
      ].filter((a) => a.shares > 0)
    : [];

  const isOverBudget = isBuy && totalCost > availableCash;
  const isOverHolding = !isBuy && maxShares && numShares > maxShares;
  const isInvalid = !numShares || numShares <= 0 || isOverBudget || isOverHolding;

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                padding: '2px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: isBuy ? 'var(--success-light)' : 'var(--danger-light)',
                color: isBuy ? 'var(--success)' : 'var(--danger)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {action}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--accent)',
              }}
            >
              {ticker}
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            @ ${price.toFixed(2)} per share
          </p>
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Cash/shares info bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            background: 'var(--surface-elevated)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
          }}
        >
          {isBuy ? (
            <>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                  Available Cash
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--success)' }}>
                  ${availableCash.toFixed(2)}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                  Max Shares
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {maxBuyShares}
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                  You Own
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {maxShares ?? 0} shares
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                  Current Value
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  ${((maxShares ?? 0) * price).toFixed(2)}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Shares input */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '10px',
            }}
          >
            How many shares?
          </label>
          <input
            type="number"
            value={shares}
            onChange={handleChange}
            min="0.0001"
            step="1"
            className="input"
            style={{
              fontSize: '1.5rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              height: '64px',
              textAlign: 'center',
              letterSpacing: '-0.01em',
              borderColor: (isOverBudget || isOverHolding) ? 'var(--danger)' : undefined,
            }}
            placeholder="0"
          />

          {/* Quick amounts */}
          {quickAmounts.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${quickAmounts.length}, 1fr)`,
                gap: '8px',
                marginTop: '10px',
              }}
            >
              {quickAmounts.map((qa) => (
                <button
                  key={qa.label}
                  onClick={() => { setShares(String(qa.shares)); setError(''); }}
                  disabled={qa.shares === 0}
                  style={{
                    padding: '8px',
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {qa.label}
                </button>
              ))}
            </div>
          )}

          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>⚠</span> {error}
            </p>
          )}
        </div>

        {/* Total cost */}
        <div
          style={{
            background: isOverBudget ? 'var(--danger-light)' : isBuy ? 'var(--success-light)' : 'var(--warning-light)',
            border: `1px solid ${isOverBudget ? 'rgba(239,68,68,0.3)' : isBuy ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {isBuy ? 'Total Cost' : 'You Receive'}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: isOverBudget ? 'var(--danger)' : isBuy ? 'var(--success)' : 'var(--warning)',
            }}
          >
            ${totalCost.toFixed(2)}
          </span>
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!!isInvalid}
          className={`btn btn-full ${isBuy ? 'btn-success' : 'btn-danger'}`}
          style={{ fontSize: '1rem', height: '54px' }}
        >
          {isInvalid && numShares > 0
            ? isBuy
              ? `Exceeds budget by $${(totalCost - availableCash).toFixed(2)}`
              : 'Invalid amount'
            : `Continue to Mentor Review`}
        </button>
      </div>
    </div>
  );
}
