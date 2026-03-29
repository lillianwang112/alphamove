import { Timestamp } from 'firebase/firestore';

// ─── User & Profile ───────────────────────────────

export interface User {
  uid: string;
  displayName: string;
  email: string;
  createdAt: Timestamp;
  onboardingComplete: boolean;
  startingCapital: number;      // e.g. 500 — what they said they could actually invest
  currentCash: number;          // available cash (startingCapital - invested)
  level: number;                // 1-10
  xp: number;                   // lifetime XP
  xpToNextLevel: number;        // calculated
  totalTrades: number;
  streak: number;               // consecutive days active
  lastActiveAt: Timestamp;
}

// ─── Portfolio ────────────────────────────────────

export interface Position {
  id: string;
  ticker: string;
  companyName: string;
  shares: number;
  avgCostBasis: number;         // average price paid per share
  currentPrice: number;         // latest from Finnhub
  marketValue: number;          // shares * currentPrice
  totalReturn: number;          // marketValue - (shares * avgCostBasis)
  totalReturnPct: number;       // as decimal, e.g. 0.05 = 5%
  openedAt: Timestamp;
}

export interface Portfolio {
  positions: Position[];
  totalValue: number;           // sum of all positions + currentCash
  totalInvested: number;        // sum of all position cost bases
  dayChange: number;
  dayChangePct: number;
  allTimeReturn: number;
  allTimeReturnPct: number;
}

// ─── Trades ───────────────────────────────────────

export type TradeAction = 'buy' | 'sell';
export type TradeStatus = 'pending_mentor' | 'confirmed' | 'executed' | 'cancelled';

export interface Trade {
  id: string;
  uid: string;
  ticker: string;
  companyName: string;
  action: TradeAction;
  shares: number;
  priceAtExecution: number;
  totalValue: number;           // shares * priceAtExecution
  status: TradeStatus;
  thesis: string;               // user's reasoning (from pre-trade chat)
  mentorPreTradeAnalysis: string;   // mentor's Socratic summary
  mentorPostTradeAnalysis: string;  // chess-engine feedback
  moveRating: MoveRating;
  xpEarned: number;
  createdAt: Timestamp;
  executedAt: Timestamp | null;
}

export type MoveRating = 'brilliant' | 'great' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';

// ─── Mentor ───────────────────────────────────────

export type MentorMode = 'pre_trade' | 'post_trade' | 'morning_brief' | 'general';

export interface MentorMessage {
  id: string;
  role: 'user' | 'mentor';
  content: string;
  mode: MentorMode;
  timestamp: Timestamp;
  tradeId?: string;             // if associated with a specific trade
}

export interface MentorConversation {
  id: string;
  uid: string;
  mode: MentorMode;
  messages: MentorMessage[];
  tradeId?: string;
  createdAt: Timestamp;
}

// ─── News ─────────────────────────────────────────

export interface NewsEvent {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  relatedTickers: string[];
  publishedAt: Timestamp;
  mentorAnalysis: string;       // AI-generated plain-English explanation
  impactOnPortfolio: string;    // personalized to user's holdings
}

export interface MorningBrief {
  id: string;
  uid: string;
  date: string;                 // YYYY-MM-DD
  newsEvents: NewsEvent[];
  portfolioSummary: string;     // AI-generated overnight summary
  suggestedActions: string[];   // things to watch today
  createdAt: Timestamp;
}

// ─── Leveling ─────────────────────────────────────

export interface LevelConfig {
  level: number;
  name: string;
  xpRequired: number;           // cumulative XP to reach this level
  mentorBehavior: MentorBehavior;
  unlockedFeatures: string[];
}

export type MentorBehavior =
  | 'directive'      // Levels 1-2: Mentor guides heavily
  | 'collaborative'  // Levels 3-5: Mentor offers options
  | 'advisory'       // Levels 6-8: User leads, mentor comments
  | 'autonomous';    // Levels 9-10: User is independent

// ─── XP Events ────────────────────────────────────

export interface XPEvent {
  id: string;
  uid: string;
  source: XPSource;
  amount: number;
  reason: string;
  tradeId?: string;
  createdAt: Timestamp;
}

export type XPSource =
  | 'trade_reasoning'     // quality of pre-trade thesis
  | 'trade_outcome'       // move rating
  | 'daily_brief_read'    // engaged with morning brief
  | 'streak_bonus'        // consecutive day bonus
  | 'first_trade'         // one-time bonus
  | 'diversification'     // bought a stock in a new sector
  | 'loss_recovery';      // handled a loss well (didn't panic sell)
