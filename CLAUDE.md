# CLAUDE.md — AlphaMove

> "Chess.com meets Duolingo for investing — an AI mentor that teaches you to invest by actually investing, using your real budget and today's real news."

---

## 1. Product Vision

**AlphaMove** is a mobile-first paper trading app where every trade is a move, and your AI mentor is the chess engine evaluating your position. Unlike anything on the market, AlphaMove weaves real-time AI mentorship into every decision — before, during, and after — while using your *actual* budget constraints and today's *actual* news.

The core insight: beginners don't fail because they lack information. They fail because they lack judgment. AlphaMove builds judgment by making you think before you trade (Socratic pre-trade chat), giving you immediate feedback after (chess-engine analysis), and connecting every market event to YOUR portfolio in plain English.

**Target user:** Gen Z, 18-25, has $200-$2000 they could invest but is intimidated. Knows what the S&P 500 is but has never opened a brokerage account. Wants to learn by doing, not by reading.

**North star metric:** A user who reaches Level 5 could open a real brokerage account and make their first trade with confidence and a sound thesis.

---

## 2. Competitive Differentiation

| Product | What they do | Where they fail | AlphaMove's edge |
|---|---|---|---|
| **Investopedia Simulator** | Paper trading with $100k fake money | No guidance. No feedback. No learning loop. Fake capital teaches fake lessons. | Real budget + AI mentor in every trade |
| **Money Masters** | Gamified finance courses | Theory only. No simulation. Quizzes ≠ real decisions. | Learn BY trading, not before trading |
| **TryPaperTrade** | Clean paper trading UI | Zero intelligence. Just a spreadsheet with charts. | Every trade gets chess-engine feedback |
| **FX Replay** | Replay historical forex scenarios | Backward-looking. No real market. Forex-only. | Forward-looking, real stocks, real news |
| **Robinhood** | Real trading | Optimized for *transactions*, not *education*. Confetti on trades is the opposite of mentorship. | Mentor that slows you down and makes you think |

**The gap no one fills:** Real-time AI mentorship + realistic constraints + leveling system. AlphaMove is the first product where the AI mentor is woven into the trade flow itself, not bolted on as a chatbot sidebar.

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                  React PWA (Vite)                │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Portfolio │  │  Trade   │  │  Mentor Chat  │  │
│  │Dashboard │  │  Flow    │  │    (Pre/Post) │  │
│  ├──────────┤  ├──────────┤  ├───────────────┤  │
│  │ Morning  │  │ Leveling │  │    Onboard    │  │
│  │  Brief   │  │    UI    │  │     Flow      │  │
│  └──────────┘  └──────────┘  └───────────────┘  │
│                      │                           │
│              ┌───────┴────────┐                  │
│              │  Service Layer │                  │
│              │  (hooks/api)   │                  │
│              └───────┬────────┘                  │
└──────────────────────┼──────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────┴─────┐  ┌────┴─────┐  ┌────┴─────┐
   │ Firebase  │  │ Finnhub  │  │ Claude   │
   │ Firestore │  │ API      │  │ API      │
   │ (state)   │  │ (market) │  │ (mentor) │
   └──────────┘  └──────────┘  └──────────┘
```

### Builder Responsibilities

**Builder A — AI/Data Layer:**
- Claude API integration (mentor prompts, all 3 modes)
- Finnhub API integration (quotes, search, company info, news)
- Firebase/Firestore schema + CRUD operations
- XP/leveling calculation engine
- Morning brief generation logic
- All files in: `src/services/`, `src/hooks/`, `src/config/`

**Builder B — UI/Frontend:**
- All React components and pages
- Trade flow UI (search → preview → mentor chat → confirm)
- Portfolio dashboard (holdings, P&L, charts)
- Mentor chat UI (message bubbles, typing indicators)
- Leveling/XP progress UI
- Onboarding flow
- All files in: `src/components/`, `src/pages/`, `src/styles/`

**Shared contract:** Builder A exposes custom hooks (`useMentor`, `usePortfolio`, `useTrade`, `useMarketData`, `useNewsBrief`). Builder B consumes them. Interface types live in `src/types/`. Neither builder touches the other's directory.

---

## 4. Shared Data Schemas

```typescript
// src/types/index.ts

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
```

---

## 5. API Contracts (Hook Interfaces)

These are the hooks Builder A implements. Builder B calls them. Types are from `src/types/`.

```typescript
// src/hooks/usePortfolio.ts
export function usePortfolio(uid: string): {
  portfolio: Portfolio | null;
  positions: Position[];
  loading: boolean;
  refreshPrices: () => Promise<void>;           // re-fetches current prices from Finnhub
}

// src/hooks/useTrade.ts
export function useTrade(): {
  executeTrade: (params: {
    ticker: string;
    action: TradeAction;
    shares: number;
    thesis: string;
    mentorPreTradeAnalysis: string;
  }) => Promise<Trade>;
  getPendingTrades: (uid: string) => Promise<Trade[]>;
  cancelTrade: (tradeId: string) => Promise<void>;
}

// src/hooks/useMarketData.ts
export function useMarketData(): {
  getQuote: (ticker: string) => Promise<{
    price: number;
    change: number;
    changePct: number;
    high: number;
    low: number;
    open: number;
    prevClose: number;
  }>;
  searchTicker: (query: string) => Promise<{
    symbol: string;
    description: string;
    type: string;
  }[]>;
  getCompanyProfile: (ticker: string) => Promise<{
    name: string;
    ticker: string;
    logo: string;
    industry: string;
    marketCap: number;
    weburl: string;
  }>;
  getCompanyNews: (ticker: string, daysBack?: number) => Promise<NewsEvent[]>;
}

// src/hooks/useMentor.ts
export function useMentor(): {
  startPreTradeChat: (params: {
    uid: string;
    ticker: string;
    action: TradeAction;
    shares: number;
    userLevel: number;
    portfolio: Portfolio;
  }) => Promise<MentorConversation>;

  sendMessage: (params: {
    conversationId: string;
    message: string;
  }) => Promise<MentorMessage>;

  generatePostTradeAnalysis: (params: {
    trade: Trade;
    portfolio: Portfolio;
    userLevel: number;
  }) => Promise<{
    analysis: string;
    moveRating: MoveRating;
    xpEarned: number;
  }>;

  generateMorningBrief: (params: {
    uid: string;
    portfolio: Portfolio;
    level: number;
  }) => Promise<MorningBrief>;
}

// src/hooks/useXP.ts
export function useXP(): {
  awardXP: (params: {
    uid: string;
    source: XPSource;
    amount: number;
    reason: string;
    tradeId?: string;
  }) => Promise<{ newXP: number; newLevel: number; leveledUp: boolean }>;
  getXPHistory: (uid: string) => Promise<XPEvent[]>;
}

// src/hooks/useAuth.ts
export function useAuth(): {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;           // Google auth
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}
```

---

## 6. Stock Data API: Finnhub (Recommended)

**Decision: Finnhub.io** — and it's not close for a hackathon.

| Criteria | Finnhub | Alpha Vantage | Yahoo Finance (RapidAPI) |
|---|---|---|---|
| Free tier rate limit | **60 calls/min** | 5 calls/min, 25/day | 500 calls/month |
| Real-time quotes | ✅ Yes (free) | ❌ Premium only | ✅ Yes |
| Company news | ✅ Built-in endpoint | ❌ Not available | ✅ Available |
| Ticker search | ✅ Symbol lookup | ✅ Symbol search | ✅ Autocomplete |
| Company profiles | ✅ Full profiles | ✅ Overview | ✅ Profiles |
| Official JS client | ✅ `finnhub` npm | ✅ npm package | ❌ Raw REST |
| Setup complexity | Low (API key in URL) | Low | Medium (RapidAPI proxy) |

**Why Finnhub wins:**
1. **60 calls/minute on free tier** — Alpha Vantage gives you 25 per DAY. During a demo where you're searching tickers, fetching quotes, loading news, that's gone in 30 seconds.
2. **Company news endpoint** — `/company-news` gives us exactly what we need for the morning brief and news integration. No separate news API needed.
3. **Official JavaScript client** — `npm install finnhub`, clean API, well-documented.
4. **Used by Princeton researchers** — Finnhub has partnerships with multiple universities including Princeton.

**Setup:**
```bash
npm install finnhub
```
```env
VITE_FINNHUB_API_KEY=your_key_here
```
Get a free key at: https://finnhub.io/register

**Key endpoints we'll use:**
- `GET /quote?symbol=AAPL` — real-time quote
- `GET /search?q=apple` — ticker search
- `GET /stock/profile2?symbol=AAPL` — company info
- `GET /company-news?symbol=AAPL&from=2026-03-27&to=2026-03-28` — news for morning brief
- `GET /news?category=general` — market-wide news

---

## 7. Mentor AI Prompt Architecture

The mentor is the soul of AlphaMove. Three distinct modes, one consistent persona.

### 7.1 Mentor Persona (Base System Prompt)

```
You are Alpha, an AI investing mentor inside the AlphaMove app. You teach beginner investors to think clearly about markets by asking sharp questions and giving honest feedback.

Your personality:
- Think: the warmth of a favorite professor + the precision of a chess engine
- You are encouraging but never dishonest. If a trade idea is bad, you say so — kindly.
- You explain finance concepts when they come up naturally, but NEVER lecture unprompted.
- You use analogies, not jargon. "Diversification" becomes "don't put all your eggs in one basket — literally."
- You celebrate good reasoning even when trades lose money. You critique bad reasoning even when trades make money.
- You are concise. Max 3 sentences per message unless the user asks for more detail.
- You refer to trades as "moves" and the portfolio as the user's "position."
- You use chess metaphors naturally: "That was a strong opening move," "You're playing defense here," "That's a bold gambit."
- You never give financial advice or say "you should buy X." You help the user develop THEIR thesis.

The user's current state:
- Level: {level}/10
- Cash available: ${cash}
- Portfolio value: ${portfolioValue}
- Current positions: {positions as JSON}
- XP: {xp}

Adjust your depth based on the user's level:
- Levels 1-2 (DIRECTIVE): Guide heavily. Explain everything. Ask simple yes/no questions. Suggest what to look at. "Before you buy AAPL, let's talk about what Apple actually does. Do you know how they make money?"
- Levels 3-5 (COLLABORATIVE): Offer 2-3 options. Let the user choose. Explain tradeoffs. "You could buy AAPL, MSFT, or GOOGL here. Each has a different risk profile. Which interests you and why?"
- Levels 6-8 (ADVISORY): Let the user lead. Comment after. Push back when needed. "Interesting thesis. What's your downside scenario?"
- Levels 9-10 (AUTONOMOUS): Minimal intervention. Only flag major issues. "Solid reasoning. One thing to watch: earnings are next week."
```

### 7.2 Pre-Trade Socratic Mode

Activated when a user initiates a trade. The mentor's job is to make the user articulate their thesis before executing.

```
You are in PRE-TRADE mode. The user wants to {action} {shares} shares of {ticker} ({companyName}) at ~${price}/share (total: ~${total}).

Your mission: help the user develop a clear thesis for this trade through Socratic questioning. Do NOT approve or reject the trade — help them think it through.

Ask these questions naturally across 2-4 messages (not all at once):
1. "What's your thesis?" — Why do they think this is a good move right now?
2. "What would have to be true?" — What assumptions are they making?
3. "What's the risk?" — What could go wrong? How much could they lose?
4. "How does this fit?" — Does this trade fit their overall portfolio/strategy?

For level 1-2 users, ask ONE question at a time, starting with the simplest: "What made you interested in {ticker}?"

For level 6+ users, ask a single sharp question: "Walk me through your thesis."

After 2-4 exchanges, summarize their thesis in 2 sentences and ask: "Ready to make this move?"

If the user's reasoning reveals a clear problem (e.g., FOMO buying, no thesis, all-in on one stock with a $500 portfolio), flag it directly but don't block the trade: "I want to flag something — this would put 80% of your portfolio in one stock. That's a very concentrated bet. Still your call, but worth knowing."

Output a JSON field `readyToExecute: true` when the conversation reaches a natural conclusion and the user confirms.
```

### 7.3 Post-Trade Chess Engine Mode

Activated immediately after a trade executes. This is the "chess engine" moment.

```
You are in POST-TRADE ANALYSIS mode. The user just executed this move:

Trade: {action} {shares} shares of {ticker} at ${price}
User's thesis: "{thesis}"
Portfolio after trade: {portfolio JSON}
Relevant news: {recent news for ticker}

Analyze this move like a chess engine analyzes a position. Provide:

1. **Move Rating** — one of: brilliant, great, good, inaccuracy, mistake, blunder
   - brilliant: exceptional reasoning + timing + portfolio fit + contrarian insight
   - great: solid thesis + good timing + fits portfolio strategy
   - good: reasonable thesis + acceptable risk
   - inaccuracy: minor flaw in reasoning or slightly off timing
   - mistake: flawed thesis, poor risk management, or bad timing
   - blunder: no thesis, FOMO, panic, excessive concentration, or fundamentally misunderstanding the asset

2. **Analysis** — 2-3 sentences explaining the rating. Be specific. Reference their thesis.

3. **Better move** — If the rating is inaccuracy or worse, suggest what a stronger move would have been. Not what stock to buy — what REASONING would have been better.

4. **XP award** — suggest XP based on the quality of their reasoning (NOT the trade outcome):
   - brilliant: 100 XP
   - great: 75 XP
   - good: 50 XP
   - inaccuracy: 30 XP
   - mistake: 15 XP
   - blunder: 5 XP (you still get XP for trying)

Respond ONLY in this JSON format:
{
  "moveRating": "good",
  "analysis": "Your thesis about...",
  "betterMove": null | "Consider...",
  "xpAwarded": 50,
  "xpReason": "Solid thesis with clear reasoning about..."
}
```

### 7.4 Morning Brief Mode

Activated on app open (or triggered manually). Generates a personalized market digest.

```
You are in MORNING BRIEF mode. Generate a personalized market brief for this user.

User's portfolio: {portfolio JSON}
User's level: {level}
Recent news for their holdings: {news JSON from Finnhub}
Market summary: {general market news from Finnhub}

Structure your brief as:

1. **Portfolio overnight** — What happened to their holdings since last session? Plain English, no jargon. "Your AAPL is up 2.1% on strong iPhone sales data. Your TSLA dipped 0.8% — nothing major, just the broader market pulling back."

2. **News that matters to YOU** — Pick 2-3 news events relevant to their holdings or watchlist. For EACH: explain what happened, why it matters for their specific position, and what to watch for. Keep each to 2-3 sentences.

3. **Today's question** (levels 1-5 only) — End with a thought-provoking question that teaches a concept: "Your NVDA is up 15% since you bought it. At what point would you take some profit? That's called a 'price target' — having one before a stock runs up helps you avoid greed."

For level 1-2 users, keep it very simple. Short sentences. Define any term you use.
For level 6+ users, be more analytical. Include sector trends, relative performance.

Respond in JSON:
{
  "greeting": "Good morning! Here's what moved while you slept.",
  "portfolioSummary": "...",
  "newsEvents": [
    {
      "headline": "...",
      "whyItMatters": "...",
      "actionToConsider": "..."
    }
  ],
  "dailyQuestion": "..." | null
}
```

---

## 8. Leveling System Spec

### XP Thresholds

| Level | Name | Cumulative XP | Mentor Behavior | Unlocks |
|---|---|---|---|---|
| 1 | **Paper Rookie** | 0 | Directive | Basic buy/sell, 5 pre-set tickers |
| 2 | **Market Observer** | 200 | Directive | Full ticker search, portfolio view |
| 3 | **Thesis Builder** | 500 | Collaborative | Morning brief, watchlist |
| 4 | **Risk Aware** | 1,000 | Collaborative | Sector view, risk metrics |
| 5 | **Pattern Spotter** | 1,800 | Collaborative | Price alerts, performance charts |
| 6 | **Independent Thinker** | 3,000 | Advisory | Mentor goes quiet unless asked |
| 7 | **Portfolio Strategist** | 4,500 | Advisory | Rebalancing suggestions |
| 8 | **Market Analyst** | 6,500 | Advisory | Earnings calendar integration |
| 9 | **Alpha Seeker** | 9,000 | Autonomous | Full autonomy, mentor is optional |
| 10 | **Graduation** | 12,000 | Autonomous | "Ready for real brokerage" badge + transition guide |

### XP Award Rules

| Action | XP Range | Criteria |
|---|---|---|
| Pre-trade reasoning | 10-50 | Quality of thesis articulated in pre-trade chat |
| Post-trade rating | 5-100 | Based on move rating (see 7.3) |
| Morning brief engagement | 15 | Opened and read the brief |
| Daily streak | 10 × streak_days | Capped at 70 (7-day streak) |
| First trade | 50 | One-time bonus |
| New sector | 25 | First position in a new sector |
| Handling a loss well | 30 | Held or had a rational reason for selling during a dip (no panic sell) |

### Anti-Gaming Rules
- XP is awarded for reasoning quality, NOT returns
- A trade with brilliant reasoning that loses money gets 100 XP
- A trade with no thesis that happens to profit gets 5 XP
- Max 3 XP-earning trades per day (prevents spam trading)
- Streak XP requires at least one meaningful interaction (not just opening the app)

---

## 9. MVP Scope (8 Hours)

### MUST HAVE (demo-critical)

| Feature | Builder | Priority | Est. Hours |
|---|---|---|---|
| Google Auth + user creation | A | P0 | 0.5 |
| Onboarding flow (name + starting capital) | B | P0 | 0.5 |
| Finnhub integration (quote, search, profile) | A | P0 | 1.0 |
| Portfolio dashboard (positions, P&L, cash) | B | P0 | 1.5 |
| Trade execution flow (search → amount → confirm) | A+B | P0 | 1.5 |
| Pre-trade mentor chat (Socratic mode) | A | P0 | 1.5 |
| Pre-trade chat UI | B | P0 | 1.0 |
| Post-trade chess-engine analysis | A | P0 | 1.0 |
| Post-trade feedback display (move rating badge) | B | P0 | 0.5 |
| XP/Level display + progress bar | B | P0 | 0.5 |
| Morning brief (pre-generated for demo) | A | P0 | 0.5 |
| Morning brief UI | B | P0 | 0.5 |

**Total: ~10 hours of work across 2 people in 8 hours** — tight but doable since tasks are parallel.

### STRETCH GOALS (only if ahead of schedule)

| Feature | Priority | Notes |
|---|---|---|
| Animated level-up celebration | P1 | Confetti + "LEVEL UP" modal — high demo impact |
| Watchlist | P1 | Simple list of tickers to track |
| Historical performance chart | P2 | Line chart of portfolio value over time |
| Sound effects for move ratings | P2 | Chess-style "click" sound |
| Push notification for morning brief | P3 | PWA notification |

### EXPLICITLY OUT OF SCOPE
- Real money / brokerage integration
- Options, crypto, or forex
- Social features / leaderboards
- Dark mode / theme switching (pick one good theme and ship it)
- Desktop-optimized layout (mobile-first ONLY)
- Offline support

---

## 10. Demo Flow (3 Minutes)

This is the exact script for the judge demo. Practice this.

---

**[0:00 - 0:20] The Hook**

Open the app on a phone (or phone-sized browser). Show the landing page.

*"Meet AlphaMove — it's Chess.com meets Duolingo for investing. Every trade is a move, and your AI mentor rates it like a chess engine."*

**[0:20 - 0:50] Onboarding**

Tap "Get Started." Sign in. The app asks: "How much could you realistically invest?"

Type: **$500**.

*"Unlike every other simulator that hands you a fake $100K, AlphaMove starts with YOUR real budget. Because the constraints are the lesson — managing $500 is a fundamentally different skill than playing with $100K."*

**[0:50 - 1:30] The Trade (Pre-Trade Mentor)**

Search for "AAPL." See the stock card with real-time price from Finnhub. Tap "Buy."

The mentor appears: *"What's your thesis for Apple right now?"*

User types: "I think Apple is a safe company and I want to start with something I know."

Mentor responds: *"That's a solid starting point — familiarity reduces uncertainty. But 'safe' is relative. With $500, how many shares would you want, and would that leave room for other moves?"*

*"Notice how the mentor doesn't tell you what to do — it makes you THINK. This is Socratic investing."*

**[1:30 - 2:00] The Feedback (Post-Trade Chess Engine)**

Confirm the trade. IMMEDIATELY: the chess-engine analysis appears.

A badge: **"Good Move ✦"** with a green glow.

Analysis: *"Solid first move. Clear thesis based on familiarity and perceived safety. You're starting concentrated in tech — keep that in mind for your next move. +50 XP."*

*"Just like a chess engine evaluates every move, AlphaMove tells you exactly why your trade was smart or where you went wrong — EVERY time."*

**[2:00 - 2:30] The Morning Brief**

Navigate to the brief. Show 2-3 real news items connected to the user's AAPL position.

*"Every morning, AlphaMove connects real market news to YOUR specific holdings. No jargon — just causality. 'Apple announced X, here's why that matters for your $500 position.'"*

**[2:30 - 2:50] The Leveling System**

Show the XP bar and current level (Paper Rookie, Level 1). Show the level roadmap.

*"As you demonstrate better reasoning, you level up. The mentor gets quieter. By Level 10, you graduate — AlphaMove has taught you to think like an investor, and you're ready for a real brokerage."*

**[2:50 - 3:00] The Close**

*"Every finance app teaches you to trade. AlphaMove teaches you to THINK. It's the chess engine for your portfolio."*

---

## 11. File Structure

```
alphamove/
├── CLAUDE.md                          # This file
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── .env.example                       # Template for env vars
├── public/
│   ├── manifest.json                  # PWA manifest
│   ├── favicon.svg
│   └── icons/                         # PWA icons
├── src/
│   ├── main.tsx                       # App entry
│   ├── App.tsx                        # Router + auth wrapper
│   ├── vite-env.d.ts
│   │
│   ├── types/                         # ⚠ SHARED — both builders reference
│   │   └── index.ts                   # All TypeScript interfaces
│   │
│   ├── config/                        # Builder A owns
│   │   ├── firebase.ts                # Firebase init
│   │   ├── finnhub.ts                 # Finnhub client init
│   │   └── constants.ts               # Level configs, XP tables
│   │
│   ├── services/                      # Builder A owns
│   │   ├── mentorService.ts           # Claude API calls, prompt construction
│   │   ├── marketService.ts           # Finnhub API calls
│   │   ├── tradeService.ts            # Trade execution + Firestore writes
│   │   ├── portfolioService.ts        # Portfolio CRUD + price refresh
│   │   ├── xpService.ts              # XP calculations + level-up logic
│   │   └── newsService.ts             # News fetch + morning brief generation
│   │
│   ├── hooks/                         # Builder A owns (consumed by B)
│   │   ├── useAuth.ts
│   │   ├── useMentor.ts
│   │   ├── usePortfolio.ts
│   │   ├── useTrade.ts
│   │   ├── useMarketData.ts
│   │   ├── useXP.ts
│   │   └── useNewsBrief.ts
│   │
│   ├── components/                    # Builder B owns
│   │   ├── layout/
│   │   │   ├── AppShell.tsx           # Bottom nav + header
│   │   │   └── BottomNav.tsx
│   │   ├── portfolio/
│   │   │   ├── PortfolioDashboard.tsx
│   │   │   ├── PositionCard.tsx
│   │   │   └── PortfolioSummary.tsx
│   │   ├── trade/
│   │   │   ├── TickerSearch.tsx
│   │   │   ├── StockPreview.tsx
│   │   │   ├── TradeForm.tsx
│   │   │   └── TradeConfirmation.tsx
│   │   ├── mentor/
│   │   │   ├── MentorChat.tsx
│   │   │   ├── ChatBubble.tsx
│   │   │   ├── MoveRatingBadge.tsx
│   │   │   └── PostTradeCard.tsx
│   │   ├── brief/
│   │   │   ├── MorningBrief.tsx
│   │   │   └── NewsCard.tsx
│   │   ├── leveling/
│   │   │   ├── XPBar.tsx
│   │   │   ├── LevelBadge.tsx
│   │   │   └── LevelRoadmap.tsx
│   │   └── onboarding/
│   │       ├── WelcomeScreen.tsx
│   │       └── CapitalInput.tsx
│   │
│   ├── pages/                         # Builder B owns
│   │   ├── HomePage.tsx               # Morning brief + portfolio overview
│   │   ├── PortfolioPage.tsx          # Full portfolio view
│   │   ├── TradePage.tsx              # Search + trade flow
│   │   ├── MentorPage.tsx             # Chat history with mentor
│   │   └── ProfilePage.tsx            # Level, XP, stats
│   │
│   └── styles/                        # Builder B owns
│       ├── globals.css                # CSS variables, reset, typography
│       └── animations.css             # Transitions, move rating animations
```

---

## 12. Environment Variables

```env
# .env.example — copy to .env and fill in

# Firebase (get from Firebase Console → Project Settings → Web app)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Finnhub (get from https://finnhub.io/register — free, instant)
VITE_FINNHUB_API_KEY=

# Anthropic Claude API (hackathon-provided credits)
VITE_ANTHROPIC_API_KEY=
```

**Setup checklist (first 15 minutes of hackathon):**
1. One person creates Firebase project → enables Auth (Google) + Firestore
2. Other person gets Finnhub API key (takes 30 seconds)
3. Both copy `.env.example` → `.env` and paste keys
4. `npm install && npm run dev` — both should see the app running

**IMPORTANT:** The Anthropic API key should NOT be called from the frontend in production. For the hackathon, we'll call it from the client side (acceptable for a demo). In prod, this would be a serverless function. Don't let this concern slow you down during the build.

---

## 13. Winning Criteria

Track 1 judges care about:

| Judge Criteria | How AlphaMove wins |
|---|---|
| **Innovation** | No product combines real-time AI mentorship into the trade flow itself. Chess engine metaphor is novel and memorable. |
| **Technical Execution** | Claude API for sophisticated multi-mode AI mentor, Finnhub for real market data, Firebase for real-time state — all working in a polished mobile-first PWA. |
| **Consumer Appeal** | Built for Gen Z with a $500 budget, not Wall Street with $500K. Leveling system creates retention. Mobile-first. |
| **Demo Quality** | 3-minute script hits every feature in a narrative arc: onboard → trade → feedback → brief → level up. Each moment demonstrates AI in action. |
| **Market Opportunity** | 58% of Gen Z wants to invest but doesn't know how (Schwab 2024). There is no "Duolingo for investing" that actually works. This is a real gap. |
| **Use of AI** | Claude isn't a chatbot sidebar — it's woven into every feature. Pre-trade Socratic questioning, post-trade chess analysis, morning brief personalization. Three distinct AI modes, one coherent persona. |

**The one-sentence pitch to a judge:** "We built the chess engine for your portfolio — an AI mentor that makes you think before every trade, rates every move, and levels you up from beginner to investor."

---

## 14. Quick Start

```bash
# Clone the repo
git clone <repo-url>
cd alphamove

# Install dependencies
npm install

# Copy env file and add your keys
cp .env.example .env

# Start dev server
npm run dev
```

**Day-of timeline:**
| Time | Action |
|---|---|
| 0:00-0:15 | Repo setup, env vars, Firebase project, both devs running locally |
| 0:15-0:30 | Agree on types, create `src/types/index.ts`, both devs pull |
| 0:30-2:00 | **Builder A:** Firebase auth + Firestore schema + Finnhub integration |
| 0:30-2:00 | **Builder B:** App shell, bottom nav, onboarding flow, portfolio dashboard skeleton |
| 2:00-4:00 | **Builder A:** Mentor service (Claude API), pre-trade + post-trade prompts |
| 2:00-4:00 | **Builder B:** Trade flow UI, mentor chat UI, ticker search |
| 4:00-5:00 | **INTEGRATION CHECKPOINT** — both devs merge, make sure hooks connect to UI |
| 5:00-6:30 | **Builder A:** Morning brief, XP engine, post-trade analysis |
| 5:00-6:30 | **Builder B:** Morning brief UI, move rating badges, XP bar, leveling UI |
| 6:30-7:30 | Bug fixes, polish, demo prep |
| 7:30-8:00 | Practice the 3-minute demo 3 times |

---

## 15. Design Direction

**Aesthetic:** Dark mode, premium fintech. Think Linear meets chess.com. Not Robinhood's candy-colored chaos.

**Color palette:**
- Background: `#0A0A0F` (near-black)
- Surface: `#14141F` (card bg)
- Primary accent: `#6366F1` (indigo — associated with intelligence)
- Success green: `#22C55E`
- Danger red: `#EF4444`
- XP gold: `#F59E0B`
- Text primary: `#F8FAFC`
- Text secondary: `#94A3B8`

**Typography:**
- Headlines: `'DM Sans'` 700 — geometric, modern, confident
- Body: `'DM Sans'` 400
- Monospace (prices, numbers): `'JetBrains Mono'`

**Move Rating Colors (chess-inspired):**
- Brilliant: `#26C2A3` (teal) with a ✦ star icon
- Great: `#6366F1` (indigo)
- Good: `#22C55E` (green)
- Inaccuracy: `#F59E0B` (amber)
- Mistake: `#F97316` (orange)
- Blunder: `#EF4444` (red) with a ?? icon

**Key UI moments:**
- Move rating badge slides in with a chess-piece-slamming animation
- XP bar fills with a smooth liquid animation
- Level-up triggers a burst of particles in the accent color
- Morning brief slides up from bottom like a card reveal
- Pre-trade chat has a subtle "thinking" animation while the mentor types

---

*This document is the single source of truth for the AlphaMove build. Every Claude Code session should read this file. Every design decision should trace back to this document. Ship fast, ship smart, win the hackathon.*
