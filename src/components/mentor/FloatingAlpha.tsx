import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useMentor } from '../../hooks/useMentor';
import { usePortfolio } from '../../hooks/usePortfolio';
import type { User } from '../../types';

interface FloatingAlphaProps {
  user: User | null;
}

export default function FloatingAlpha({ user }: FloatingAlphaProps) {
  const location = useLocation();
  const { startGeneralChat, sendMessage } = useMentor();
  const { portfolio } = usePortfolio(user?.uid ?? '');

  const [open, setOpen] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<{ role: 'user' | 'mentor'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [localMessages, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  const handleOpen = useCallback(() => {
    if (!user) return;
    if (!convId) {
      const conv = startGeneralChat(user.uid);
      setConvId(conv.id);
      setLocalMessages([{
        role: 'mentor',
        content: "What's on your mind? Ask me about any stock, concept, or move you're considering.",
      }]);
    }
    setOpen(true);
  }, [user, convId, startGeneralChat]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !convId || loading || !user) return;
    const text = input.trim();
    setInput('');
    setLocalMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const cash = portfolio
        ? portfolio.totalValue - portfolio.totalInvested
        : user.currentCash ?? 0;
      const response = await sendMessage({
        conversationId: convId,
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
      setLocalMessages((prev) => [...prev, { role: 'mentor', content: response.content }]);
    } catch {
      setLocalMessages((prev) => [...prev, { role: 'mentor', content: "Sorry, I'm having trouble connecting. Try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  }, [input, convId, loading, user, portfolio, sendMessage]);

  // Don't show on mentor page (full chat already there)
  if (location.pathname === '/mentor') return null;
  if (!user) return null;

  const bottomOffset = 72; // bottom nav height + gap

  return createPortal(
    <>
      {/* FAB button */}
      {!open && (
        <button
          onClick={handleOpen}
          aria-label="Ask Alpha"
          style={{
            position: 'fixed',
            bottom: `${bottomOffset}px`,
            right: '16px',
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            border: 'none',
            color: 'white',
            fontSize: '1.35rem',
            cursor: 'pointer',
            zIndex: 900,
            boxShadow: '0 4px 24px rgba(99,102,241,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
        >
          ♟
        </button>
      )}

      {/* Chat sheet */}
      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 950,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            background: 'rgba(6,8,14,0.5)',
          }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(160deg, #15172A 0%, #0D0F19 100%)',
              borderRadius: '20px 20px 0 0',
              border: '1px solid rgba(99,102,241,0.25)',
              borderBottom: 'none',
              maxHeight: '72vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.7)',
              animation: 'slideInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
              width: '100%',
              maxWidth: '430px',
              margin: '0 auto',
            }}
          >
            {/* Drag handle */}
            <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.12)', margin: '12px auto 0' }} />

            {/* Header */}
            <div style={{ padding: '12px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', boxShadow: '0 0 12px rgba(99,102,241,0.4)' }}>
                  ♟
                </div>
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>Alpha</p>
                  <p style={{ fontSize: '0.68rem', color: 'var(--accent)', fontWeight: 600 }}>AI mentor · full context</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px', color: 'var(--text-muted)', fontSize: '1rem', cursor: 'pointer', padding: '4px 10px', fontWeight: 600 }}>
                ×
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '120px' }}>
              {localMessages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                    background: msg.role === 'user' ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                    border: msg.role === 'mentor' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', gap: '5px', padding: '10px 0 2px 4px' }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent)', opacity: 0.7, animation: `bounce 1.2s ${i * 0.18}s infinite ease-in-out` }} />
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '10px 14px calc(10px + env(safe-area-inset-bottom))', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
                placeholder="Ask anything about markets or moves…"
                className="input"
                style={{ flex: 1, fontSize: '0.875rem', height: '44px' }}
              />
              <button
                onClick={() => void handleSend()}
                disabled={!input.trim() || loading}
                style={{
                  height: '44px',
                  padding: '0 16px',
                  borderRadius: '12px',
                  background: input.trim() && !loading ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: input.trim() && !loading ? 'white' : 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: input.trim() && !loading ? 'pointer' : 'default',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
