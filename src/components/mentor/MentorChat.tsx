import { useState, useRef, useEffect } from 'react';
import type { MentorMessage } from '../../types';
import ChatBubble from './ChatBubble';

interface MentorChatProps {
  messages: MentorMessage[];
  onSend: (text: string) => void;
  loading: boolean;
  disabled?: boolean;
  readyToExecute?: boolean;
  onExecute?: () => void;
}

export default function MentorChat({
  messages,
  onSend,
  loading,
  disabled = false,
  readyToExecute = false,
  onExecute,
}: MentorChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || loading || disabled) return;
    onSend(trimmed);
    setInput('');
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        height: '100%',
        minHeight: '400px',
      }}
    >
      {/* Chat header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'var(--surface-elevated)',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)',
          }}
        >
          ♟
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>
            Alpha
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--success)',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              AI Mentor · Online
            </span>
          </div>
        </div>

        {/* Ready to execute badge */}
        {readyToExecute && (
          <div
            style={{
              marginLeft: 'auto',
              background: 'var(--success-light)',
              border: '1px solid rgba(34,197,94,0.4)',
              borderRadius: '999px',
              padding: '4px 10px',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'var(--success)',
              letterSpacing: '0.03em',
            }}
          >
            Ready ✓
          </div>
        )}
      </div>

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {messages.length === 0 && !loading && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '24px 20px',
              textAlign: 'center',
              opacity: 0.6,
              minHeight: '120px',
            }}
          >
            <span style={{ fontSize: '1.75rem', lineHeight: 1 }}>♟</span>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
              Your mentor is ready to help you think through this trade.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}

        {/* Typing indicator */}
        {loading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
              animation: 'fadeIn 0.3s ease both',
            }}
          >
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                flexShrink: 0,
                marginTop: '4px',
              }}
            >
              ♟
            </div>
            <div
              style={{
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '4px 18px 18px 18px',
                padding: '12px 16px',
              }}
            >
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Execute button (when ready) */}
      {readyToExecute && onExecute && (
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            background: 'rgba(34, 197, 94, 0.05)',
          }}
        >
          <button
            onClick={onExecute}
            className="btn btn-success btn-full"
            style={{ fontSize: '0.95rem' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Ready — Make this Move
          </button>
        </div>
      )}

      {/* Input area */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-end',
          background: 'var(--surface)',
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Chat complete' : 'Message Alpha...'}
          disabled={disabled || loading}
          rows={1}
          style={{
            flex: 1,
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '12px 14px',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.9rem',
            outline: 'none',
            resize: 'none',
            lineHeight: 1.5,
            maxHeight: '120px',
            overflowY: 'auto',
            transition: 'border-color 0.2s ease',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--accent)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border)';
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading || disabled}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: input.trim() && !loading && !disabled ? 'var(--accent)' : 'var(--surface-elevated)',
            border: '1px solid var(--border)',
            color: input.trim() && !loading && !disabled ? 'white' : 'var(--text-muted)',
            cursor: input.trim() && !loading && !disabled ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            flexShrink: 0,
            boxShadow: input.trim() && !loading && !disabled ? '0 0 12px rgba(99,102,241,0.4)' : 'none',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
