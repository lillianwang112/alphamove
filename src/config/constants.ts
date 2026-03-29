import type { LevelConfig, MoveRating } from '../types';

// ─── Level Configurations ─────────────────────────

export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    level: 1,
    name: 'Paper Rookie',
    xpRequired: 0,
    mentorBehavior: 'directive',
    unlockedFeatures: ['basic_buy_sell', 'preset_tickers'],
  },
  {
    level: 2,
    name: 'Market Observer',
    xpRequired: 200,
    mentorBehavior: 'directive',
    unlockedFeatures: ['full_ticker_search', 'portfolio_view'],
  },
  {
    level: 3,
    name: 'Thesis Builder',
    xpRequired: 500,
    mentorBehavior: 'collaborative',
    unlockedFeatures: ['morning_brief', 'watchlist'],
  },
  {
    level: 4,
    name: 'Risk Aware',
    xpRequired: 1000,
    mentorBehavior: 'collaborative',
    unlockedFeatures: ['sector_view', 'risk_metrics'],
  },
  {
    level: 5,
    name: 'Pattern Spotter',
    xpRequired: 1800,
    mentorBehavior: 'collaborative',
    unlockedFeatures: ['price_alerts', 'performance_charts'],
  },
  {
    level: 6,
    name: 'Independent Thinker',
    xpRequired: 3000,
    mentorBehavior: 'advisory',
    unlockedFeatures: ['mentor_quiet_mode'],
  },
  {
    level: 7,
    name: 'Portfolio Strategist',
    xpRequired: 4500,
    mentorBehavior: 'advisory',
    unlockedFeatures: ['rebalancing_suggestions'],
  },
  {
    level: 8,
    name: 'Market Analyst',
    xpRequired: 6500,
    mentorBehavior: 'advisory',
    unlockedFeatures: ['earnings_calendar'],
  },
  {
    level: 9,
    name: 'Alpha Seeker',
    xpRequired: 9000,
    mentorBehavior: 'autonomous',
    unlockedFeatures: ['full_autonomy', 'optional_mentor'],
  },
  {
    level: 10,
    name: 'Graduation',
    xpRequired: 12000,
    mentorBehavior: 'autonomous',
    unlockedFeatures: ['real_brokerage_badge', 'transition_guide'],
  },
];

// ─── XP Thresholds ────────────────────────────────
// Index corresponds to level (index 0 = level 1)
export const XP_THRESHOLDS: number[] = LEVEL_CONFIGS.map((c) => c.xpRequired);

// ─── Move Rating XP ───────────────────────────────

export const MOVE_RATING_XP: Record<MoveRating, number> = {
  brilliant: 100,
  great: 75,
  good: 50,
  inaccuracy: 30,
  mistake: 15,
  blunder: 5,
};

// ─── Trade Limits ─────────────────────────────────

export const MAX_TRADES_PER_DAY = 3;

// ─── Preset Tickers (Level 1) ─────────────────────

export const PRESET_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'];
