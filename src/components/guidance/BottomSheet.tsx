import { useEffect } from 'react';
import type { ReactNode } from 'react';

interface BottomSheetProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}

export default function BottomSheet({
  open,
  title,
  subtitle,
  onClose,
  children,
}: BottomSheetProps) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 6, 12, 0.68)',
        zIndex: 180,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 'var(--app-max-width)',
          background: 'linear-gradient(180deg, rgba(24, 25, 38, 0.98) 0%, rgba(13, 14, 24, 0.98) 100%)',
          border: '1px solid var(--border-strong)',
          borderRadius: '24px 24px 18px 18px',
          boxShadow: 'var(--shadow-lg)',
          padding: '14px 16px 20px',
          maxHeight: '82vh',
          overflowY: 'auto',
          animation: 'slideInUp 0.28s ease both',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ width: '40px', height: '4px', borderRadius: '999px', background: 'var(--border-strong)', margin: '0 auto 14px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: subtitle ? '4px' : 0 }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
