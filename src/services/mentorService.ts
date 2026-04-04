import type { Trade, Portfolio, MoveRating, MorningBrief, NewsEvent } from '../types';
import { Timestamp } from 'firebase/firestore';

// ─── Puter AI Type Declaration ────────────────────

declare global {
  interface Window {
    puter: {
      ai: {
        chat: (
          messages: string | Array<{ role: string; content: string }>,
          options?: { model?: string }
        ) => Promise<{
          message: {
            content: string | Array<{ text: string }>;
          };
        }>;
      };
    };
  }
}

// ─── AI Helper ────────────────────────────────────

async function waitForPuter(timeoutMs = 8000): Promise<void> {
  const w = window as unknown as { puter?: { ai?: { chat?: unknown } } };
  if (w.puter?.ai?.chat) return;
  const start = Date.now();
  await new Promise<void>((resolve, reject) => {
    const check = () => {
      if (w.puter?.ai?.chat) { resolve(); return; }
      if (Date.now() - start > timeoutMs) { reject(new Error('Puter AI SDK timed out')); return; }
      setTimeout(check, 100);
    };
    check();
  });
}

async function callAI(messages: Array<{ role: string; content: string }>): Promise<string> {
  try {
    await waitForPuter();

    const response = await window.puter.ai.chat(messages, { model: 'claude-3-7-sonnet' });
    const content = response?.message?.content;
    if (!content) throw new Error('Empty AI response');

    if (typeof content === 'string') {
      return content;
    }
    if (Array.isArray(content)) {
      return content.map((c) => (typeof c === 'object' && 'text' in c ? c.text : String(c))).join('');
    }
    return String(content);
  } catch (err) {
    console.error('callAI error:', err);
    throw err;
  }
}

function extractJSON(text: string): string {
  // Try to extract JSON from markdown code blocks or raw text
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) return codeBlockMatch[1];

  // Try to find raw JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];

  return text;
}

// ─── System Prompt Builder ────────────────────────

export function getMentorSystemPrompt(
  level: number,
  cash: number,
  portfolioValue: number,
  positions: Array<{ ticker: string; shares: number; marketValue: number }>
): string {
  const mentorBehavior =
    level <= 2
      ? 'Levels 1-2 (DIRECTIVE): Guide heavily. Explain everything. Ask simple yes/no questions. Suggest what to look at.'
      : level <= 5
      ? 'Levels 3-5 (COLLABORATIVE): Offer 2-3 options. Let the user choose. Explain tradeoffs.'
      : level <= 8
      ? 'Levels 6-8 (ADVISORY): Let the user lead. Comment after. Push back when needed.'
      : 'Levels 9-10 (AUTONOMOUS): Minimal intervention. Only flag major issues.';

  return `You are Alpha, an AI investing mentor inside the AlphaMove app. You teach beginner investors to think clearly about markets by asking sharp questions and giving honest feedback.

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
- Level: ${level}/10
- Cash available: $${cash.toFixed(2)}
- Portfolio value: $${portfolioValue.toFixed(2)}
- Current positions: ${JSON.stringify(positions)}

Adjust your depth based on the user's level:
- ${mentorBehavior}`;
}

// ─── Pre-Trade Chat ───────────────────────────────

export interface PreTradeChatParams {
  uid: string;
  ticker: string;
  companyName: string;
  action: 'buy' | 'sell';
  shares: number;
  price: number;
  userLevel: number;
  cash: number;
  portfolioValue: number;
  positions: Array<{ ticker: string; shares: number; marketValue: number }>;
}

export async function generatePreTradeChat(params: PreTradeChatParams): Promise<string> {
  const {
    ticker,
    companyName,
    action,
    shares,
    price,
    userLevel,
    cash,
    portfolioValue,
    positions,
  } = params;

  const total = shares * price;
  const systemPrompt = getMentorSystemPrompt(userLevel, cash, portfolioValue, positions);

  const preTradePrompt = `You are in PRE-TRADE mode. The user wants to ${action} ${shares} shares of ${ticker} (${companyName}) at ~$${price.toFixed(2)}/share (total: ~$${total.toFixed(2)}).

Your mission: help the user develop a clear thesis for this trade through Socratic questioning. Do NOT approve or reject the trade — help them think it through.

Ask these questions naturally across 2-4 messages (not all at once):
1. "What's your thesis?" — Why do they think this is a good move right now?
2. "What would have to be true?" — What assumptions are they making?
3. "What's the risk?" — What could go wrong? How much could they lose?
4. "How does this fit?" — Does this trade fit their overall portfolio/strategy?

For level 1-2 users, ask ONE question at a time, starting with the simplest: "What made you interested in ${ticker}?"

For level 6+ users, ask a single sharp question: "Walk me through your thesis."

After 2-4 exchanges, summarize their thesis in 2 sentences and ask: "Ready to make this move?"

If the user's reasoning reveals a clear problem (e.g., FOMO buying, no thesis, all-in on one stock), flag it directly but don't block the trade.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: preTradePrompt },
  ];

  return callAI(messages);
}

// ─── Continue Conversation ────────────────────────

export async function continueConversation(
  systemPrompt: string,
  history: Array<{ role: string; content: string }>,
  newMessage: string
): Promise<string> {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: newMessage },
  ];

  return callAI(messages);
}

// ─── Post-Trade Analysis ──────────────────────────

export interface PostTradeAnalysisParams {
  trade: Trade;
  portfolio: Portfolio;
  userLevel: number;
  recentNews?: NewsEvent[];
}

export interface PostTradeAnalysisResult {
  moveRating: MoveRating;
  analysis: string;
  betterMove: string | null;
  xpAwarded: number;
  xpReason: string;
}

export async function generatePostTradeAnalysis(
  params: PostTradeAnalysisParams
): Promise<PostTradeAnalysisResult> {
  const { trade, portfolio, userLevel, recentNews = [] } = params;

  const systemPrompt = getMentorSystemPrompt(
    userLevel,
    portfolio.totalValue - portfolio.totalInvested,
    portfolio.totalValue,
    portfolio.positions.map((p) => ({
      ticker: p.ticker,
      shares: p.shares,
      marketValue: p.marketValue,
    }))
  );

  const newsText =
    recentNews.length > 0
      ? recentNews
          .slice(0, 3)
          .map((n) => `- ${n.headline}: ${n.summary}`)
          .join('\n')
      : 'No recent news available.';

  const postTradePrompt = `You are in POST-TRADE ANALYSIS mode. The user just executed this move:

Trade: ${trade.action} ${trade.shares} shares of ${trade.ticker} at $${trade.priceAtExecution.toFixed(2)}
User's thesis: "${trade.thesis}"
Portfolio after trade: ${JSON.stringify({
    totalValue: portfolio.totalValue,
    totalInvested: portfolio.totalInvested,
    positions: portfolio.positions.map((p) => ({
      ticker: p.ticker,
      shares: p.shares,
      marketValue: p.marketValue,
      totalReturnPct: (p.totalReturnPct * 100).toFixed(1) + '%',
    })),
  })}
Relevant news:
${newsText}

Analyze this move like a chess engine analyzes a position. Provide:

1. **Move Rating** — one of: brilliant, great, good, inaccuracy, mistake, blunder
   - brilliant: exceptional reasoning + timing + portfolio fit + contrarian insight
   - great: solid thesis + good timing + fits portfolio strategy
   - good: reasonable thesis + acceptable risk
   - inaccuracy: minor flaw in reasoning or slightly off timing
   - mistake: flawed thesis, poor risk management, or bad timing
   - blunder: no thesis, FOMO, panic, excessive concentration, or fundamentally misunderstanding the asset

2. **Analysis** — 2-3 sentences explaining the rating. Be specific. Reference their thesis.

3. **Better move** — If the rating is inaccuracy or worse, suggest what stronger reasoning would have been. Not what stock to buy — what REASONING would have been better.

4. **XP award** — suggest XP based on the quality of their reasoning (NOT the trade outcome):
   - brilliant: 100 XP
   - great: 75 XP
   - good: 50 XP
   - inaccuracy: 30 XP
   - mistake: 15 XP
   - blunder: 5 XP

Respond ONLY in this JSON format:
{
  "moveRating": "good",
  "analysis": "Your thesis about...",
  "betterMove": null,
  "xpAwarded": 50,
  "xpReason": "Solid thesis with clear reasoning about..."
}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: postTradePrompt },
  ];

  const rawResponse = await callAI(messages);

  try {
    const jsonStr = extractJSON(rawResponse);
    const parsed = JSON.parse(jsonStr);

    const validRatings: MoveRating[] = ['brilliant', 'great', 'good', 'inaccuracy', 'mistake', 'blunder'];
    const moveRating: MoveRating = validRatings.includes(parsed.moveRating)
      ? parsed.moveRating
      : 'good';

    return {
      moveRating,
      analysis: parsed.analysis || 'Trade executed successfully.',
      betterMove: parsed.betterMove || null,
      xpAwarded: typeof parsed.xpAwarded === 'number' ? parsed.xpAwarded : 50,
      xpReason: parsed.xpReason || 'Trade completed.',
    };
  } catch (err) {
    console.error('Failed to parse post-trade analysis JSON:', err, rawResponse);
    return {
      moveRating: 'good',
      analysis: rawResponse.slice(0, 300),
      betterMove: null,
      xpAwarded: 50,
      xpReason: 'Trade completed.',
    };
  }
}

// ─── Morning Brief ────────────────────────────────

export interface MorningBriefParams {
  uid: string;
  portfolio: Portfolio;
  level: number;
  news: NewsEvent[];
  marketNews: NewsEvent[];
}

export interface MorningBriefAIResult {
  greeting: string;
  portfolioSummary: string;
  newsEvents: Array<{
    headline: string;
    whyItMatters: string;
    actionToConsider: string;
  }>;
  dailyQuestion: string | null;
}

export async function generateMorningBriefAI(
  params: MorningBriefParams
): Promise<MorningBriefAIResult> {
  const { portfolio, level, news, marketNews } = params;

  const systemPrompt = getMentorSystemPrompt(
    level,
    portfolio.totalValue - portfolio.totalInvested,
    portfolio.totalValue,
    portfolio.positions.map((p) => ({
      ticker: p.ticker,
      shares: p.shares,
      marketValue: p.marketValue,
    }))
  );

  const allNews = [...news, ...marketNews].slice(0, 8);
  const newsText = allNews.map((n) => `- ${n.headline}: ${n.summary}`).join('\n');

  const briefPrompt = `You are in MORNING BRIEF mode. Generate a personalized market brief for this user.

User's portfolio: ${JSON.stringify({
    positions: portfolio.positions.map((p) => ({
      ticker: p.ticker,
      shares: p.shares,
      marketValue: p.marketValue.toFixed(2),
      totalReturnPct: (p.totalReturnPct * 100).toFixed(1) + '%',
    })),
    totalValue: portfolio.totalValue.toFixed(2),
    allTimeReturn: portfolio.allTimeReturn.toFixed(2),
  })}
User's level: ${level}
Recent news for their holdings and market:
${newsText}

Structure your brief as:

1. **Portfolio overnight** — What happened to their holdings? Plain English, no jargon.

2. **News that matters to YOU** — Pick 2-3 news events relevant to their holdings. For EACH: explain what happened, why it matters for their specific position, and what to watch for.

3. **Today's question** (levels 1-5 only) — End with a thought-provoking question that teaches a concept.

For level 1-2 users, keep it very simple. Short sentences.
For level 6+ users, be more analytical. Include sector trends.

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
  "dailyQuestion": "..."
}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: briefPrompt },
  ];

  const rawResponse = await callAI(messages);

  try {
    const jsonStr = extractJSON(rawResponse);
    const parsed = JSON.parse(jsonStr);
    return {
      greeting: parsed.greeting || 'Good morning!',
      portfolioSummary: parsed.portfolioSummary || '',
      newsEvents: Array.isArray(parsed.newsEvents) ? parsed.newsEvents : [],
      dailyQuestion: parsed.dailyQuestion || null,
    };
  } catch (err) {
    console.error('Failed to parse morning brief JSON:', err, rawResponse);
    return {
      greeting: 'Good morning!',
      portfolioSummary: rawResponse.slice(0, 500),
      newsEvents: [],
      dailyQuestion: null,
    };
  }
}

// ─── Thesis Scorer ────────────────────────────────

export interface ThesisScoreResult {
  clarity: { score: number; note: string };
  riskAwareness: { score: number; note: string };
  macroAwareness: { score: number; note: string };
  overallFeedback: string;
  canProceed: boolean;
}

export async function scoreThesis(
  thesis: string,
  ticker: string,
  action: 'buy' | 'sell',
  userLevel: number
): Promise<ThesisScoreResult> {
  const systemPrompt = `You are Alpha, an investing mentor. Score investing theses honestly and concisely. Always respond ONLY with valid JSON.`;

  const userPrompt = `Score this investing thesis for a Level ${userLevel} investor wanting to ${action} ${ticker}.

Thesis: "${thesis}"

Rate each dimension 1-5 (1=poor, 5=excellent) and give a 1-sentence note:
- clarity: Is the reasoning specific and falsifiable?
- riskAwareness: Does the user acknowledge downside risk?
- macroAwareness: Is the thesis connected to current market conditions?

Also give: overallFeedback (2 encouraging but honest sentences), canProceed (true if average score >= 2.0)

Respond ONLY in this exact JSON format:
{
  "clarity": { "score": 3, "note": "..." },
  "riskAwareness": { "score": 2, "note": "..." },
  "macroAwareness": { "score": 2, "note": "..." },
  "overallFeedback": "...",
  "canProceed": true
}`;

  const raw = await callAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  try {
    const parsed = JSON.parse(extractJSON(raw)) as ThesisScoreResult;
    return parsed;
  } catch {
    return {
      clarity: { score: 3, note: 'Your thesis shows some reasoning but could be more specific.' },
      riskAwareness: { score: 2, note: 'Consider what could go wrong with this trade.' },
      macroAwareness: { score: 2, note: 'Try connecting your thesis to current market conditions.' },
      overallFeedback: 'Your thesis shows intent. Before you commit, make sure you can answer: what would prove you wrong? That\'s the mark of disciplined thinking.',
      canProceed: true,
    };
  }
}

// ─── Coach Guidance ───────────────────────────────

export interface CoachGuidanceResult {
  points: string[];
}

export async function generateCoachGuidance(
  widgetName: string,
  contextData: string,
  userLevel: number
): Promise<CoachGuidanceResult> {
  const systemPrompt = `You are Alpha, an investing mentor. Give specific, actionable coaching points for beginner investors. Always respond ONLY with valid JSON.`;

  const userPrompt = `A Level ${userLevel} investor is looking at their ${widgetName}. Here is the data:

${contextData}

Give exactly 3 specific things they should notice or think about. Each point should be 1-2 sentences, concrete, and educational — not generic advice.
Think like a good coach pointing out what a beginner would miss.

Respond ONLY in this exact JSON format:
{ "points": ["...", "...", "..."] }`;

  const raw = await callAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  try {
    const parsed = JSON.parse(extractJSON(raw)) as CoachGuidanceResult;
    if (!Array.isArray(parsed.points) || parsed.points.length === 0) throw new Error('Invalid');
    return { points: parsed.points.slice(0, 3) };
  } catch {
    return {
      points: [
        'Compare what you expected to see vs. what\'s actually here — the gap is your learning.',
        'Look for the number that surprises you most and ask why it moved that way.',
        'Before acting, ask: would this data change my thesis, or am I just looking for confirmation?',
      ],
    };
  }
}

// ─── Scenario Replay ─────────────────────────────

export interface ScenarioCase {
  title: string;
  description: string;
  priceTarget: number;
  probability: string;
}

export interface ScenarioReplayResult {
  bull: ScenarioCase;
  base: ScenarioCase;
  bear: ScenarioCase;
}

export async function generateScenarioReplay(
  ticker: string,
  action: 'buy' | 'sell',
  thesis: string,
  currentPrice: number,
  userLevel: number
): Promise<ScenarioReplayResult> {
  const systemPrompt = `You are Alpha, an investing mentor teaching through scenarios. Always respond ONLY with valid JSON.`;

  const userPrompt = `A Level ${userLevel} investor just ${action === 'buy' ? 'bought' : 'sold'} ${ticker} at $${currentPrice.toFixed(2)}.
Their thesis: "${thesis}"

Generate 3 realistic 3-month scenarios as educational examples. Make them specific to ${ticker} and the current market context.

Rules:
- Bull: optimistic but plausible (+10% to +40% for stocks). Give a specific catalyst.
- Base: most likely path given current conditions (-5% to +15%). Be realistic.
- Bear: downside case that a careful investor should plan for (-10% to -35%). Be specific about what could go wrong.
- Probabilities should sum to roughly 100%.

Respond ONLY in this exact JSON format:
{
  "bull": { "title": "...", "description": "...", "priceTarget": 0, "probability": "X%" },
  "base": { "title": "...", "description": "...", "priceTarget": 0, "probability": "X%" },
  "bear": { "title": "...", "description": "...", "priceTarget": 0, "probability": "X%" }
}`;

  const raw = await callAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  try {
    const parsed = JSON.parse(extractJSON(raw)) as ScenarioReplayResult;
    return parsed;
  } catch {
    const bullPrice = currentPrice * 1.18;
    const basePrice = currentPrice * 1.04;
    const bearPrice = currentPrice * 0.85;
    return {
      bull: {
        title: 'Strong growth momentum continues',
        description: `${ticker} outperforms as positive catalysts materialize. Your thesis proves directionally correct.`,
        priceTarget: Math.round(bullPrice * 100) / 100,
        probability: '25%',
      },
      base: {
        title: 'Steady but modest movement',
        description: `${ticker} tracks broadly with the market. No major surprises in either direction.`,
        priceTarget: Math.round(basePrice * 100) / 100,
        probability: '50%',
      },
      bear: {
        title: 'Macro headwinds or company-specific setback',
        description: `${ticker} faces pressure from factors outside your thesis. A good lesson in position sizing.`,
        priceTarget: Math.round(bearPrice * 100) / 100,
        probability: '25%',
      },
    };
  }
}

// ─── Convert AI Brief to MorningBrief type ────────

export function buildMorningBrief(
  uid: string,
  aiResult: MorningBriefAIResult,
  sourceNews: NewsEvent[]
): Omit<MorningBrief, 'id'> {
  const today = new Date().toISOString().split('T')[0];

  // Map AI news events back to NewsEvent format
  const enrichedNews: NewsEvent[] = aiResult.newsEvents.map((aiNews, idx) => {
    const source = sourceNews[idx] || sourceNews[0];
    return {
      id: source?.id || String(idx),
      headline: aiNews.headline,
      summary: aiNews.whyItMatters,
      source: source?.source || 'AlphaMove',
      url: source?.url || '',
      relatedTickers: source?.relatedTickers || [],
      publishedAt: source?.publishedAt || Timestamp.now(),
      mentorAnalysis: aiNews.whyItMatters,
      impactOnPortfolio: aiNews.actionToConsider,
    };
  });

  return {
    uid,
    date: today,
    newsEvents: enrichedNews,
    portfolioSummary: aiResult.portfolioSummary,
    suggestedActions: aiResult.newsEvents.map((n) => n.actionToConsider).filter(Boolean),
    createdAt: Timestamp.now(),
  };
}
