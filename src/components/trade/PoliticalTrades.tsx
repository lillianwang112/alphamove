import { useState, useEffect } from 'react';
import { getRecentPoliticalTrades, type PoliticalTrade } from '../../services/politicalTradingService';

const PARTY_COLORS: Record<string, string> = {
  Democrat: '#3B82F6',
  Republican: '#EF4444',
  D: '#3B82F6',
  R: '#EF4444',
};

function formatDate(d: string): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  } catch { return d; }
}

function TradeRow({ trade, onSelect }: { trade: PoliticalTrade; onSelect: (sym: string, name: string) => void }) {
  const isBuy = trade.type === 'Purchase';
  const isSell = trade.type.toLowerCase().includes('sale');
  const partyColor = PARTY_COLORS[trade.party] || PARTY_COLORS[trade.party.charAt(0)] || '#94A3B8';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '70px 1fr auto',
        alignItems: 'start',
        padding: '11px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
        gap: '10px',
        cursor: 'pointer',
      }}
      onClick={() => onSelect(trade.ticker, trade.assetDescription)}
    >
      {/* Left: ticker + type */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 800,
          color: isBuy ? '#22C55E' : isSell ? '#EF4444' : 'var(--text-primary)',
          background: isBuy ? 'rgba(34,197,94,0.1)' : isSell ? 'rgba(239,68,68,0.1)' : 'var(--surface-elevated)',
          padding: '2px 6px', borderRadius: '5px', textAlign: 'center',
        }}>{trade.ticker}</span>
        <span style={{
          fontSize: '0.6rem', fontWeight: 700, color: isBuy ? '#22C55E' : '#EF4444',
          textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center',
        }}>{isBuy ? 'BUY' : 'SELL'}</span>
      </div>

      {/* Center: politician info */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
          <span style={{
            fontSize: '0.58rem', fontWeight: 800, color: partyColor,
            background: `${partyColor}18`, border: `1px solid ${partyColor}30`,
            borderRadius: '3px', padding: '1px 4px', flexShrink: 0,
          }}>{trade.party.charAt(0)}</span>
          <span style={{
            fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{trade.politician}</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{trade.chamber}</span>
          {trade.owner !== 'Self' && (
            <span style={{
              fontSize: '0.6rem', color: '#F59E0B', background: 'rgba(245,158,11,0.1)',
              borderRadius: '4px', padding: '1px 5px', fontWeight: 700,
            }}>{trade.owner}</span>
          )}
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Filed {formatDate(trade.filedDate)}</span>
        </div>
      </div>

      {/* Right: amount + date */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          {trade.amount}
        </div>
        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          {formatDate(trade.transactionDate)}
        </div>
      </div>
    </div>
  );
}

export default function PoliticalTrades({
  ticker,
  onSelect,
}: {
  ticker?: string;
  onSelect: (sym: string, name: string) => void;
}) {
  const [trades, setTrades] = useState<PoliticalTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [chamber, setChamber] = useState<'all' | 'House' | 'Senate'>('all');

  useEffect(() => {
    setLoading(true);
    getRecentPoliticalTrades({ ticker, chamber, limit: 25 })
      .then(setTrades)
      .catch(() => setTrades([]))
      .finally(() => setLoading(false));
  }, [ticker, chamber]);

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 14px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div className="section-label" style={{ marginBottom: 0 }}>
            🏛 Political Trades
          </div>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Public disclosure data
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0' }}>
          {(['all', 'House', 'Senate'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setChamber(c)}
              style={{
                flex: 1, padding: '7px 4px', background: 'none', border: 'none',
                borderBottom: chamber === c ? '2px solid var(--accent)' : '2px solid transparent',
                color: chamber === c ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
              }}
            >{c === 'all' ? 'All' : c}</button>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '16px' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '56px', borderRadius: '8px', marginBottom: '6px' }} />
            ))}
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
              Loading congressional disclosures…
            </p>
          </div>
        ) : trades.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            No trades found
          </div>
        ) : (
          trades.map((trade) => (
            <TradeRow key={trade.id} trade={trade} onSelect={onSelect} />
          ))
        )}
      </div>
    </div>
  );
}
