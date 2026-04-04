import { useState, useEffect } from 'react';
import { addAlert, getAlerts, deleteAlert, type PriceAlert } from '../../services/alertService';

interface PriceAlertButtonProps {
  ticker: string;
  companyName: string;
  currentPrice: number;
  uid: string;
}

export default function PriceAlertButton({ ticker, companyName, currentPrice, uid }: PriceAlertButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [targetPrice, setTargetPrice] = useState(currentPrice.toFixed(2));
  const [direction, setDirection] = useState<'above' | 'below'>(
    currentPrice > 0 ? 'above' : 'below'
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (showModal) {
      getAlerts(uid).then(all => setAlerts(all.filter(a => a.ticker === ticker)));
    }
  }, [showModal, uid, ticker]);

  const handleAdd = async () => {
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) return;
    setSaving(true);
    try {
      await addAlert(uid, { ticker, companyName, targetPrice: price, direction, currentPriceAtSet: currentPrice });
      const updated = await getAlerts(uid);
      setAlerts(updated.filter(a => a.ticker === ticker));
      setTargetPrice(currentPrice.toFixed(2));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteAlert(uid, id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const existingCount = alerts.length;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          width: '100%', padding: '11px', borderRadius: '10px',
          background: existingCount > 0 ? 'rgba(245,158,11,0.1)' : 'transparent',
          border: `1px solid ${existingCount > 0 ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
          color: existingCount > 0 ? '#F59E0B' : 'var(--text-secondary)',
          fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          transition: 'all 0.15s',
        }}
      >
        🔔 {existingCount > 0 ? `${existingCount} Alert${existingCount !== 1 ? 's' : ''} Set` : 'Set Price Alert'}
      </button>

      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: 'var(--surface-elevated)', borderRadius: '20px 20px 0 0',
              padding: '20px', width: '100%', maxWidth: '480px',
              border: '1px solid var(--border)', borderBottom: 'none',
              maxHeight: '80vh', overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>🔔 Price Alert — {ticker}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Current price: <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>${currentPrice.toFixed(2)}</span>
            </p>

            {/* Direction toggle */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {(['above', 'below'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '8px',
                    background: direction === d ? (d === 'above' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)') : 'var(--surface)',
                    border: `1px solid ${direction === d ? (d === 'above' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)') : 'var(--border)'}`,
                    color: direction === d ? (d === 'above' ? '#22C55E' : '#EF4444') : 'var(--text-muted)',
                    fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                  }}
                >{d === 'above' ? '▲ Above' : '▼ Below'}</button>
              ))}
            </div>

            {/* Price input */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="number"
                value={targetPrice}
                onChange={e => setTargetPrice(e.target.value)}
                step="0.01"
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: '8px',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', fontSize: '1rem', fontFamily: 'var(--font-mono)',
                  fontWeight: 700, outline: 'none',
                }}
              />
              <button
                onClick={handleAdd}
                disabled={saving}
                style={{
                  padding: '10px 18px', borderRadius: '8px', border: 'none',
                  background: 'var(--gradient-primary)', color: 'white',
                  fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                }}
              >{saving ? '…' : 'Set'}</button>
            </div>

            {/* Existing alerts */}
            {alerts.length > 0 && (
              <div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Alerts</p>
                {alerts.map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface)', borderRadius: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.82rem', color: a.direction === 'above' ? '#22C55E' : '#EF4444', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {a.direction === 'above' ? '▲' : '▼'} ${a.targetPrice.toFixed(2)}
                    </span>
                    <button onClick={() => handleDelete(a.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
