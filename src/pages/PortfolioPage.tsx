import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePortfolio } from '../hooks/usePortfolio';
import { useTrade } from '../hooks/useTrade';
import PortfolioDashboard from '../components/portfolio/PortfolioDashboard';
import type { Position } from '../types';
import { useEffect, useState } from 'react';

export default function PortfolioPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { portfolio, positions, loading, refreshPrices } = usePortfolio(user?.uid ?? '');
  const { fetchRecentTrades } = useTrade();
  const [recentTrades, setRecentTrades] = useState<Awaited<ReturnType<typeof fetchRecentTrades>>>([]);
  const [tradesLoading, setTradesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    setTradesLoading(true);
    fetchRecentTrades(user.uid)
      .then(setRecentTrades)
      .catch(console.error)
      .finally(() => setTradesLoading(false));
  }, [fetchRecentTrades, user?.uid]);

  const handleSell = (position: Position) => {
    // Navigate to trade page with sell pre-selected
    navigate(`/trade?ticker=${position.ticker}&action=sell&shares=${position.shares}`);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshPrices();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'slideInUp 0.4s ease both' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Portfolio
        </h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 14px',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              animation: refreshing ? 'spin 0.8s linear infinite' : 'none',
            }}
          >
            <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C14.8273 3 17.35 4.30367 19 6.34267" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M21 3V7H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Dashboard */}
      <div style={{ animation: 'slideInUp 0.4s ease both', animationDelay: '0.05s' }}>
        <PortfolioDashboard
          portfolio={portfolio}
          positions={positions}
          loading={loading}
          onSell={handleSell}
        />
      </div>

      {/* Recent trades */}
      <div style={{ animation: 'slideInUp 0.4s ease both', animationDelay: '0.1s' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          Recent Trades
        </h3>

        {tradesLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <div className="skeleton" style={{ height: '14px', width: '80px' }} />
                <div className="skeleton" style={{ height: '12px', width: '140px' }} />
              </div>
            ))}
          </div>
        ) : recentTrades.length === 0 ? (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px 20px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
              No trades yet. Make your first move!
            </p>
            <button
              onClick={() => navigate('/trade')}
              className="btn btn-primary btn-sm"
              style={{ marginTop: '12px' }}
            >
              Trade Now
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentTrades.slice(0, 5).map((trade) => {
              const isBuy = trade.action === 'buy';
              return (
                <div
                  key={trade.id}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    {/* Action indicator */}
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: isBuy ? 'var(--success-light)' : 'var(--danger-light)',
                        border: `1px solid ${isBuy ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        color: isBuy ? 'var(--success)' : 'var(--danger)',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {isBuy ? '↑' : '↓'}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent)' }}>
                          {trade.ticker}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {trade.action} · {trade.shares} shares
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        {trade.moveRating && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              padding: '1px 6px',
                              borderRadius: '999px',
                              background: 'var(--surface-elevated)',
                              color: 'var(--text-muted)',
                              border: '1px solid var(--border)',
                              textTransform: 'capitalize',
                            }}
                          >
                            {trade.moveRating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      ${trade.totalValue.toFixed(2)}
                    </p>
                    {trade.xpEarned > 0 && (
                      <p style={{ fontSize: '0.7rem', color: 'var(--xp-gold)', fontWeight: 600, margin: 0 }}>
                        +{trade.xpEarned} XP
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
