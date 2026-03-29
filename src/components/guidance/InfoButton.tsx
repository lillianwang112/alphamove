interface InfoButtonProps {
  label?: string;
  onClick: () => void;
}

export default function InfoButton({ label = 'Why this matters', onClick }: InfoButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 8px',
        borderRadius: '999px',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        color: 'var(--text-secondary)',
        fontSize: '0.72rem',
        fontWeight: 600,
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span
        style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: 'var(--accent-light)',
          color: 'var(--accent)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.68rem',
          fontWeight: 700,
        }}
      >
        ?
      </span>
      {label}
    </button>
  );
}
