import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchFeed, fetchLeaderboard, publishAIThesis } from '../services/feedService';
import type { PublicThesis } from '../types';
import type { LeaderboardEntry } from '../services/feedService';
import ThesisCard from '../components/feed/ThesisCard';

type FeedTab = 'latest' | 'top' | 'leaderboard';

const POPULAR_TICKERS = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'META', 'AMZN', 'GOOGL', 'SPY'];

const RATING_COLORS: Record<string, string> = {
  brilliant: '#26C2A3', great: '#6366F1', good: '#22C55E',
  inaccuracy: '#F59E0B', mistake: '#F97316', blunder: '#EF4444',
};

const RATING_ICONS: Record<string, string> = {
  brilliant: '✦', great: '↑', good: '✓', inaccuracy: '?!', mistake: '?', blunder: '??',
};

// AI thesis prompts for popular tickers
async function maybeGenerateAIThesis(ticker: string) {
  const w = window as unknown as { puter?: { ai?: { chat?: unknown } } };
  if (!w.puter?.ai?.chat) return;

  const companies: Record<string, string> = {
    AAPL: 'Apple Inc', NVDA: 'NVIDIA Corporation', TSLA: 'Tesla Inc',
    MSFT: 'Microsoft Corporation', META: 'Meta Platforms', AMZN: 'Amazon.com',
    GOOGL: 'Alphabet Inc', SPY: 'S&P 500 ETF',
  };
  const companyName = companies[ticker] || ticker;
  const action = Math.random() > 0.4 ? 'buy' : 'sell';

  try {
    const prompt = `You are Alpha, an investing mentor. Write a concise, educational trade thesis (2-3 sentences max) for a beginner investor considering a ${action} position in ${ticker} (${companyName}). Focus on one clear, specific reason. No jargon. No financial advice disclaimer. Just the thesis as if you're explaining to a friend. Start directly with the reasoning.`;

    const puter = window.puter as { ai: { chat: (msg: string, opts: { model: string }) => Promise<{ message?: { content: string | Array<{ text: string }> }, text?: string } | string> } };
    const response = await puter.ai.chat(prompt, { model: 'gemini-2.5-flash' });

    let text = '';
    if (typeof response === 'string') text = response;
    else if (response && typeof response === 'object') {
      if ('text' in response && response.text) text = response.text;
      else if (response.message?.content) {
        const c = response.message.content;
        text = typeof c === 'string' ? c : c.map((x: { text: string }) => x.text).join('');
      }
    }

    if (text.trim().length > 20) {
      await publishAIThesis({ ticker, companyName, action: action as 'buy' | 'sell', thesis: text.trim() });
    }
  } catch {
    // silently fail
  }
}

export default function FeedPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<FeedTab>('latest');
  const [theses, setTheses] = useState<PublicThesis[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTicker, setFilterTicker] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    if (tab === 'leaderboard') {
      setLoading(true);
      try {
        const lb = await fetchLeaderboard();
        setLeaderboard(lb);
      } finally {
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      const data = await fetchFeed({
        sortBy: tab === 'latest' ? 'latest' : 'top',
        ticker: filterTicker ?? undefined,
      });
      setTheses(data);
    } finally {
      setLoading(false);
    }
  }, [tab, filterTicker]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Generate AI theses for a couple popular tickers on first load
  useEffect(() => {
    const tickers = ['AAPL', 'NVDA', 'TSLA'];
    const randomTicker = tickers[Math.floor(Math.random() * tickers.length)];
    setTimeout(() => maybeGenerateAIThesis(randomTicker), 3000);
  }, []);

  return (
    <div style={{
      padding: '20px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      minHeight: 'calc(100vh - var(--header-height) - var(--bottom-nav-height))',
    }}>
      {/* Header */}
      <div style={{ animation: 'slideInUp 0.3s ease both' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
          Thesis Feed
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
          Real trade reasoning from the community
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '3px',
          gap: '2px',
          animation: 'slideInUp 0.35s ease both',
        }}
      >
        {([
          { id: 'latest', label: '🕐 Latest' },
          { id: 'top', label: '🔥 Top Rated' },
          { id: 'leaderboard', label: '🏆 Leaders' },
        ] as const).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1,
              padding: '8px 4px',
              borderRadius: '9px',
              border: 'none',
              background: tab === id ? 'var(--surface-elevated)' : 'transparent',
              color: tab === id ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
              boxShadow: tab === id ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Ticker filter chips (only for feed tabs) */}
      {tab !== 'leaderboard' && (
        <div style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '2px',
          WebkitOverflowScrolling: 'touch',
          animation: 'slideInUp 0.4s ease both',
        }}>
          <button
            onClick={() => setFilterTicker(null)}
            style={{
              flexShrink: 0,
              padding: '5px 12px',
              borderRadius: '999px',
              border: `1px solid ${filterTicker === null ? 'var(--accent)' : 'var(--border)'}`,
              background: filterTicker === null ? 'var(--accent-light)' : 'transparent',
              color: filterTicker === null ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            All
          </button>
          {POPULAR_TICKERS.map((t) => (
            <button
              key={t}
              onClick={() => setFilterTicker(t === filterTicker ? null : t)}
              style={{
                flexShrink: 0,
                padding: '5px 12px',
                borderRadius: '999px',
                border: `1px solid ${filterTicker === t ? 'var(--accent)' : 'var(--border)'}`,
                background: filterTicker === t ? 'var(--accent-light)' : 'transparent',
                color: filterTicker === t ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', animation: 'slideInUp 0.45s ease both' }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '16px' }} />
          ))
        ) : tab === 'leaderboard' ? (
          leaderboard.length === 0 ? (
            <EmptyState message="No trades yet. Be the first to make a move!" />
          ) : (
            leaderboard.map((entry, i) => (
              <LeaderboardRow key={entry.uid} entry={entry} rank={i + 1} />
            ))
          )
        ) : theses.length === 0 ? (
          <EmptyState message={
            filterTicker
              ? `No theses for ${filterTicker} yet. Be the first!`
              : "No theses yet. Make a trade to add yours to the feed!"
          } />
        ) : (
          theses.map((thesis) => (
            <ThesisCard
              key={thesis.id}
              thesis={thesis}
              currentUid={user?.uid ?? ''}
            />
          ))
        )}
      </div>

      {/* Refresh button */}
      {!loading && (
        <button
          onClick={loadFeed}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '12px',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginBottom: '20px',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Refresh feed
        </button>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: '10px', padding: '40px 20px',
      textAlign: 'center', opacity: 0.6,
    }}>
      <span style={{ fontSize: '2rem' }}>♟</span>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
        {message}
      </p>
    </div>
  );
}

function LeaderboardRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const medals = ['🥇', '🥈', '🥉'];
  const rankDisplay = rank <= 3 ? medals[rank - 1] : `#${rank}`;
  const scoreColor = entry.avgScore >= 75 ? '#22C55E' : entry.avgScore >= 50 ? '#6366F1' : '#F59E0B';
  const ratingColor = RATING_COLORS[entry.bestRating] ?? '#94A3B8';
  const ratingIcon = RATING_ICONS[entry.bestRating] ?? '·';

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      <span style={{ fontSize: rank <= 3 ? '1.4rem' : '0.85rem', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0, minWidth: '28px', textAlign: 'center' }}>
        {rankDisplay}
      </span>

      <div style={{
        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
        background: 'var(--surface-elevated)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-secondary)',
      }}>
        {entry.displayName.charAt(0).toUpperCase()}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.displayName}
        </p>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
          {entry.totalTrades} trade{entry.totalTrades !== 1 ? 's' : ''} · Best:{' '}
          <span style={{ color: ratingColor }}>{ratingIcon} {entry.bestRating}</span>
        </p>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 800, color: scoreColor, margin: 0, marginBottom: '2px' }}>
          {entry.avgScore.toFixed(0)}
        </p>
        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          avg score
        </p>
      </div>
    </div>
  );
}
