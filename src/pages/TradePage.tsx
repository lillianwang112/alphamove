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
import StockDetail from '../components/trade/StockDetail';
import TradeForm from '../components/trade/TradeForm';
import MentorChat from '../components/mentor/MentorChat';
import TradeConfirmation from '../components/trade/TradeConfirmation';
import PostTradeCard from '../components/mentor/PostTradeCard';
import LevelUpModal from '../components/leveling/LevelUpModal';
import TourAnchor from '../components/guidance/TourAnchor';
import LearnSheet from '../components/guidance/LearnSheet';
import AssetClassSelector from '../components/trade/AssetClassSelector';
import MarketOverview from '../components/trade/MarketOverview';
import OptionsChain from '../components/trade/OptionsChain';
import { getCryptoQuote, getCryptoName } from '../services/cryptoService';
import type { TradeAction, MentorMessage, MentorConversation, MoveRating, AssetClass, OptionContract } from '../types';
import type { OrderType, TimeInForce } from '../components/trade/TradeForm';
import ThesisInput from '../components/trade/ThesisInput';
import ThesisScore from '../components/trade/ThesisScore';
import ScenarioReplay from '../components/mentor/ScenarioReplay';
import { scoreThesis, generateScenarioReplay } from '../services/mentorService';
import type { ThesisScoreResult, ScenarioReplayResult } from '../services/mentorService';

type TradeStep =
  | 'search'
  | 'preview'
  | 'thesis_input'
  | 'thesis_score'
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
  const { user, updateUser } = useAuth();
  const { beginnerMode, tradeMode, setTradeMode } = useGuidance();
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

  // Asset class
  const [assetClass, setAssetClass] = useState<AssetClass>('stock');
  const [optionContract, setOptionContract] = useState<OptionContract | null>(null);

  // Order type
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [limitPrice, setLimitPrice] = useState<number | undefined>(undefined);
  const [timeInForce, setTimeInForce] = useState<TimeInForce>('day');
  const [trailingPct, setTrailingPct] = useState<number | undefined>(undefined);

  // Mentor chat
  const [conversation, setConversation] = useState<MentorConversation | null>(null);
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [readyToExecute, setReadyToExecute] = useState(false);
  const [mentorSummary, setMentorSummary] = useState('');

  // Trade execution
  const [tradeLoading, setTradeLoading] = useState(false);

  // Thesis scoring
  const [thesis, setThesis] = useState('');
  const [thesisScores, setThesisScores] = useState<ThesisScoreResult | null>(null);
  const [thesisScoring, setThesisScoring] = useState(false);

  // Scenario replay
  const [scenarioData, setScenarioData] = useState<ScenarioReplayResult | null>(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);

  // Post-trade
  const [postTradeResult, setPostTradeResult] = useState<PostTradeResult | null>(null);
  const [learnOpen, setLearnOpen] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ newLevel: number } | null>(null);

  const loadQuote = useCallback(async (sym: string, act: TradeAction, name?: string, cls?: AssetClass) => {
    setQuoteLoading(true);
    const resolvedClass = cls ?? assetClass;
    try {
      if (resolvedClass === 'crypto') {
        const cryptoQ = await getCryptoQuote(sym);
        const cryptoQuoteData = {
          price: cryptoQ.price,
          change: cryptoQ.change24h,
          changePct: cryptoQ.changePct24h,
          high: cryptoQ.price * 1.03,
          low: cryptoQ.price * 0.97,
          open: cryptoQ.price - cryptoQ.change24h,
          prevClose: cryptoQ.price - cryptoQ.change24h,
        };
        setQuote(cryptoQuoteData);
        setProfile({
          name: getCryptoName(sym),
          ticker: sym,
          logo: '',
          industry: 'Cryptocurrency',
          marketCap: cryptoQ.marketCap,
          weburl: '',
        });
        setAction(act);
        if (name) setCompanyName(name);
        else setCompanyName(getCryptoName(sym));
      } else {
        const [q, p] = await Promise.all([
          getQuote(sym),
          getCompanyProfile(sym).catch(() => null),
        ]);
        setQuote(q);
        setProfile(p);
        setAction(act);
        if (p?.name) setCompanyName(p.name);
        else if (name) setCompanyName(name);
      }
      setStep('preview');
    } catch (err) {
      console.error('Failed to load quote:', err);
    } finally {
      setQuoteLoading(false);
    }
  }, [getCompanyProfile, getQuote, assetClass]);

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

  const needsThesis = beginnerMode && tradeMode === 'learning';

  const handleBuy = () => { setAction('buy'); setThesis(''); setThesisScores(null); setStep(needsThesis ? 'thesis_input' : 'trade_form'); };
  const handleSell = () => { setAction('sell'); setThesis(''); setThesisScores(null); setStep(needsThesis ? 'thesis_input' : 'trade_form'); };

  const handleThesisSubmit = async (text: string) => {
    setThesis(text);
    setThesisScoring(true);
    setStep('thesis_score');
    try {
      const scores = await scoreThesis(text, ticker, action, user?.level ?? 1);
      setThesisScores(scores);
    } finally {
      setThesisScoring(false);
    }
  };

  const handleThesisProceed = () => {
    setStep('trade_form');
  };

  const handleSharesSubmit = async (numShares: number, ot: OrderType, lp?: number, tif?: TimeInForce, trailPct?: number) => {
    setShares(numShares);
    setOrderType(ot);
    setLimitPrice(lp);
    if (tif) setTimeInForce(tif);
    if (trailPct !== undefined) setTrailingPct(trailPct);

    // Simulation mode: skip mentor, go straight to confirmation
    if (tradeMode === 'simulation') {
      setStep('confirmation');
      return;
    }

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
      // Pre-fill mentor summary with the thesis
      if (thesis) {
        setMentorSummary(`User thesis: ${thesis}`);
      }
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

  const handleOptionSelect = async (contract: OptionContract) => {
    setOptionContract(contract);
    setShares(contract.contracts * 100); // 1 contract = 100 shares

    if (tradeMode === 'simulation') {
      setStep('confirmation');
      return;
    }

    if (!user) return;
    setChatLoading(true);
    const portfolioForMentor = portfolio ?? {
      positions: [],
      totalValue: user.currentCash ?? 0,
      totalInvested: 0,
      dayChange: 0,
      dayChangePct: 0,
      allTimeReturn: 0,
      allTimeReturnPct: 0,
    };
    try {
      const conv = await startPreTradeChat({
        uid: user.uid,
        ticker: `${ticker} ${contract.optionType.toUpperCase()} $${contract.strikePrice} ${contract.expirationLabel}`,
        companyName: contract.underlyingName,
        action: 'buy',
        shares: contract.contracts,
        price: contract.premium * 100,
        userLevel: user.level ?? 1,
        portfolio: portfolioForMentor,
      });
      setConversation(conv);
      setMessages(conv.messages);
    } catch {
      const fallbackConv: MentorConversation = {
        id: `fallback-${Date.now()}`,
        uid: user?.uid ?? '',
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

      // Use limit price for non-market orders (simulated fill at specified price)
      const executionPrice = (orderType !== 'market' && limitPrice) ? limitPrice : quote.price;

      const trade = await executeTrade({
        uid: user.uid,
        ticker,
        companyName: companyName || profile?.name || ticker,
        action,
        shares,
        price: executionPrice,
        thesis: userThesis,
        mentorPreTradeAnalysis: mentorSummary,
      });

      // In simulation mode, skip post-trade analysis
      if (tradeMode === 'simulation') {
        setPostTradeResult({
          analysis: 'Trade executed in simulation mode. Switch to Learning mode for AI mentor feedback.',
          moveRating: 'good',
          xpEarned: 0,
          xpReason: 'Simulation mode — no XP awarded',
          betterMove: null,
        });
        setStep('post_trade');
        return;
      }

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
      const xpResult = await awardXP({
        uid: user.uid,
        source: 'trade_outcome',
        amount: analysis.xpEarned,
        reason: `${analysis.moveRating} move on ${ticker}`,
        tradeId: trade.id,
      });

      // Sync local user state with new XP/level from Firestore
      await updateUser({ xp: xpResult.newXP, level: xpResult.newLevel });

      if (xpResult.leveledUp) {
        setLevelUpData({ newLevel: xpResult.newLevel });
      }

      setStep('post_trade');

      // Generate scenario replay in background
      setScenarioLoading(true);
      generateScenarioReplay(ticker, action, userThesis, executionPrice, user.level ?? 1)
        .then((scenarios) => setScenarioData(scenarios))
        .catch(() => {})
        .finally(() => setScenarioLoading(false));
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
    setOrderType('market');
    setLimitPrice(undefined);
    setTimeInForce('day');
    setTrailingPct(undefined);
    setAssetClass('stock');
    setOptionContract(null);
    setThesis('');
    setThesisScores(null);
    setScenarioData(null);
  };

  const currentPosition = positions.find((p) => p.ticker === ticker);
  const availableCash = portfolio
    ? portfolio.totalValue - portfolio.totalInvested
    : user?.currentCash ?? 0;

  const STEPS_ORDERED: TradeStep[] = ['search', 'preview', 'thesis_input', 'thesis_score', 'trade_form', 'mentor_chat', 'confirmation', 'post_trade'];

  // For options: the effective price and shares at confirmation
  const optionEffectivePrice = optionContract ? optionContract.premium * 100 : 0;
  const optionTotalCost = optionContract ? optionContract.premium * 100 * optionContract.contracts : 0;

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {step === 'search' && 'Make a Move'}
              {step === 'preview' && (ticker || 'Stock Preview')}
              {step === 'trade_form' && `${action === 'buy' ? 'Buy' : 'Sell'} ${ticker}`}
              {step === 'thesis_input' && 'Your Thesis'}
              {step === 'thesis_score' && 'Alpha\'s Verdict'}
              {step === 'mentor_chat' && 'Pre-Trade Review'}
              {step === 'confirmation' && 'Confirm Trade'}
              {step === 'post_trade' && 'Move Evaluated'}
            </h1>
            {/* Trade mode toggle */}
            <div
              onClick={() => setTradeMode(tradeMode === 'learning' ? 'simulation' : 'learning')}
              style={{
                display: 'flex', alignItems: 'center', background: 'var(--surface)',
                border: '1px solid var(--border)', borderRadius: '999px',
                padding: '2px', cursor: 'pointer', userSelect: 'none', flexShrink: 0,
              }}
              title={tradeMode === 'learning' ? 'Switch to Simulation mode' : 'Switch to Learning mode'}
            >
              {(['learning', 'simulation'] as const).map((mode) => (
                <span key={mode} style={{
                  padding: '4px 10px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700,
                  background: tradeMode === mode ? 'var(--accent)' : 'transparent',
                  color: tradeMode === mode ? 'white' : 'var(--text-muted)',
                  transition: 'all 0.2s ease',
                }}>
                  {mode === 'learning' ? 'Learn' : 'Sim'}
                </span>
              ))}
            </div>
          </div>
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
          {tradeMode === 'simulation' && (
            <div style={{
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#F59E0B',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginTop: '6px',
              display: 'inline-block',
            }}>
              Simulation Mode — No mentor review
            </div>
          )}
        </div>
      </div>

      {/* Loading state after ticker selection */}
      {quoteLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.2s ease' }}>
          <div className="skeleton" style={{ height: '200px', borderRadius: '16px' }} />
          <div className="skeleton" style={{ height: '80px', borderRadius: '12px' }} />
          <div className="skeleton" style={{ height: '120px', borderRadius: '12px' }} />
        </div>
      )}

      {/* Search step */}
      {step === 'search' && !quoteLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'slideInUp 0.4s ease both' }}>
          {/* Market overview — quick-tap any ticker to load it */}
          <MarketOverview onSelect={(sym, name) => handleTickerSelect(sym, name)} />

          {/* Asset class selector */}
          <AssetClassSelector
            value={assetClass}
            onChange={(cls) => { setAssetClass(cls); setTicker(''); setCompanyName(''); }}
            userLevel={user?.level ?? 1}
          />

          <TourAnchor id="trade-search">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {assetClass !== 'option' && (
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
                    {assetClass === 'crypto'
                      ? 'Pick a crypto asset you can explain in a sentence.'
                      : assetClass === 'etf'
                      ? 'ETFs let you bet on a sector or the whole market at once.'
                      : 'Start with one company or ETF you can explain in a sentence.'}
                  </p>
                  {tradeMode === 'learning' && (
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                      {assetClass === 'crypto'
                        ? 'Crypto trades 24/7 and is highly volatile. Having a clear thesis matters even more here.'
                        : 'You are not committing real money here. You are practicing how to notice what a business does, why it might move, and what risk you are taking.'}
                    </p>
                  )}
                  {tradeMode === 'learning' && beginnerMode && assetClass === 'stock' && (
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
              )}

              {assetClass === 'option' && (
                <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
                  <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '6px' }}>
                    Step 1: Pick the underlying stock
                  </p>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                    Options are contracts ON a stock. First find the stock you want to trade options on, then you'll pick call/put, strike, and expiration.
                  </p>
                </div>
              )}

              <TickerSearch onSelect={(symbol, name) => {
                setTicker(symbol);
                setCompanyName(name);
                if (assetClass === 'option') {
                  loadQuote(symbol, 'buy', name, 'stock');
                } else {
                  loadQuote(symbol, 'buy', name, assetClass);
                }
              }} />

              {assetClass !== 'crypto' && assetClass !== 'option' && (
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                    {assetClass === 'etf' ? 'Popular ETFs' : 'Popular'}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(assetClass === 'etf'
                      ? ['SPY', 'QQQ', 'VTI', 'GLD', 'IWM', 'ARKK', 'VNQ', 'XLF']
                      : ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'SPY']
                    ).map((sym) => (
                      <button
                        key={sym}
                        onClick={() => {
                          setTicker(sym);
                          setCompanyName(sym);
                          loadQuote(sym, 'buy', sym, assetClass);
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
              )}

              {assetClass === 'crypto' && (
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                    Popular Crypto
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {['BTC', 'ETH', 'SOL', 'DOGE', 'ADA', 'AVAX', 'LINK', 'XRP'].map((sym) => (
                      <button
                        key={sym}
                        onClick={() => {
                          setTicker(sym);
                          setCompanyName(getCryptoName(sym));
                          loadQuote(sym, 'buy', getCryptoName(sym), 'crypto');
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
                          el.style.background = 'rgba(245,158,11,0.15)';
                          el.style.borderColor = '#F59E0B';
                          el.style.color = '#F59E0B';
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
              )}

              {beginnerMode && tradeMode === 'learning' && assetClass === 'stock' && (
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

          {beginnerMode && tradeMode === 'learning' && assetClass === 'stock' && (
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
                    background: 'var(--surface-elevated)',
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

      {/* Preview step — options flow shows OptionsChain instead of StockPreview */}
      {step === 'preview' && quote && assetClass === 'option' && (
        <OptionsChain
          ticker={ticker}
          companyName={companyName || profile?.name || ticker}
          currentPrice={quote.price}
          onSelect={handleOptionSelect}
        />
      )}

      {/* Preview step — normal stock/etf/crypto */}
      {step === 'preview' && quote && assetClass !== 'option' && (
        <StockDetail
          ticker={ticker}
          companyName={companyName || profile?.name || ticker}
          quote={quote}
          profile={profile}
          assetClass={assetClass}
          onBuy={handleBuy}
          onSell={handleSell}
        />
      )}

      {/* Thesis input step */}
      {step === 'thesis_input' && quote && (
        <ThesisInput
          ticker={ticker}
          action={action}
          price={quote.price}
          companyName={companyName || profile?.name || ticker}
          onSubmit={handleThesisSubmit}
          onBack={() => setStep('preview')}
        />
      )}

      {/* Thesis score step */}
      {step === 'thesis_score' && (
        <ThesisScore
          thesis={thesis}
          ticker={ticker}
          action={action}
          scores={thesisScores}
          loading={thesisScoring}
          onProceed={handleThesisProceed}
          onRevise={() => setStep('thesis_input')}
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
          userLevel={user?.level ?? 1}
          simulationMode={tradeMode === 'simulation'}
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
              Reviewing: <strong style={{ color: 'var(--text-primary)' }}>
                {assetClass === 'option' && optionContract
                  ? `${ticker} ${optionContract.optionType.toUpperCase()} $${optionContract.strikePrice} ${optionContract.expirationLabel}`
                  : `${action === 'buy' ? 'Buy' : 'Sell'} ${shares} × ${ticker}`}
              </strong>
            </span>
            {quote && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                {assetClass === 'option' && optionContract
                  ? `~$${optionTotalCost.toFixed(2)}`
                  : `~$${(shares * quote.price).toFixed(2)}`}
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
          ticker={assetClass === 'option' && optionContract
            ? `${ticker} ${optionContract.optionType.toUpperCase()} $${optionContract.strikePrice} ${optionContract.expirationLabel}`
            : ticker}
          shares={assetClass === 'option' && optionContract ? optionContract.contracts : shares}
          price={assetClass === 'option' && optionContract
            ? optionEffectivePrice
            : (orderType !== 'market' && limitPrice) ? limitPrice : quote.price}
          total={assetClass === 'option' && optionContract
            ? optionTotalCost
            : shares * ((orderType !== 'market' && limitPrice) ? limitPrice : quote.price)}
          orderType={orderType}
          timeInForce={timeInForce}
          trailingPct={trailingPct}
          onConfirm={handleConfirmTrade}
          onCancel={() => {
            if (assetClass === 'option') setStep('preview');
            else if (tradeMode === 'simulation') setStep('trade_form');
            else setStep('mentor_chat');
          }}
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
      {step === 'post_trade' && (
        <ScenarioReplay
          ticker={ticker}
          action={action}
          price={quote?.price ?? 0}
          scenarios={scenarioData}
          loading={scenarioLoading}
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

      {/* Level up celebration modal */}
      {levelUpData && (
        <LevelUpModal
          newLevel={levelUpData.newLevel}
          onDismiss={() => setLevelUpData(null)}
        />
      )}
    </div>
  );
}
