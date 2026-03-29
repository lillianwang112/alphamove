import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useMarketData } from '../hooks/useMarketData';
import { useMentor } from '../hooks/useMentor';
import { useTrade } from '../hooks/useTrade';
import { useXP } from '../hooks/useXP';
import { usePortfolio } from '../hooks/usePortfolio';
import { useGuidance } from '../context/GuidanceContext';
import TickerSearch from '../components/trade/TickerSearch';
import StockPreview from '../components/trade/StockPreview';
import TradeForm from '../components/trade/TradeForm';
import MentorChat from '../components/mentor/MentorChat';
import TradeConfirmation from '../components/trade/TradeConfirmation';
import PostTradeCard from '../components/mentor/PostTradeCard';
import TourAnchor from '../components/guidance/TourAnchor';
import LearnSheet from '../components/guidance/LearnSheet';
import type { TradeAction, MentorMessage, MentorConversation, MoveRating } from '../types';

type TradeStep =
  | 'search'
  | 'preview'
  | 'trade_form'
  | 'mentor_chat'
  | 'confirmation'
  | 'post_trade';

interface QuoteData {
  price: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
}

interface ProfileData {
  name: string;
  ticker: string;
  logo: string;
  industry: string;
  marketCap: number;
  weburl: string;
}

interface PostTradeResult {
  analysis: string;
  moveRating: MoveRating;
  xpEarned: number;
  xpReason: string;
  betterMove: string | null;
}

export default function TradePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { beginnerMode } = useGuidance();
  const { getQuote, getCompanyProfile } = useMarketData();
  const { startPreTradeChat, sendMessage, generatePostTradeAnalysis } = useMentor();
  const { executeTrade } = useTrade();
  const { awardXP } = useXP();
  const { portfolio, positions } = usePortfolio(user?.uid ?? '');

  // State machine
  const [step, setStep] = useState<TradeStep>('search');
  const [ticker, setTicker] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [action, setAction] = useState<TradeAction>('buy');
  const [shares, setShares] = useState(0);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // Mentor chat
  const [conversation, setConversation] = useState<MentorConversation | null>(null);
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [readyToExecute, setReadyToExecute] = useState(false);
  const [mentorSummary, setMentorSummary] = useState('');

  // Trade execution
  const [tradeLoading, setTradeLoading] = useState(false);

  // Post-trade
  const [postTradeResult, setPostTradeResult] = useState<PostTradeResult | null>(null);
  const [learnOpen, setLearnOpen] = useState(false);

  const loadQuote = useCallback(async (sym: string, act: TradeAction, name?: string) => {
    setQuoteLoading(true);
    try {
      const [q, p] = await Promise.all([
        getQuote(sym),
        getCompanyProfile(sym).catch(() => null),
      ]);
      setQuote(q);
      setProfile(p);
      setAction(act);
      if (p?.name) setCompanyName(p.name);
      else if (name) setCompanyName(name);
      setStep('preview');
    } catch (err) {
      console.error('Failed to load quote:', err);
    } finally {
      setQuoteLoading(false);
    }
  }, [getCompanyProfile, getQuote]);

  // Handle URL params for sell flow from portfolio
  useEffect(() => {
    const urlTicker = searchParams.get('ticker');
    const urlAction = searchParams.get('action') as TradeAction | null;
    const urlShares = searchParams.get('shares');

    if (urlTicker) {
      setTicker(urlTicker);
      if (urlAction) setAction(urlAction);
      if (urlShares) setShares(parseFloat(urlShares));
      loadQuote(urlTicker, urlAction || 'buy');
    }
  }, [loadQuote, searchParams]);

  const handleTickerSelect = async (symbol: string, name: string) => {
    setTicker(symbol);
    setCompanyName(name);
    await loadQuote(symbol, 'buy', name);
  };

  const handleBuy = () => { setAction('buy'); setStep('trade_form'); };
  const handleSell = () => { setAction('sell'); setStep('trade_form'); };

  const handleSharesSubmit = async (numShares: number) => {
    setShares(numShares);
    if (!quote || !user) {
      setStep('mentor_chat');
      return;
    }
    setChatLoading(true);

    try {
      // Build a sensible portfolio object even if portfolio is null
      const portfolioForMentor = portfolio ?? {
        positions: [],
        totalValue: user.currentCash ?? 0,
        totalInvested: 0,
        dayChange: 0,
        dayChangePct: 0,
        allTimeReturn: 0,
        allTimeReturnPct: 0,
      };

      const conv = await startPreTradeChat({
        uid: user.uid,
        ticker,
        companyName: companyName || profile?.name || ticker,
        action,
        shares: numShares,
        price: quote.price,
        userLevel: user.level ?? 1,
        portfolio: portfolioForMentor,
      });
      setConversation(conv);
      setMessages(conv.messages);
    } catch (err) {
      console.error('Failed to start mentor chat:', err);
      // Create a fallback conversation
      const fallbackConv: MentorConversation = {
        id: `fallback-${Date.now()}`,
        uid: user.uid,
        mode: 'pre_trade',
        messages: [],
        createdAt: null as unknown as MentorConversation['createdAt'],
      };
      setConversation(fallbackConv);
      setMessages([]);
    } finally {
      setChatLoading(false);
      setStep('mentor_chat');
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!conversation || !user) return;
    setChatLoading(true);

    // Optimistic user message
    const optimisticUserMsg: MentorMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      mode: 'pre_trade',
      timestamp: null as unknown as MentorMessage['timestamp'],
    };
    setMessages((prev) => [...prev, optimisticUserMsg]);

    try {
      const cash = portfolio
        ? portfolio.totalValue - portfolio.totalInvested
        : user.currentCash ?? 0;

      const response = await sendMessage({
        conversationId: conversation.id,
        message: text,
        userLevel: user.level ?? 1,
        cash,
        portfolioValue: portfolio?.totalValue ?? user.currentCash ?? 0,
        positions: portfolio?.positions.map((p) => ({
          ticker: p.ticker,
          shares: p.shares,
          marketValue: p.marketValue,
        })) ?? [],
      });

      const nextMessages = [
        ...messages.filter((m) => m.id !== optimisticUserMsg.id),
        optimisticUserMsg,
        response,
      ];
      setMessages(nextMessages);

      // Check if ready to execute
      const lowerContent = response.content.toLowerCase();
      if (
        lowerContent.includes("ready to make this move") ||
        lowerContent.includes("ready to execute") ||
        lowerContent.includes("shall we execute") ||
        lowerContent.includes("want to proceed") ||
        lowerContent.includes("ready to proceed") ||
        lowerContent.includes("go ahead and") ||
        lowerContent.includes("confirmed") ||
        nextMessages.length >= 8
      ) {
        setReadyToExecute(true);
        setMentorSummary(response.content);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleReadyToExecute = () => {
    setStep('confirmation');
  };

  const handleConfirmTrade = async () => {
    if (!quote || !user) return;
    setTradeLoading(true);

    try {
      const userThesis = messages
        .filter((m) => m.role === 'user')
        .map((m) => m.content)
        .join(' | ')
        || 'No thesis provided';

      const trade = await executeTrade({
        uid: user.uid,
        ticker,
        companyName: companyName || profile?.name || ticker,
        action,
        shares,
        price: quote.price,
        thesis: userThesis,
        mentorPreTradeAnalysis: mentorSummary,
      });

      // Generate post-trade analysis
      const portfolioForAnalysis = portfolio ?? {
        positions: [],
        totalValue: user.currentCash ?? 0,
        totalInvested: 0,
        dayChange: 0,
        dayChangePct: 0,
        allTimeReturn: 0,
        allTimeReturnPct: 0,
      };

      const analysis = await generatePostTradeAnalysis({
        trade,
        portfolio: portfolioForAnalysis,
        userLevel: user.level ?? 1,
      });

      setPostTradeResult({
        analysis: analysis.analysis,
        moveRating: analysis.moveRating,
        xpEarned: analysis.xpEarned,
        xpReason: `${analysis.moveRating} move on ${ticker}`,
        betterMove: null,
      });

      // Award XP
      await awardXP({
        uid: user.uid,
        source: 'trade_outcome',
        amount: analysis.xpEarned,
        reason: `${analysis.moveRating} move on ${ticker}`,
        tradeId: trade.id,
      });

      setStep('post_trade');
    } catch (err) {
      console.error('Failed to execute trade:', err);
    } finally {
      setTradeLoading(false);
    }
  };

  const handleDone = () => {
    setStep('search');
    setTicker('');
    setCompanyName('');
    setQuote(null);
    setProfile(null);
    setConversation(null);
    setMessages([]);
    setReadyToExecute(false);
    setMentorSummary('');
    setPostTradeResult(null);
    setShares(0);
  };

  const currentPosition = positions.find((p) => p.ticker === ticker);
  const availableCash = portfolio
    ? portfolio.totalValue - portfolio.totalInvested
    : user?.currentCash ?? 0;

  const STEPS_ORDERED: TradeStep[] = ['search', 'preview', 'trade_form', 'mentor_chat', 'confirmation', 'post_trade'];

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', animation: 'slideInUp 0.3s ease both' }}>
        {step !== 'search' && (
          <button
            onClick={() => {
              if (step === 'post_trade') { handleDone(); return; }
              const idx = STEPS_ORDERED.indexOf(step);
              if (idx > 0) setStep(STEPS_ORDERED[idx - 1]);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {step === 'search' && 'Make a Move'}
            {step === 'preview' && (ticker || 'Stock Preview')}
            {step === 'trade_form' && `${action === 'buy' ? 'Buy' : 'Sell'} ${ticker}`}
            {step === 'mentor_chat' && 'Pre-Trade Review'}
            {step === 'confirmation' && 'Confirm Trade'}
            {step === 'post_trade' && 'Move Evaluated'}
          </h1>
          {step !== 'search' && step !== 'post_trade' && (
            <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
              {(['preview', 'trade_form', 'mentor_chat', 'confirmation'] as TradeStep[]).map((s, i) => {
                const currentIdx = ['preview', 'trade_form', 'mentor_chat', 'confirmation'].indexOf(step);
                return (
                  <div
                    key={s}
                    style={{
                      height: '3px',
                      flex: 1,
                      borderRadius: '2px',
                      background: currentIdx >= i ? 'var(--accent)' : 'var(--surface-elevated)',
                      transition: 'background 0.3s ease',
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Search step */}
      {step === 'search' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'slideInUp 0.4s ease both' }}>
          <TourAnchor id="trade-search">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 600, margin: 0 }}>
                  Start with one company or ETF you can explain in a sentence.
                </p>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                  You are not committing real money here. You are practicing how to notice what a business does, why it might move, and what risk you are taking.
                </p>
                {beginnerMode && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setLearnOpen(true)}
                      className="btn btn-ghost"
                      style={{ padding: '10px 12px', fontSize: '0.8rem' }}
                    >
                      Learn before searching
                    </button>
                    <button
                      onClick={() => navigate('/mentor', {
                        state: {
                          suggestedPrompt: 'I am new. Help me choose a simple first stock or ETF to analyze and explain why.',
                        },
                      })}
                      className="btn btn-secondary"
                      style={{ padding: '10px 12px', fontSize: '0.8rem' }}
                    >
                      Ask Alpha what to analyze
                    </button>
                  </div>
                )}
              </div>

              <TickerSearch onSelect={handleTickerSelect} />

              {beginnerMode && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                  Try typing a company you know, like Apple or Microsoft, or start with SPY if you want to practice on a broad market ETF instead of one company.
                </p>
              )}
            </div>
          </TourAnchor>

          {quoteLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  border: '3px solid var(--border)',
                  borderTopColor: 'var(--accent)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            </div>
          )}

          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Popular
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'SPY'].map((sym) => (
                <button
                  key={sym}
                  onClick={() => {
                    setTicker(sym);
                    setCompanyName(sym);
                    loadQuote(sym, 'buy', sym);
                  }}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 14px',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.background = 'var(--accent-light)';
                    el.style.borderColor = 'var(--accent)';
                    el.style.color = 'var(--accent)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.background = 'var(--surface)';
                    el.style.borderColor = 'var(--border)';
                    el.style.color = 'var(--text-secondary)';
                  }}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          {beginnerMode && (
            <div
              style={{
                display: 'grid',
                gap: '10px',
              }}
            >
              {[
                {
                  title: 'Start with Apple',
                  body: 'A familiar company is easier to reason about because you already know the product and the business.',
                  action: () => handleTickerSelect('AAPL', 'Apple Inc'),
                },
                {
                  title: 'Try a broad ETF',
                  body: 'SPY lets you practice with the wider market instead of betting your whole idea on one company.',
                  action: () => handleTickerSelect('SPY', 'SPDR S&P 500 ETF Trust'),
                },
                {
                  title: 'Compare company vs ETF with Alpha',
                  body: 'If you are unsure whether to start with one stock or the whole market, let Alpha frame the tradeoff first.',
                  action: () => navigate('/mentor', {
                    state: {
                      suggestedPrompt: 'Compare starting with Apple versus starting with SPY for a beginner paper trader.',
                    },
                  }),
                },
              ].map((starter) => (
                <button
                  key={starter.title}
                  onClick={starter.action}
                  style={{
                    background: 'linear-gradient(135deg, rgba(28, 28, 46, 1) 0%, rgba(20, 20, 31, 1) 100%)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '14px 16px',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {starter.title}
                  </p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                    {starter.body}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview step */}
      {step === 'preview' && quote && (
        <StockPreview
          ticker={ticker}
          companyName={companyName || profile?.name || ticker}
          quote={quote}
          profile={profile}
          onBuy={handleBuy}
          onSell={handleSell}
        />
      )}

      {/* Trade form step */}
      {step === 'trade_form' && quote && (
        <TradeForm
          action={action}
          ticker={ticker}
          price={quote.price}
          availableCash={availableCash}
          maxShares={action === 'sell' ? currentPosition?.shares : undefined}
          onSubmit={handleSharesSubmit}
          onBack={() => setStep('preview')}
        />
      )}

      {/* Mentor chat step */}
      {step === 'mentor_chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Trade context banner */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Reviewing: <strong style={{ color: 'var(--text-primary)' }}>{action === 'buy' ? 'Buy' : 'Sell'} {shares} × {ticker}</strong>
            </span>
            {quote && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                ~${(shares * quote.price).toFixed(2)}
              </span>
            )}
          </div>

          <div style={{ height: '460px' }}>
            <MentorChat
              messages={messages}
              onSend={handleSendMessage}
              loading={chatLoading}
              readyToExecute={readyToExecute}
              onExecute={handleReadyToExecute}
            />
          </div>

          {!readyToExecute && messages.length >= 2 && (
            <button
              onClick={() => { setReadyToExecute(true); setStep('confirmation'); }}
              className="btn btn-ghost btn-full btn-sm"
            >
              Skip mentor review →
            </button>
          )}
        </div>
      )}

      {/* Confirmation step */}
      {step === 'confirmation' && quote && (
        <TradeConfirmation
          action={action}
          ticker={ticker}
          shares={shares}
          price={quote.price}
          total={shares * quote.price}
          onConfirm={handleConfirmTrade}
          onCancel={() => setStep('mentor_chat')}
          loading={tradeLoading}
        />
      )}

      {/* Post-trade step */}
      {step === 'post_trade' && postTradeResult && (
        <PostTradeCard
          analysis={postTradeResult.analysis}
          moveRating={postTradeResult.moveRating}
          xpEarned={postTradeResult.xpEarned}
          xpReason={postTradeResult.xpReason}
          betterMove={postTradeResult.betterMove}
          onDone={handleDone}
        />
      )}

      <LearnSheet
        open={learnOpen}
        onClose={() => setLearnOpen(false)}
        initialTopic="etf"
        onAskAlpha={(topic) => {
          setLearnOpen(false);
          navigate('/mentor', {
            state: {
              suggestedPrompt: `Teach me ${topic} in plain English, then suggest a beginner-friendly way to practice it in AlphaMove.`,
            },
          });
        }}
      />
    </div>
  );
}
