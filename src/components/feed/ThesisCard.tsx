import { useState } from 'react';
import type { PublicThesis, ReactionType } from '../../types';
import { toggleReaction } from '../../services/feedService';

interface ThesisCardProps {
  thesis: PublicThesis;
  currentUid: string;
}

const RATING_COLORS: Record<string, string> = {
  brilliant: '#26C2A3',
  great: '#6366F1',
  good: '#22C55E',
  inaccuracy: '#F59E0B',
  mistake: '#F97316',
  blunder: '#EF4444',
};

const RATING_ICONS: Record<string, string> = {
  brilliant: '✦',
  great: '↑',
  good: '✓',
  inaccuracy: '?!',
  mistake: '?',
  blunder: '??',
};

function timeAgo(ts: { toMillis(): number }): string {
  const diff = Date.now() - ts.toMillis();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'agree', emoji: '👍', label: 'Agree' },
  { type: 'interesting', emoji: '🤔', label: 'Interesting' },
  { type: 'learned', emoji: '💡', label: 'Learned' },
];

export default function ThesisCard({ thesis, currentUid }: ThesisCardProps) {
  const [counts, setCounts] = useState(thesis.reactionCounts);
  const [myReaction, setMyReaction] = useState<ReactionType | null>(
    (thesis.reactions[currentUid] as ReactionType) || null
  );
  const [expanded, setExpanded] = useState(false);
  const [reacting, setReacting] = useState(false);

  const isAI = thesis.isAIGenerated;
  const ratingColor = thesis.moveRating ? (RATING_COLORS[thesis.moveRating] ?? '#94A3B8') : '#94A3B8';
  const ratingIcon = thesis.moveRating ? (RATING_ICONS[thesis.moveRating] ?? '·') : '·';

  const handleReact = async (reaction: ReactionType) => {
    if (reacting || thesis.uid === currentUid) return;
    setReacting(true);
    const newCounts = { ...counts };
    const old = myReaction;
    if (old) newCounts[old] = Math.max(0, newCounts[old] - 1);
    if (old !== reaction) {
      newCounts[reaction] = (newCounts[reaction] ?? 0) + 1;
      setMyReaction(reaction);
    } else {
      setMyReaction(null);
    }
    setCounts(newCounts);
    try {
      await toggleReaction(thesis.id, currentUid, reaction);
    } catch {
      // revert on error
      setCounts(counts);
      setMyReaction(old);
    } finally {
      setReacting(false);
    }
  };

  const isLong = thesis.thesis.length > 180;

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: `1px solid ${isAI ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
        borderRadius: '16px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* AI gradient top border */}
      {isAI && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, #4F46E5, #7C3AED)',
        }} />
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* Ticker badge */}
        <span style={{
          background: thesis.action === 'buy' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
          color: thesis.action === 'buy' ? '#22C55E' : '#EF4444',
          border: `1px solid ${thesis.action === 'buy' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
          borderRadius: '6px',
          padding: '2px 8px',
          fontSize: '0.75rem',
          fontWeight: 800,
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.04em',
        }}>
          {thesis.action.toUpperCase()} {thesis.ticker}
        </span>

        {/* Company name */}
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, flex: 1 }}>
          {thesis.companyName}
        </span>

        {/* Move rating badge */}
        {thesis.moveRating && (
          <span style={{
            background: `${ratingColor}18`,
            color: ratingColor,
            border: `1px solid ${ratingColor}40`,
            borderRadius: '6px',
            padding: '2px 7px',
            fontSize: '0.68rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'capitalize',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            flexShrink: 0,
          }}>
            <span>{ratingIcon}</span>
            {thesis.moveRating}
          </span>
        )}
      </div>

      {/* Thesis text */}
      <div>
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--text-primary)',
          lineHeight: 1.6,
          margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: expanded ? 'unset' : 4,
          WebkitBoxOrient: 'vertical',
          overflow: expanded ? 'visible' : 'hidden',
        }}>
          {thesis.thesis}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'none', border: 'none', color: 'var(--accent)',
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
              padding: '4px 0 0', marginTop: '2px',
            }}
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        {/* Author */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isAI ? (
            <span style={{
              width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px',
            }}>♟</span>
          ) : (
            <span style={{
              width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700,
            }}>
              {thesis.displayName.charAt(0).toUpperCase()}
            </span>
          )}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {isAI ? 'Alpha · AI Example' : thesis.displayName}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', opacity: 0.6 }}>
            · {timeAgo(thesis.createdAt)}
          </span>
        </div>

        {/* Reactions */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {REACTIONS.map(({ type, emoji }) => {
            const count = counts[type] ?? 0;
            const active = myReaction === type;
            const canReact = thesis.uid !== currentUid;
            return (
              <button
                key={type}
                onClick={() => canReact && handleReact(type)}
                title={canReact ? type : "Can't react to your own thesis"}
                style={{
                  display: 'flex', alignItems: 'center', gap: '3px',
                  background: active ? 'var(--accent-light)' : 'var(--surface-elevated)',
                  border: `1px solid ${active ? 'var(--border-accent)' : 'var(--border)'}`,
                  borderRadius: '999px',
                  padding: '3px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  cursor: canReact ? 'pointer' : 'default',
                  transition: 'all 0.15s',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{ fontSize: '0.8rem' }}>{emoji}</span>
                {count > 0 && <span>{count}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
