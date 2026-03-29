import type { Portfolio, Position } from '../../types';
import PortfolioSummary from './PortfolioSummary';
import PortfolioCharts from './PortfolioCharts';
import PositionCard from './PositionCard';

interface PortfolioDashboardProps {
  portfolio: Portfolio | null;
  positions: Position[];
  loading: boolean;
  onSell: (position: Position) => void;
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="skeleton" style={{ width: '60px', height: '20px' }} />
          <div className="skeleton" style={{ width: '120px', height: '14px' }} />
        </div>
        <div className="skeleton" style={{ width: '80px', height: '32px' }} />
      </div>
      <div className="skeleton" style={{ width: '100%', height: '48px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="skeleton" style={{ width: '100px', height: '20px' }} />
        <div className="skeleton" style={{ width: '60px', height: '32px' }} />
      </div>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div className="skeleton" style={{ width: '140px', height: '14px' }} />
      <div className="skeleton" style={{ width: '200px', height: '40px' }} />
      <div style={{ height: '1px', background: 'var(--border)' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="skeleton" style={{ width: '40px', height: '12px' }} />
          <div className="skeleton" style={{ width: '80px', height: '20px' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="skeleton" style={{ width: '60px', height: '12px' }} />
          <div className="skeleton" style={{ width: '100px', height: '20px' }} />
        </div>
      </div>
    </div>
  );
}

export default function PortfolioDashboard({
  portfolio,
  positions,
  loading,
  onSell,
}: PortfolioDashboardProps) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <SummarySkeleton />
        <div style={{ marginTop: '8px' }}>
          <div className="skeleton" style={{ width: '100px', height: '18px', marginBottom: '12px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 24px',
          textAlign: 'center',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '3rem' }}>📊</span>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}>
          Unable to load portfolio
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Check your connection and try again.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Summary */}
      <PortfolioSummary portfolio={portfolio} />

      {/* Charts — allocation + P&L breakdown */}
      <PortfolioCharts portfolio={portfolio} positions={positions} />

      {/* Positions */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            Positions
          </h3>
          {positions.length > 0 && (
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                background: 'var(--surface)',
                padding: '3px 10px',
                borderRadius: '999px',
                border: '1px solid var(--border)',
              }}
            >
              {positions.length} holding{positions.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {positions.length === 0 ? (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '40px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}
            >
              📈
            </div>
            <div>
              <p
                style={{
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  marginBottom: '6px',
                }}
              >
                No positions yet
              </p>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                }}
              >
                Make your first trade to start building
                <br />
                your portfolio.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {positions.map((position) => (
              <PositionCard
                key={position.id}
                position={position}
                onSell={onSell}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
