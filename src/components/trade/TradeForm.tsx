import { useState } from 'react';

export type OrderType = 'market' | 'limit' | 'stop_loss';

interface TradeFormProps {
  action: 'buy' | 'sell';
  ticker: string;
  price: number;
  availableCash: number;
  maxShares?: number;
  userLevel?: number;
  onSubmit: (shares: number, orderType: OrderType, limitPrice?: number) => void;
  onBack?: () => void;
}

const ORDER_TYPE_INFO: Record<OrderType, { label: string; desc: string; color: string }> = {
  market: {
    label: 'Market Order',
    desc: 'Execute immediately at the current market price. Fast, but price may vary slightly.',
    color: 'var(--accent)',
  },
  limit: {
    label: 'Limit Order',
    desc: 'Set a maximum price (buy) or minimum price (sell). Only executes at your price or better.',
    color: 'var(--success)',
  },
  stop_loss: {
    label: 'Stop-Loss',
    desc: 'Automatically sells if the price drops to your stop price. Protects against large losses.',
    color: '#F59E0B',
  },
};

export default function TradeForm({
  action,
  ticker,
  price,
  availableCash,
  maxShares,
  userLevel = 1,
  onSubmit,
  onBack,
}: TradeFormProps) {
  const [shares, setShares] = useState<string>('1');
  const [error, setError] = useState<string>('');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [limitPrice, setLimitPrice] = useState<string>(price.toFixed(2));
  const [showOrderInfo, setShowOrderInfo] = useState(false);

  const numShares = parseFloat(shares) || 0;
  const effectivePrice = orderType === 'market' ? price : (parseFloat(limitPrice) || price);
  const totalCost = numShares * effectivePrice;
  const isBuy = action === 'buy';
  const maxBuyShares = Math.floor(availableCash / effectivePrice);

  // Order types unlocked by level
  const canUseLimit = userLevel >= 3;
  const canUseStopLoss = userLevel >= 6 && !isBuy; // stop-loss is sell-side only

  const availableOrderTypes: OrderType[] = [
    'market',
    ...(canUseLimit ? ['limit' as OrderType] : []),
    ...(canUseStopLoss ? ['stop_loss' as OrderType] : []),
  ];

  const handleSharesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setShares(val);
      setError('');
    }
  };

  const handleLimitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setLimitPrice(val);
      setError('');
    }
  };

  const handleSubmit = () => {
    if (!numShares || numShares <= 0) {
      setError('Enter a valid number of shares');
      return;
    }
    if (orderType !== 'market') {
      const lp = parseFloat(limitPrice);
      if (!lp || lp <= 0) {
        setError('Enter a valid limit price');
        return;
      }
      if (orderType === 'limit' && isBuy && lp > price * 1.5) {
        setError('Limit price is far above market price — consider a market order');
        return;
      }
      if (orderType === 'stop_loss' && lp >= price) {
        setError('Stop price must be below current market price');
        return;
      }
    }
    if (isBuy && totalCost > availableCash) {
      setError(`Insufficient cash. Max ${maxBuyShares} shares at this price.`);
      return;
    }
    if (!isBuy && maxShares && numShares > maxShares) {
      setError(`You only own ${maxShares} shares of ${ticker}`);
      return;
    }
    onSubmit(numShares, orderType, orderType !== 'market' ? parseFloat(limitPrice) : undefined);
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

  const selectedOrderInfo = ORDER_TYPE_INFO[orderType];

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
        <div style={{ flex: 1 }}>
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
            Market price: ${price.toFixed(2)} / share
          </p>
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Order Type Selector — shown for Level 3+ */}
        {availableOrderTypes.length > 1 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Order Type
              </label>
              <button
                onClick={() => setShowOrderInfo(!showOrderInfo)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '2px 4px',
                }}
              >
                {showOrderInfo ? 'Hide info ↑' : 'What are these? ↓'}
              </button>
            </div>

            {showOrderInfo && (
              <div
                style={{
                  background: 'rgba(99,102,241,0.06)',
                  border: '1px solid rgba(99,102,241,0.18)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  marginBottom: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {availableOrderTypes.map((ot) => {
                  const info = ORDER_TYPE_INFO[ot];
                  return (
                    <div key={ot}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 700, color: info.color, marginBottom: '2px' }}>
                        {info.label}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                        {info.desc}
                      </p>
                    </div>
                  );
                })}
                {!canUseLimit && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
                    Limit orders unlock at Level 3. Stop-loss unlocks at Level 6.
                  </p>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${availableOrderTypes.length}, 1fr)`, gap: '8px' }}>
              {availableOrderTypes.map((ot) => {
                const info = ORDER_TYPE_INFO[ot];
                const isSelected = orderType === ot;
                return (
                  <button
                    key={ot}
                    onClick={() => { setOrderType(ot); setError(''); }}
                    style={{
                      padding: '10px 8px',
                      background: isSelected ? `${info.color}18` : 'var(--surface-elevated)',
                      border: `1px solid ${isSelected ? info.color : 'var(--border)'}`,
                      borderRadius: '10px',
                      color: isSelected ? info.color : 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {ot === 'market' ? 'Market' : ot === 'limit' ? 'Limit' : 'Stop-Loss'}
                  </button>
                );
              })}
            </div>

            {/* Info badge for selected order type */}
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5 }}>
              {selectedOrderInfo.desc}
            </p>
          </div>
        )}

        {/* Limit price input */}
        {orderType !== 'market' && (
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
              {orderType === 'limit'
                ? (isBuy ? 'Max buy price per share' : 'Min sell price per share')
                : 'Stop price (triggers sell below this)'}
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1.2rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  pointerEvents: 'none',
                }}
              >
                $
              </span>
              <input
                type="number"
                value={limitPrice}
                onChange={handleLimitPriceChange}
                step="0.01"
                min="0.01"
                className="input"
                style={{
                  paddingLeft: '28px',
                  fontSize: '1.4rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  height: '58px',
                  textAlign: 'center',
                  letterSpacing: '-0.01em',
                }}
                placeholder={price.toFixed(2)}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              {isBuy
                ? [0.95, 0.97, 0.99].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => { setLimitPrice((price * pct).toFixed(2)); setError(''); }}
                      style={{
                        flex: 1,
                        padding: '7px 4px',
                        background: 'var(--surface-elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      -{Math.round((1 - pct) * 100)}%
                    </button>
                  ))
                : [0.95, 0.90, 0.85].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => { setLimitPrice((price * pct).toFixed(2)); setError(''); }}
                      style={{
                        flex: 1,
                        padding: '7px 4px',
                        background: 'var(--surface-elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {'-' + Math.round((1 - pct) * 100)}%
                    </button>
                  ))}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              Current market price: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 600 }}>${price.toFixed(2)}</span>
              {orderType === 'limit' && (
                <span style={{ color: parseFloat(limitPrice) < price ? 'var(--success)' : 'var(--text-muted)' }}>
                  {parseFloat(limitPrice) < price
                    ? ` · ${((price - parseFloat(limitPrice)) / price * 100).toFixed(1)}% below market ✓`
                    : parseFloat(limitPrice) > price && isBuy
                    ? ' · Above market (may execute immediately)'
                    : ''}
                </span>
              )}
            </p>
          </div>
        )}

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
            onChange={handleSharesChange}
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
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {isBuy ? 'Estimated Cost' : 'You Receive'}
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
          {orderType !== 'market' && numShares > 0 && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', margin: '6px 0 0' }}>
              {orderType === 'limit'
                ? `At your limit price of $${parseFloat(limitPrice || '0').toFixed(2)}/share`
                : `Triggers if price drops to $${parseFloat(limitPrice || '0').toFixed(2)}`}
            </p>
          )}
        </div>

        {/* Beginner hint — only for first trades */}
        {userLevel <= 2 && (
          <div
            style={{
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.16)',
              borderRadius: '12px',
              padding: '12px 14px',
            }}
          >
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
              <strong style={{ color: 'var(--accent)' }}>Tip:</strong> Start with 1–5 shares to keep your risk small. You can always buy more later. Limit and Stop-Loss orders unlock at Levels 3 and 6.
            </p>
          </div>
        )}

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
