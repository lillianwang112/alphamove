import { useState } from 'react';
import type { MoveRating } from '../../types';
import MoveRatingBadge from './MoveRatingBadge';
import InfoButton from '../guidance/InfoButton';
import BottomSheet from '../guidance/BottomSheet';

interface PostTradeCardProps {
  analysis: string;
  moveRating: MoveRating;
  xpEarned: number;
  xpReason: string;
  betterMove: string | null;
  ticker?: string;
  action?: string;
  onDone: () => void;
}

const RATING_EMOJI: Record<MoveRating, string> = {
  brilliant: '✦✦ Brilliant', great: '✦ Great', good: '◆ Good',
  inaccuracy: '⚠ Inaccuracy', mistake: '✖ Mistake', blunder: '?? Blunder',
};

export default function PostTradeCard({
  analysis, moveRating, xpEarned, xpReason, betterMove, ticker, action, onDone,
}: PostTradeCardProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const isPositiveRating = moveRating === 'brilliant' || moveRating === 'great' || moveRating === 'good';

  const handleShare = () => {
    const text = [
      '♟ AlphaMove Move Review',
      ticker && action ? `${ticker} · ${action.charAt(0).toUpperCase() + action.slice(1)} · +${xpEarned} XP` : `+${xpEarned} XP`,
      `Rating: ${RATING_EMOJI[moveRating]}`,
      `"${analysis}"`,
      '#AlphaMove',
    ].join('\n');
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        animation: 'slideInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-elevated)',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--accent)',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 0,
            }}
          >
            Chess Engine Analysis
          </p>
          <InfoButton label="Move rating" onClick={() => setOpen(true)} />
        </div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Move Evaluated
        </h3>
      </div>

      {/* Badge */}
      <div
        style={{
          padding: '28px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <MoveRatingBadge rating={moveRating} xpEarned={xpEarned} />
      </div>

      {/* Analysis */}
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span
            style={{
              width: '4px',
              height: '20px',
              background: 'var(--accent)',
              borderRadius: '2px',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
            Analysis
          </p>
        </div>
        <p
          style={{
            fontSize: '0.925rem',
            color: 'var(--text-primary)',
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          {analysis}
        </p>
      </div>

      {/* Better move suggestion */}
      {betterMove && !isPositiveRating && (
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'rgba(99, 102, 241, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span
              style={{
                fontSize: '1.25rem',
                flexShrink: 0,
                marginTop: '2px',
              }}
            >
              💡
            </span>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Stronger Move
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {betterMove}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* XP breakdown */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--xp-gold-light)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>⚡</span>
        <div>
          <p
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--xp-gold)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '4px',
            }}
          >
            +{xpEarned} XP Earned
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            {xpReason}
          </p>
        </div>
      </div>

      {/* Share + Done */}
      <div style={{ padding: '16px 20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={handleShare}
          className="btn btn-ghost"
          style={{ fontSize: '0.85rem', height: '52px', flexShrink: 0, color: copied ? 'var(--success)' : 'var(--text-muted)' }}
        >
          {copied ? '✓ Copied' : '↗ Share'}
        </button>
        <button
          onClick={onDone}
          className="btn btn-primary btn-full"
          style={{ fontSize: '1rem', height: '52px' }}
        >
          Done
        </button>
      </div>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Move rating"
        subtitle="The rating judges the quality of your reasoning, not whether the stock happened to go up today."
      >
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
          “Brilliant” or “blunder” is AlphaMove shorthand for how strong the thesis, timing, and risk control looked together. You can earn a modest rating on a winning trade if the reasoning was weak, and a solid rating on a loser if the process was sound.
        </p>
      </BottomSheet>
    </div>
  );
}
