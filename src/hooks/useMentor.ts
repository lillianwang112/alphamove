import { useState, useCallback } from 'react';
import { Timestamp } from 'firebase/firestore';
import type {
  MentorConversation,
  MentorMessage,
  MentorMode,
  MoveRating,
  Portfolio,
  Trade,
  MorningBrief,
} from '../types';
import {
  generatePreTradeChat,
  continueConversation,
  generatePostTradeAnalysis,
  getMentorSystemPrompt,
} from '../services/mentorService';
import {
  generateAndSaveMorningBrief,
} from '../services/newsService';

type TradeAction = 'buy' | 'sell';

export interface StartPreTradeChatParams {
  uid: string;
  ticker: string;
  companyName: string;
  action: TradeAction;
  shares: number;
  price: number;
  userLevel: number;
  portfolio: Portfolio;
}

export interface PostTradeAnalysisResult {
  analysis: string;
  moveRating: MoveRating;
  xpEarned: number;
}

let conversationCounter = 0;

function makeId(): string {
  return `conv_${Date.now()}_${++conversationCounter}`;
}

function makeMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

const LS_KEY = 'alphamove_conversations';

function loadConversationsFromStorage(): Map<string, MentorConversation> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return new Map();
    const arr = JSON.parse(raw) as MentorConversation[];
    return new Map(arr.map((c) => [c.id, c]));
  } catch {
    return new Map();
  }
}

function saveConversationsToStorage(conversations: Map<string, MentorConversation>) {
  try {
    const arr = Array.from(conversations.values()).slice(-20); // keep last 20
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
  } catch {
    // localStorage quota — ignore
  }
}

export function useMentor() {
  const [conversations, setConversations] = useState<Map<string, MentorConversation>>(() => loadConversationsFromStorage());
  const [loadingConvId, setLoadingConvId] = useState<string | null>(null);

  // Persist conversations to localStorage on every change
  const setAndPersist = useCallback((updater: (prev: Map<string, MentorConversation>) => Map<string, MentorConversation>) => {
    setConversations((prev) => {
      const next = updater(prev);
      saveConversationsToStorage(next);
      return next;
    });
  }, []);

  // ─── Start Pre-Trade Chat ────────────────────────

  const startPreTradeChat = useCallback(
    async (params: StartPreTradeChatParams): Promise<MentorConversation> => {
      const { uid, ticker, companyName, action, shares, price, userLevel, portfolio } = params;

      const cash = portfolio.totalValue - portfolio.totalInvested;
      const convId = makeId();

      setLoadingConvId(convId);

      try {
        const mentorResponse = await generatePreTradeChat({
          uid,
          ticker,
          companyName,
          action,
          shares,
          price,
          userLevel,
          cash,
          portfolioValue: portfolio.totalValue,
          positions: portfolio.positions.map((p) => ({
            ticker: p.ticker,
            shares: p.shares,
            marketValue: p.marketValue,
          })),
        });

        const mentorMessage: MentorMessage = {
          id: makeMessageId(),
          role: 'mentor',
          content: mentorResponse,
          mode: 'pre_trade',
          timestamp: Timestamp.now(),
        };

        const conversation: MentorConversation = {
          id: convId,
          uid,
          mode: 'pre_trade',
          messages: [mentorMessage],
          createdAt: Timestamp.now(),
        };

        setAndPersist((prev) => new Map(prev).set(convId, conversation));
        return conversation;
      } finally {
        setLoadingConvId(null);
      }
    },
    []
  );

  // ─── Send Message ────────────────────────────────

  const sendMessage = useCallback(
    async (params: {
      conversationId: string;
      message: string;
      userLevel?: number;
      cash?: number;
      portfolioValue?: number;
      positions?: Array<{ ticker: string; shares: number; marketValue: number }>;
    }): Promise<MentorMessage> => {
      const { conversationId, message, userLevel = 1, cash = 0, portfolioValue = 0, positions = [] } = params;

      const conversation = conversations.get(conversationId);
      if (!conversation) throw new Error(`Conversation ${conversationId} not found`);

      // Add user message to conversation immediately
      const userMessage: MentorMessage = {
        id: makeMessageId(),
        role: 'user',
        content: message,
        mode: conversation.mode,
        timestamp: Timestamp.now(),
      };

      const updatedMessages = [...conversation.messages, userMessage];
      setAndPersist((prev) => {
        const next = new Map(prev);
        next.set(conversationId, { ...conversation, messages: updatedMessages });
        return next;
      });

      setLoadingConvId(conversationId);

      try {
        // Build history for AI (exclude the system prompt, just chat history)
        const aiHistory = conversation.messages.map((m) => ({
          role: m.role === 'mentor' ? 'assistant' : 'user',
          content: m.content,
        }));

        const systemPrompt = getMentorSystemPrompt(
          userLevel,
          cash,
          portfolioValue,
          positions
        );

        const mentorResponse = await continueConversation(systemPrompt, aiHistory, message);

        const mentorMessage: MentorMessage = {
          id: makeMessageId(),
          role: 'mentor',
          content: mentorResponse,
          mode: conversation.mode,
          timestamp: Timestamp.now(),
        };

        setAndPersist((prev) => {
          const next = new Map(prev);
          const conv = next.get(conversationId)!;
          next.set(conversationId, {
            ...conv,
            messages: [...conv.messages, mentorMessage],
          });
          return next;
        });

        return mentorMessage;
      } finally {
        setLoadingConvId(null);
      }
    },
    [conversations]
  );

  // ─── Post-Trade Analysis ─────────────────────────

  const generatePostTradeAnalysisHook = useCallback(
    async (params: {
      trade: Trade;
      portfolio: Portfolio;
      userLevel: number;
    }): Promise<PostTradeAnalysisResult> => {
      const result = await generatePostTradeAnalysis({
        trade: params.trade,
        portfolio: params.portfolio,
        userLevel: params.userLevel,
      });

      return {
        analysis: result.analysis,
        moveRating: result.moveRating,
        xpEarned: result.xpAwarded,
      };
    },
    []
  );

  // ─── Morning Brief ───────────────────────────────

  const generateMorningBriefHook = useCallback(
    async (params: {
      uid: string;
      portfolio: Portfolio;
      level: number;
    }): Promise<MorningBrief> => {
      return generateAndSaveMorningBrief(params.uid, params.portfolio, params.level);
    },
    []
  );

  // ─── Get Conversation ────────────────────────────

  const getConversation = useCallback(
    (conversationId: string): MentorConversation | undefined => {
      return conversations.get(conversationId);
    },
    [conversations]
  );

  // ─── Start General Chat ──────────────────────────

  const startGeneralChat = useCallback(
    (uid: string): MentorConversation => {
      const convId = makeId();
      const conv: MentorConversation = {
        id: convId,
        uid,
        mode: 'general' as MentorMode,
        messages: [],
        createdAt: Timestamp.now(),
      };
      setAndPersist((prev) => new Map(prev).set(convId, conv));
      return conv;
    },
    []
  );

  return {
    conversations,
    loadingConvId,
    startPreTradeChat,
    sendMessage,
    generatePostTradeAnalysis: generatePostTradeAnalysisHook,
    generateMorningBrief: generateMorningBriefHook,
    getConversation,
    startGeneralChat,
  };
}
