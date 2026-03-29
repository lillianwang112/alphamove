interface TradeConfirmationProps {
  action: 'buy' | 'sell';
  ticker: string;
  shares: number;
  price: number;
  total: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

export default function TradeConfirmation({
  action,
  ticker,
  shares,
  price,
  total,
  onConfirm,
  onCancel,
  loading,
}: TradeConfirmationProps) {
  const isBuy = action === 'buy';

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
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: isBuy ? 'var(--success-light)' : 'var(--danger-light)',
            border: `2px solid ${isBuy ? 'var(--success)' : 'var(--danger)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            margin: '0 auto 12px',
          }}
        >
          {isBuy ? '↗' : '↙'}
        </div>
        <h3
          style={{
            fontSize: '1.125rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '4px',
          }}
        >
          Confirm {isBuy ? 'Purchase' : 'Sale'}
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Review your trade before executing
        </p>
      </div>

      {/* Trade details */}
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0',
        }}
      >
        {[
          {
            label: 'Action',
            value: (
              <span
                style={{
                  padding: '2px 10px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  background: isBuy ? 'var(--success-light)' : 'var(--danger-light)',
                  color: isBuy ? 'var(--success)' : 'var(--danger)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {action}
              </span>
            ),
          },
          {
            label: 'Ticker',
            value: (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: 'var(--accent)',
                  fontSize: '0.95rem',
                }}
              >
                {ticker}
              </span>
            ),
          },
          {
            label: 'Shares',
            value: (
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                {shares}
              </span>
            ),
          },
          {
            label: 'Price',
            value: (
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                ${price.toFixed(2)}
              </span>
            ),
          },
        ].map((row, i) => (
          <div
            key={row.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: i < 3 ? '1px solid var(--border)' : 'none',
            }}
          >
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {row.label}
            </span>
            {row.value}
          </div>
        ))}
      </div>

      {/* Total */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          background: isBuy ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          {isBuy ? 'Total Cost' : 'You Receive'}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1.375rem',
            fontWeight: 700,
            color: isBuy ? 'var(--success)' : 'var(--danger)',
          }}
        >
          ${total.toFixed(2)}
        </span>
      </div>

      {/* Disclaimer */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
          This is a paper trade. No real money will change hands.
          Your mentor will analyze this move immediately after.
        </p>
      </div>

      {/* Actions */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`btn btn-full ${isBuy ? 'btn-success' : 'btn-danger'}`}
          style={{ fontSize: '1rem', height: '52px' }}
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
              Executing Trade...
            </span>
          ) : (
            `Execute ${isBuy ? 'Buy' : 'Sell'}`
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="btn btn-ghost btn-full"
          style={{ fontSize: '0.95rem' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
