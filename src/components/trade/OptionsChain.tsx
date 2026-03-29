import { useState, useEffect } from 'react';
import type { OptionContract, OptionType } from '../../types';

interface Props {
  ticker: string;
  companyName: string;
  currentPrice: number;
  onSelect: (contract: OptionContract) => void;
}

const EXPIRATIONS = [
  { days: 7,  label: '1 Week' },
  { days: 30, label: '1 Month' },
  { days: 90, label: '3 Months' },
];

function calcOptionPremium(
  spotPrice: number,
  strikePrice: number,
  daysToExp: number,
  optionType: OptionType
): number {
  // Simplified option pricing: intrinsic + rough time value
  const intrinsic = optionType === 'call'
    ? Math.max(0, spotPrice - strikePrice)
    : Math.max(0, strikePrice - spotPrice);

  // Time value: assume ~30% annualized vol, rough approximation
  const timeValue = spotPrice * 0.30 * Math.sqrt(daysToExp / 365) * 0.4;

  return Math.max(0.01, +(intrinsic + timeValue).toFixed(2));
}

function getStrikes(spotPrice: number): number[] {
  // Generate 5 strikes: 2 below, ATM, 2 above
  const step = spotPrice > 200 ? 5 : spotPrice > 50 ? 2.5 : 1;
  const atm = Math.round(spotPrice / step) * step;
  return [
    +(atm - step * 2).toFixed(2),
    +(atm - step).toFixed(2),
    +atm.toFixed(2),
    +(atm + step).toFixed(2),
    +(atm + step * 2).toFixed(2),
  ];
}

function formatMoneyness(strike: number, spot: number, type: OptionType): string {
  const diff = spot - strike;
  if (type === 'call') {
    if (diff > 0) return 'ITM';
    if (diff < 0) return 'OTM';
    return 'ATM';
  } else {
    if (diff < 0) return 'ITM';
    if (diff > 0) return 'OTM';
    return 'ATM';
  }
}

export default function OptionsChain({ ticker, companyName, currentPrice, onSelect }: Props) {
  const [optionType, setOptionType] = useState<OptionType>('call');
  const [selectedExpiry, setSelectedExpiry] = useState(EXPIRATIONS[1]);
  const [selectedStrike, setSelectedStrike] = useState<number | null>(null);
  const [contracts, setContracts] = useState('1');

  const strikes = getStrikes(currentPrice);
  const atm = strikes[2];

  useEffect(() => {
    setSelectedStrike(atm);
  }, [atm]);

  const premium = selectedStrike !== null
    ? calcOptionPremium(currentPrice, selectedStrike, selectedExpiry.days, optionType)
    : 0;
  const totalCost = premium * 100 * (parseInt(contracts) || 1);

  const moneynessColor = (strike: number) => {
    const m = formatMoneyness(strike, currentPrice, optionType);
    if (m === 'ITM') return 'var(--success)';
    if (m === 'OTM') return 'var(--text-muted)';
    return 'var(--accent)';
  };

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
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: 'var(--accent)' }}>{ticker}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{companyName}</span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Underlying: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>${currentPrice.toFixed(2)}</span>
          {' · 1 contract = 100 shares'}
        </p>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Call / Put toggle */}
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Option Type</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {(['call', 'put'] as OptionType[]).map((ot) => (
              <button
                key={ot}
                onClick={() => setOptionType(ot)}
                style={{
                  padding: '12px',
                  background: optionType === ot
                    ? ot === 'call' ? 'var(--success-light)' : 'var(--danger-light)'
                    : 'var(--surface-elevated)',
                  border: `1px solid ${optionType === ot ? (ot === 'call' ? 'var(--success)' : 'var(--danger)') : 'var(--border)'}`,
                  borderRadius: '12px',
                  color: optionType === ot ? (ot === 'call' ? 'var(--success)' : 'var(--danger)') : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {ot === 'call' ? '▲ Call' : '▼ Put'}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5 }}>
            {optionType === 'call'
              ? 'A call gives you the right to BUY 100 shares at the strike price. Profits if stock goes UP.'
              : 'A put gives you the right to SELL 100 shares at the strike price. Profits if stock goes DOWN.'}
          </p>
        </div>

        {/* Expiration */}
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Expiration</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {EXPIRATIONS.map((exp) => (
              <button
                key={exp.days}
                onClick={() => setSelectedExpiry(exp)}
                style={{
                  padding: '10px 6px',
                  background: selectedExpiry.days === exp.days ? 'rgba(99,102,241,0.15)' : 'var(--surface-elevated)',
                  border: `1px solid ${selectedExpiry.days === exp.days ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: '10px',
                  color: selectedExpiry.days === exp.days ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {exp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Strike Prices */}
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Strike Price
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {strikes.map((strike) => {
              const m = formatMoneyness(strike, currentPrice, optionType);
              const pr = calcOptionPremium(currentPrice, strike, selectedExpiry.days, optionType);
              const isSelected = selectedStrike === strike;
              return (
                <button
                  key={strike}
                  onClick={() => setSelectedStrike(strike)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    background: isSelected ? 'rgba(99,102,241,0.12)' : 'var(--surface-elevated)',
                    border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      ${strike.toFixed(2)}
                    </span>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '999px',
                      background: m === 'ATM' ? 'rgba(99,102,241,0.15)' : m === 'ITM' ? 'var(--success-light)' : 'var(--surface)',
                      color: moneynessColor(strike),
                      border: `1px solid ${moneynessColor(strike)}40`,
                    }}>
                      {m}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      ${pr.toFixed(2)}
                    </p>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0 }}>per share</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contracts */}
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Contracts</p>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="number"
              value={contracts}
              onChange={(e) => setContracts(e.target.value)}
              min="1"
              max="99"
              className="input"
              style={{ width: '80px', fontSize: '1.2rem', fontFamily: 'var(--font-mono)', fontWeight: 600, height: '48px', textAlign: 'center' }}
            />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                × {parseInt(contracts) || 1} contracts × 100 shares × ${premium.toFixed(2)}
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: 'var(--success)', margin: '2px 0 0' }}>
                = ${totalCost.toFixed(2)} total
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={() => {
            if (selectedStrike === null) return;
            onSelect({
              underlying: ticker,
              underlyingName: companyName,
              optionType,
              strikePrice: selectedStrike,
              expirationDays: selectedExpiry.days,
              expirationLabel: selectedExpiry.label,
              premium,
              contracts: parseInt(contracts) || 1,
              underlyingPrice: currentPrice,
            });
          }}
          className="btn btn-primary btn-full"
          style={{ height: '52px', fontSize: '1rem' }}
          disabled={selectedStrike === null}
        >
          Continue to Mentor Review
        </button>
      </div>
    </div>
  );
}
