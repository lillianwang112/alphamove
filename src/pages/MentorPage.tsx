import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useMentor } from '../hooks/useMentor';
import { useGuidance } from '../context/GuidanceContext';
import MentorChat from '../components/mentor/MentorChat';
import TourAnchor from '../components/guidance/TourAnchor';
import LearnSheet from '../components/guidance/LearnSheet';
import type { MentorMessage, MentorConversation } from '../types';
import { Timestamp } from 'firebase/firestore';

// Module-level cache — survives tab switches, resets on full page reload
let _cachedConversation: MentorConversation | null = null;
let _cachedMessages: MentorMessage[] = [];

export default function MentorPage() {
  const location = useLocation();
  const { user } = useAuth();
  const { beginnerMode } = useGuidance();
  const { startGeneralChat, sendMessage } = useMentor();
  const [conversation, setConversation] = useState<MentorConversation | null>(_cachedConversation);
  const [messages, setMessages] = useState<MentorMessage[]>(_cachedMessages);
  const [loading, setLoading] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);

  const suggestedPrompt = (location.state as { suggestedPrompt?: string } | null)?.suggestedPrompt ?? null;

  // Start a general conversation only if one doesn't already exist
  const initConversation = useCallback(() => {
    if (!user || _cachedConversation) return;

    const conv = startGeneralChat(user.uid);
    const welcomeMsg: MentorMessage = {
      id: 'welcome',
      role: 'mentor',
      content: `Hey! I'm Alpha, your investing mentor. Ask me anything about markets, stocks, investing strategy, or how to think about a trade. What's on your mind?`,
      mode: 'general',
      timestamp: Timestamp.now(),
    };
    _cachedConversation = conv;
    _cachedMessages = [welcomeMsg];
    setConversation(conv);
    setMessages([welcomeMsg]);
  }, [startGeneralChat, user]);

  useEffect(() => {
    if (!user) return;
    initConversation();
  }, [initConversation, user]);

  const handleSend = async (text: string) => {
    if (!conversation || !user) return;
    setLoading(true);

    const optimisticUserMsg: MentorMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      mode: 'general',
      timestamp: Timestamp.now(),
    };
    setMessages((prev) => {
      const next = [...prev, optimisticUserMsg];
      _cachedMessages = next;
      return next;
    });

    try {
      const response = await sendMessage({
        conversationId: conversation.id,
        message: text,
        userLevel: user.level ?? 1,
        cash: user.currentCash ?? 0,
        portfolioValue: user.currentCash ?? 0,
        positions: [],
      });
      setMessages((prev) => {
        const next = [...prev, response];
        _cachedMessages = next;
        return next;
      });
    } catch {
      const errorMsg: MentorMessage = {
        id: `error-${Date.now()}`,
        role: 'mentor',
        content: "I'm having trouble connecting right now. Try again in a moment.",
        mode: 'general',
        timestamp: Timestamp.now(),
      };
      setMessages((prev) => {
        const next = [...prev, errorMsg];
        _cachedMessages = next;
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    _cachedConversation = null;
    _cachedMessages = [];
    setMessages([]);
    setConversation(null);
    // Let useEffect re-init on next render
    setTimeout(() => initConversation(), 0);
  };

  return (
    <div
      style={{
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        height: 'calc(100vh - var(--header-height) - var(--bottom-nav-height))',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          animation: 'slideInUp 0.3s ease both',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
            Alpha
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            Your AI investing mentor
          </p>
        </div>
        <button
          onClick={handleNewChat}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          New chat
        </button>
      </div>

      {/* Suggestion chips — shown when chat is fresh */}
      {messages.length <= 1 && !loading && (
        <TourAnchor id="mentor-prompts">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              flexShrink: 0,
              animation: 'fadeIn 0.4s ease both',
              animationDelay: '0.2s',
            }}
          >
          {(beginnerMode || suggestedPrompt) && (
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '14px 16px',
              }}
            >
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '10px' }}>
                Ask Alpha when you feel stuck, want a concept translated into plain English, or need help turning an idea into a trade thesis.
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {suggestedPrompt && (
                  <button
                    onClick={() => handleSend(suggestedPrompt)}
                    className="btn btn-secondary"
                    style={{ padding: '10px 12px', fontSize: '0.82rem' }}
                  >
                    Use suggested prompt
                  </button>
                )}
                {beginnerMode && (
                  <button
                    onClick={() => setLearnOpen(true)}
                    className="btn btn-ghost"
                    style={{ padding: '10px 12px', fontSize: '0.82rem' }}
                  >
                    Learn first
                  </button>
                )}
              </div>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
          {[
            "What is a P/E ratio?",
            "How do I diversify?",
            "Should I buy the dip?",
            "What's dollar-cost averaging?",
            "How do I know if a stock is overvalued?",
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSend(suggestion)}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '999px',
                padding: '8px 14px',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = 'var(--accent)';
                el.style.color = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = 'var(--border)';
                el.style.color = 'var(--text-secondary)';
              }}
            >
              {suggestion}
            </button>
          ))}
          </div>
          </div>
        </TourAnchor>
      )}

      {/* Chat */}
      <div style={{ flex: 1, overflow: 'hidden', animation: 'slideInUp 0.4s ease both', animationDelay: '0.1s' }}>
        <MentorChat
          messages={messages}
          onSend={handleSend}
          loading={loading}
        />
      </div>

      <LearnSheet
        open={learnOpen}
        onClose={() => setLearnOpen(false)}
        initialTopic="thesis"
        onAskAlpha={(topic) => {
          setLearnOpen(false);
          handleSend(`Teach me ${topic} in plain English and give me one beginner example.`);
        }}
      />
    </div>
  );
}
