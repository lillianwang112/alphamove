<p align="center">
  <img src="public/alphamove-icon.png" width="80" alt="AlphaMove" />
</p>

<h1 align="center">AlphaMove</h1>

<p align="center">
  <strong>Learn to invest like a chess player — one deliberate move at a time.</strong><br/>
  AI-mentored paper trading simulator with gamified progression, built for first-time investors.
</p>

<p align="center">
  <a href="https://lillianwang112.github.io/alphamove">Open App</a> ·
  <a href="#-quick-start">Quick Start</a> ·
  <a href="#-features">Features</a> ·
  <a href="#-how-it-works">How It Works</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Live-brightgreen?style=for-the-badge" alt="Live" />
  <img src="https://img.shields.io/badge/Free-No%20Ads-brightgreen?style=for-the-badge" alt="Free" />
  <img src="https://img.shields.io/badge/AI--Powered-Puter.js-6366F1?style=for-the-badge" alt="AI" />
  <img src="https://img.shields.io/badge/10%20Levels-Paper%20Rookie%20→%20Graduation-orange?style=for-the-badge" alt="Levels" />
</p>

---

## The Problem

Most people who want to learn investing face a paradox: every app gives you either a toy simulator (no real learning) or a real brokerage (real money, no safety net). Neither teaches *judgment*.

Beginners don't need more data — they need a mentor who asks the right questions before they click Buy.

## What AlphaMove Does

AlphaMove is a **paper trading simulator with a built-in AI mentor**. Before every trade, Alpha (your AI mentor) pressure-tests your reasoning using Socratic questioning. After every trade, you get a chess-style move rating — *brilliant, great, good, inaccuracy, mistake, blunder* — based on how well you thought through your thesis, not just whether the stock went up.

As you trade smarter, you level up. Your mentor progressively steps back, training you toward full independence.

> **The core loop:** Form a thesis → discuss it with Alpha → execute the trade → get rated → earn XP → unlock more tools.

---

## ⚡ Quick Start

1. Visit **[lillianwang112.github.io/alphamove](https://lillianwang112.github.io/alphamove)**
2. Create a free account and set your starting capital
3. Hit **Make a Move** and search for a stock, ETF, or crypto
4. Discuss your thesis with Alpha before executing
5. Check your move rating and portfolio after the trade

No download needed. Works on any browser, including mobile.

---

## ✨ Features

### 🧠 AI Mentor — Alpha
- Socratic pre-trade chat: Alpha asks *why* before you buy, not after
- Post-trade analysis with personalized feedback on your reasoning
- Adjustable behavior based on level: fully directive for beginners, progressively quiet as you improve
- Available on every screen via floating chat button
- Powered by Puter.js (free, no API key needed)

### ♟ Chess-Style Move Rating
Every trade is rated on execution quality and reasoning depth:

| Rating | XP Earned | What It Means |
|--------|-----------|---------------|
| Brilliant ✨ | 100 XP | Exceptional thesis, excellent timing |
| Great 🟢 | 75 XP | Strong reasoning, well-executed |
| Good ✓ | 50 XP | Solid move |
| Inaccuracy 🔶 | 30 XP | Reasonable, but a better move existed |
| Mistake 🟠 | 15 XP | Clear errors in reasoning |
| Blunder 🔴 | 5 XP | Poor judgment — learn from it |

### 📈 10-Level Progression System
Features unlock as you grow — your mentor steps back as you step up.

| Level | Name | XP Required | Mentor Mode |
|-------|------|-------------|-------------|
| 1 | Paper Rookie | 0 | Directive |
| 2 | Market Observer | 200 | Directive |
| 3 | Thesis Builder | 500 | Collaborative |
| 4 | Risk Aware | 1,000 | Collaborative |
| 5 | Pattern Spotter | 1,800 | Collaborative |
| 6 | Independent Thinker | 3,000 | Advisory |
| 7 | Portfolio Strategist | 4,500 | Advisory |
| 8 | Market Analyst | 6,500 | Advisory |
| 9 | Alpha Seeker | 9,000 | Autonomous |
| 10 | Graduation | 12,000 | Autonomous + real brokerage guide |

### 🏦 Multi-Asset Class Trading
Trade across four asset classes in a single portfolio:
- **Stocks** — full ticker search, live Finnhub prices
- **ETFs** — diversification from day one
- **Crypto** — BTC, ETH, and more via live crypto feeds
- **Options** — calls and puts with strike price, expiry, and premium simulation

### 📰 AI Morning Brief
- Personalized daily brief generated each morning from your portfolio
- AI-written plain-English analysis of overnight market moves
- Suggested actions based on your current positions
- Daily reflection question (levels 1–5) to build judgment over time

### 🎮 Gamification & Streaks
- XP from trade reasoning quality, outcomes, daily brief engagement, and streak bonuses
- Daily streak tracking with consecutive-day bonus XP
- Beginner mode with guided tooltips and contextual explanations throughout
- Interactive guided tour for first-time users

### 📊 Portfolio & Profile
- Real-time portfolio: positions, cost basis, P&L, day change, all-time return
- Per-position breakdown with asset class labeling
- Trade history with mentor analysis attached to every trade
- Profile page with XP progress, level badge, and total stats

### 🗺️ Beginner Guidance Layer
- Beginner mode with in-context explanations on every screen
- Interactive guided tour (step-by-step walkthrough)
- LearnSheet: on-demand concept glossary available from any page
- Context-sensitive prompts that link concepts to the user's actual next move

---

## 🔧 How It Works

### Architecture Overview
```text
User → Trade Page → [Alpha pre-trade chat] → Trade Confirmation → Firebase
↓
Move Rating (AI) + XP
↓
Post-Trade Card (feedback)
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| Routing | React Router DOM v7 |
| Auth & Database | Firebase Authentication + Firestore |
| Market Data | Finnhub API (stocks/ETFs) + CryptoService (crypto) |
| AI Mentor | Puter.js — free access to GPT-4o, Claude, and Gemini |
| Hosting | GitHub Pages |
| Styling | Custom CSS variables, mobile-first design |

### Key Design Decisions

**Thesis-first trading**: The UI enforces a mandatory pre-trade chat. You cannot submit a trade order without articulating a thesis to Alpha first. This makes the learning non-skippable.

**Progressive mentor withdrawal**: The `MentorBehavior` type (`directive → collaborative → advisory → autonomous`) gates how much Alpha volunteers. At level 1, it tells you what to consider. At level 9, it only speaks when spoken to.

**Move ratings decouple outcome from quality**: A stock going up doesn't mean the trade was good. Alpha rates the *reasoning*, not the result — preventing outcome bias from becoming a learned habit.

**Free, no API keys for users**: All AI calls run through Puter.js, which provides free AI API access. Users never need to configure anything.

---

## 🚀 Running Locally

```bash
git clone https://github.com/lillianwang112/alphamove.git
cd alphamove
npm install
cp .env.example .env   # add your Finnhub API key and Firebase config
npm run dev
```

Requires a Finnhub API key (free tier works) and a Firebase project. See `.env.example` for all required variables.

---

## 📁 Project Structure

```text
src/
├── components/
│   ├── brief/           # Morning Brief card
│   ├── guidance/        # Tour, LearnSheet, TourAnchor
│   ├── leveling/        # XP bar, level badges
│   ├── mentor/          # MentorChat, PostTradeCard
│   ├── onboarding/      # Onboarding flow
│   ├── portfolio/       # Portfolio summary, positions
│   └── trade/           # TickerSearch, TradeForm, OptionsChain, AssetClassSelector
├── config/
│   ├── constants.ts     # Level configs, XP thresholds, move rating XP
│   ├── finnhub.ts       # Market data config
│   └── firebase.ts      # Firebase config
├── context/
│   └── GuidanceContext  # Beginner mode, tour state
├── hooks/               # useAuth, usePortfolio, useTrade, useMentor, useXP, useMarketData
├── pages/               # HomePage, TradePage, MentorPage, PortfolioPage, ProfilePage
├── services/            # mentorService, tradeService, portfolioService, xpService, newsService
└── types/               # Full TypeScript interfaces for User, Trade, Portfolio, XP, etc.
```

---

## 💡 What Makes This Different

| Feature | Robinhood | Investopedia Sim | AlphaMove |
|---------|-----------|-----------------|-----------|
| Real money risk | Yes | No | No |
| AI mentor | No | No | ✅ Yes |
| Pre-trade reasoning gate | No | No | ✅ Yes |
| Move quality rating | No | No | ✅ Yes |
| Adaptive mentor behavior | No | No | ✅ Yes |
| Multi-asset (stocks + ETFs + crypto + options) | Yes | Limited | ✅ Yes |
| Gamified progression | No | No | ✅ Yes |
| Free, no account required to explore | No | Partial | ✅ Yes |
| Beginner guidance layer | No | No | ✅ Yes |

---

## 🔮 What's Next

- [ ] Streak leaderboard and social comparison
- [ ] Earnings calendar with pre-earnings thesis prompts
- [ ] Sector diversification score
- [ ] Real brokerage transition guide (Level 10 graduation feature)
- [ ] Voice input for thesis dictation
- [ ] Mentor tone customization (Socratic / Direct / Encouraging)

---

## 👤 About

Built by **Lillian Wang** and **Heidi Hu** — Princeton University, Spring 2026

AlphaMove started from a simple frustration: every investing app either treats you like you already know what you're doing, or gives you a toy with no real feedback loop. The goal was to build the mentor that most people never get — one that asks the right questions, rates your thinking honestly, and gets out of the way once you don't need it anymore.

Questions or feedback: [lw3319@princeton.edu](mailto:lw3319@princeton.edu), [hh8898@princeton.edu](mailto:hh8898@princeton.edu)
