import { useState } from 'react';

export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
export type TimeInForce = 'day' | 'gtc' | 'day_ext' | 'ioc' | 'fok';

interface TradeFormProps {
  action: 'buy' | 'sell';
  ticker: string;
  price: number;
  availableCash: number;
  maxShares?: number;
  userLevel?: number;
  simulationMode?: boolean;
  onSubmit: (shares: number, orderType: OrderType, limitPrice?: number, timeInForce?: TimeInForce, trailingPct?: number) => void;
  onBack?: () => void;
}

interface OrderTypeConfig {
  label: string;
  shortLabel: string;
  desc: string;
  minLevel: number;
  sides: ('buy' | 'sell' | 'both')[];
}

const ORDER_CONFIGS: Record<OrderType, OrderTypeConfig> = {
  market: {
    label: 'Market Order',
    shortLabel: 'Market',
    desc: 'Execute immediately at the best available price. Fastest execution, no price guarantee.',
    minLevel: 1,
    sides: ['both'],
  },
  limit: {
    label: 'Limit Order',
    shortLabel: 'Limit',
    desc: 'Only execute at your specified price or better. You control the price, not the timing.',
    minLevel: 3,
    sides: ['both'],
  },
  stop: {
    label: 'Stop (Market)',
    shortLabel: 'Stop',
    desc: 'Once price hits your stop, a market order fires. Used to limit losses or lock in gains.',
    minLevel: 4,
    sides: ['both'],
  },
  stop_limit: {
    label: 'Stop Limit',
    shortLabel: 'Stop Lmt',
    desc: 'Like a stop, but executes as a limit order. More control but may not fill if price gaps.',
    minLevel: 5,
    sides: ['both'],
  },
  trailing_stop: {
    label: 'Trailing Stop',
    shortLabel: 'Trail %',
    desc: 'Stop price moves with the market — e.g. 5% trailing means it sells if price drops 5% from peak.',
    minLevel: 6,
    sides: ['sell'],
  },
};

interface TIFConfig {
  label: string;
  shortLabel: string;
  desc: string;
  minLevel: number;
}

const TIF_CONFIGS: Record<TimeInForce, TIFConfig> = {
  day: {
    label: 'Day',
    shortLabel: 'Day',
    desc: 'Order expires at end of market hours today.',
    minLevel: 1,
  },
  gtc: {
    label: 'Good Till Cancelled',
    shortLabel: 'GTC',
    desc: 'Order stays active until you cancel it (up to 90 days).',
    minLevel: 3,
  },
  day_ext: {
    label: 'Day + Extended Hours',
    shortLabel: 'Day+Ext',
    desc: 'Active during regular hours AND pre/post-market sessions.',
    minLevel: 4,
  },
  ioc: {
    label: 'Immediate or Cancel',
    shortLabel: 'IOC',
    desc: 'Fill as much as possible right now, cancel the rest immediately.',
    minLevel: 5,
  },
  fok: {
    label: 'Fill or Kill',
    shortLabel: 'FOK',
    desc: 'Fill the entire order immediately or cancel all of it. No partial fills.',
    minLevel: 6,
  },
};

export default function TradeForm({
  action,
  ticker,
  price,
  availableCash,
  maxShares,
  userLevel = 1,
  simulationMode = false,
  onSubmit,
  onBack,
}: TradeFormProps) {
  const [shares, setShares] = useState<string>('1');
  const [error, setError] = useState<string>('');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [timeInForce, setTimeInForce] = useState<TimeInForce>('day');
  const [limitPrice, setLimitPrice] = useState<string>(price.toFixed(2));
  const [stopPrice, setStopPrice] = useState<string>((price * 0.95).toFixed(2));
  const [stopLimitPrice, setStopLimitPrice] = useState<string>((price * 0.94).toFixed(2));
  const [trailingPct, setTrailingPct] = useState<string>('5');
  const [expandOrderInfo, setExpandOrderInfo] = useState(false);
  const [expandTIF, setExpandTIF] = useState(false);

  const isBuy = action === 'buy';
  const numShares = parseFloat(shares) || 0;
  const effectivePrice = orderType === 'limit' ? (parseFloat(limitPrice) || price)
    : orderType === 'stop_limit' ? (parseFloat(stopLimitPrice) || price)
    : price;
  const totalCost = numShares * effectivePrice;
  const maxBuyShares = Math.floor(availableCash / effectivePrice);

  const availableOrderTypes = (Object.entries(ORDER_CONFIGS) as [OrderType, OrderTypeConfig][]).filter(
    ([, cfg]) => userLevel >= cfg.minLevel && (cfg.sides.includes('both') || cfg.sides.includes(action))
  );

  const availableTIF = (Object.entries(TIF_CONFIGS) as [TimeInForce, TIFConfig][]).filter(
    ([, cfg]) => userLevel >= cfg.minLevel
  );

  const handleSubmit = () => {
    if (!numShares || numShares <= 0) { setError('Enter a valid number of shares'); return; }
    if (orderType === 'limit' || orderType === 'stop_limit') {
      const lp = parseFloat(limitPrice);
      if (!lp || lp <= 0) { setError('Enter a valid limit price'); return; }
    }
    if (orderType === 'stop' || orderType === 'stop_limit') {
      const sp = parseFloat(stopPrice);
      if (!sp || sp <= 0) { setError('Enter a valid stop price'); return; }
    }
    if (orderType === 'trailing_stop') {
      const tp = parseFloat(trailingPct);
      if (!tp || tp <= 0 || tp > 99) { setError('Enter a trailing % between 0.1 and 99'); return; }
    }
    if (isBuy && totalCost > availableCash) {
      setError(`Exceeds budget by $${(totalCost - availableCash).toFixed(2)}`); return;
    }
    if (!isBuy && maxShares && numShares > maxShares) {
      setError(`You only own ${maxShares} shares of ${ticker}`); return;
    }
    const lp = (orderType === 'limit' || orderType === 'stop_limit') ? parseFloat(limitPrice) : undefined;
    const tp = orderType === 'trailing_stop' ? parseFloat(trailingPct) : undefined;
    onSubmit(numShares, orderType, lp, timeInForce, tp);
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
  const isOverHolding = !isBuy && maxShares !== undefined && numShares > maxShares;
  const isInvalid = !numShares || numShares <= 0 || isOverBudget || isOverHolding;

  const selectedOrderCfg = ORDER_CONFIGS[orderType];
  const selectedTIFCfg = TIF_CONFIGS[timeInForce];

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
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onBack && (
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ padding: '2px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: isBuy ? 'var(--success-light)' : 'var(--danger-light)', color: isBuy ? 'var(--success)' : 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {action}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent)' }}>{ticker}</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Market price: ${price.toFixed(2)} / share</p>
        </div>
      </div>

      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* ── ORDER TYPE ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Type</label>
            <button onClick={() => setExpandOrderInfo(!expandOrderInfo)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
              {expandOrderInfo ? 'Less ↑' : 'Explain ↓'}
            </button>
          </div>

          {expandOrderInfo && (
            <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', padding: '12px', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {availableOrderTypes.map(([ot, cfg]) => (
                <div key={ot}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '2px' }}>{cfg.label}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{cfg.desc}</p>
                </div>
              ))}
              {userLevel < 6 && (
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                  More order types unlock as you level up: Stop (Lv4), Stop Limit (Lv5), Trailing Stop (Lv6)
                </p>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(availableOrderTypes.length, 3)}, 1fr)`, gap: '6px' }}>
            {availableOrderTypes.map(([ot, cfg]) => (
              <button
                key={ot}
                onClick={() => { setOrderType(ot); setError(''); }}
                style={{
                  padding: '10px 4px',
                  background: orderType === ot ? 'rgba(99,102,241,0.15)' : 'var(--surface-elevated)',
                  border: `1px solid ${orderType === ot ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: '10px',
                  color: orderType === ot ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: '0.73rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  WebkitTapHighlightColor: 'transparent',
                  lineHeight: 1.2,
                }}
              >
                {cfg.shortLabel}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.5 }}>
            {selectedOrderCfg.desc}
          </p>
        </div>

        {/* ── PRICE INPUTS (conditional on order type) ── */}
        {(orderType === 'limit') && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              {isBuy ? 'Max Buy Price' : 'Min Sell Price'}
            </label>
            <PriceInput value={limitPrice} onChange={setLimitPrice} />
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              {(isBuy ? [0.99, 0.97, 0.95] : [1.01, 1.03, 1.05]).map((mult) => (
                <button key={mult} onClick={() => setLimitPrice((price * mult).toFixed(2))} style={presetBtnStyle}>
                  {mult < 1 ? `-${((1-mult)*100).toFixed(0)}%` : `+${((mult-1)*100).toFixed(0)}%`}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Market: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>${price.toFixed(2)}</span>
              {parseFloat(limitPrice) < price && isBuy && <span style={{ color: 'var(--success)' }}> · {((price - parseFloat(limitPrice)) / price * 100).toFixed(1)}% below ✓</span>}
            </p>
          </div>
        )}

        {(orderType === 'stop' || orderType === 'stop_limit') && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Stop Price {orderType === 'stop_limit' ? '(Trigger)' : ''}
            </label>
            <PriceInput value={stopPrice} onChange={setStopPrice} />
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              {[0.95, 0.90, 0.85].map((mult) => (
                <button key={mult} onClick={() => setStopPrice((price * mult).toFixed(2))} style={presetBtnStyle}>
                  -{((1-mult)*100).toFixed(0)}%
                </button>
              ))}
            </div>
          </div>
        )}

        {orderType === 'stop_limit' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Limit Price (Execution)
            </label>
            <PriceInput value={stopLimitPrice} onChange={setStopLimitPrice} />
            <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Triggers at ${stopPrice}, then tries to fill at ${stopLimitPrice} or better
            </p>
          </div>
        )}

        {orderType === 'trailing_stop' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Trail Distance (%)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                value={trailingPct}
                onChange={(e) => setTrailingPct(e.target.value)}
                min="0.1" max="99" step="0.5"
                className="input"
                style={{ fontSize: '1.4rem', fontFamily: 'var(--font-mono)', fontWeight: 600, height: '56px', textAlign: 'center', paddingRight: '36px' }}
              />
              <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem', color: 'var(--text-secondary)', pointerEvents: 'none', fontWeight: 700 }}>%</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              {[2, 5, 10, 15].map((pct) => (
                <button key={pct} onClick={() => setTrailingPct(String(pct))} style={presetBtnStyle}>{pct}%</button>
              ))}
            </div>
            <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Current stop: ~${(price * (1 - parseFloat(trailingPct || '5') / 100)).toFixed(2)} · moves up as price rises
            </p>
          </div>
        )}

        {/* ── TIME IN FORCE ── */}
        {availableTIF.length > 1 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timing</label>
              <button onClick={() => setExpandTIF(!expandTIF)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                {expandTIF ? 'Less ↑' : 'Explain ↓'}
              </button>
            </div>

            {expandTIF && (
              <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', padding: '12px', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {availableTIF.map(([tif, cfg]) => (
                  <div key={tif}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '2px' }}>{cfg.label}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{cfg.desc}</p>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {availableTIF.map(([tif, cfg]) => (
                <button
                  key={tif}
                  onClick={() => setTimeInForce(tif)}
                  style={{
                    padding: '8px 12px',
                    background: timeInForce === tif ? 'rgba(99,102,241,0.15)' : 'var(--surface-elevated)',
                    border: `1px solid ${timeInForce === tif ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: '8px',
                    color: timeInForce === tif ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {cfg.shortLabel}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '6px' }}>{selectedTIFCfg.desc}</p>
          </div>
        )}

        {/* ── AVAILABLE CASH / HOLDINGS ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--surface-elevated)', borderRadius: '12px', padding: '12px 14px' }}>
          {isBuy ? (
            <>
              <div>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Cash Available</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--success)' }}>${availableCash.toFixed(2)}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Max Shares</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{maxBuyShares}</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>You Own</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{maxShares ?? 0} shares</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Value</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>${((maxShares ?? 0) * price).toFixed(2)}</p>
              </div>
            </>
          )}
        </div>

        {/* ── SHARES INPUT ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Shares</label>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Decimals OK — e.g. 0.5 shares</span>
          </div>
          <input
            type="number"
            value={shares}
            onChange={(e) => { const v = e.target.value; if (v === '' || /^\d*\.?\d*$/.test(v)) { setShares(v); setError(''); } }}
            min="0.0001" step="0.01"
            className="input"
            style={{ fontSize: '1.5rem', fontFamily: 'var(--font-mono)', fontWeight: 600, height: '60px', textAlign: 'center', borderColor: (isOverBudget || isOverHolding) ? 'var(--danger)' : undefined }}
            placeholder="0"
          />
          {quickAmounts.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${quickAmounts.length}, 1fr)`, gap: '6px', marginTop: '8px' }}>
              {quickAmounts.map((qa) => (
                <button key={qa.label} onClick={() => { setShares(String(qa.shares)); setError(''); }} disabled={qa.shares === 0} style={{ ...presetBtnStyle, padding: '9px 4px' }}>
                  {qa.label}
                </button>
              ))}
            </div>
          )}
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '8px' }}>⚠ {error}</p>}
          {isOverBudget && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '6px', lineHeight: 1.5 }}>
              Try decreasing shares or use a decimal — e.g.{' '}
              <button
                onClick={() => { setShares((availableCash / effectivePrice).toFixed(4)); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
              >
                {(availableCash / effectivePrice).toFixed(4)} shares
              </button>
              {' '}(uses all cash)
            </p>
          )}
        </div>

        {/* ── TOTAL ── */}
        <div style={{
          background: isOverBudget ? 'var(--danger-light)' : isBuy ? 'var(--success-light)' : 'var(--warning-light)',
          border: `1px solid ${isOverBudget ? 'rgba(239,68,68,0.3)' : isBuy ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
          borderRadius: '12px', padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {isBuy ? 'Estimated Cost' : 'You Receive'}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, color: isOverBudget ? 'var(--danger)' : isBuy ? 'var(--success)' : 'var(--warning)' }}>
              ${totalCost.toFixed(2)}
            </span>
          </div>
          {orderType !== 'market' && numShares > 0 && (
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {orderType === 'trailing_stop' ? `Initial stop ~$${(price * (1 - parseFloat(trailingPct || '5') / 100)).toFixed(2)}` : ''}
              {orderType === 'stop' ? `Triggers at $${stopPrice}` : ''}
              {orderType === 'stop_limit' ? `Triggers at $${stopPrice} · limit $${stopLimitPrice}` : ''}
            </p>
          )}
        </div>

        {/* ── SUBMIT ── */}
        <button
          onClick={handleSubmit}
          disabled={!!isInvalid}
          className={`btn btn-full ${isBuy ? 'btn-success' : 'btn-danger'}`}
          style={{ fontSize: '1rem', height: '52px' }}
        >
          {isInvalid && numShares > 0
            ? isBuy ? `Exceeds budget by $${(totalCost - availableCash).toFixed(2)}` : 'Invalid amount'
            : simulationMode ? 'Review & Confirm' : 'Continue to Mentor Review'}
        </button>
      </div>
    </div>
  );
}

// ── Shared sub-components ──

const presetBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 4px',
  background: 'var(--surface-elevated)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text-secondary)',
  fontSize: '0.75rem',
  fontWeight: 600,
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
};

function PriceInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', pointerEvents: 'none' }}>$</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step="0.01" min="0.01"
        className="input"
        style={{ paddingLeft: '28px', fontSize: '1.4rem', fontFamily: 'var(--font-mono)', fontWeight: 600, height: '56px', textAlign: 'center' }}
      />
    </div>
  );
}
