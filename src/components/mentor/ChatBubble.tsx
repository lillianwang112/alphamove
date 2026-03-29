import type { MentorMessage } from '../../types';

interface ChatBubbleProps {
  message: MentorMessage;
}

function formatTimestamp(timestamp: { toDate?: () => Date; seconds?: number } | Date | string | null | undefined): string {
  try {
    let date: Date;
    if (!timestamp) return '';
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (typeof timestamp === 'object' && 'seconds' in timestamp && typeof timestamp.seconds === 'number') {
      date = new Date(timestamp.seconds * 1000);
    } else {
      return '';
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const timeStr = formatTimestamp(message.timestamp as Parameters<typeof formatTimestamp>[0]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        gap: '4px',
        animation: 'fadeIn 0.25s ease both',
        marginBottom: '4px',
      }}
    >
      {/* Sender label (mentor only) */}
      {!isUser && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginLeft: '4px',
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
            }}
          >
            ♟
          </div>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'var(--accent)',
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
            }}
          >
            Alpha
          </span>
        </div>
      )}

      {/* Bubble */}
      <div
        style={{
          maxWidth: '82%',
          padding: '12px 16px',
          borderRadius: isUser
            ? '18px 18px 4px 18px'
            : '4px 18px 18px 18px',
          background: isUser
            ? 'linear-gradient(135deg, var(--accent) 0%, #7C3AED 100%)'
            : 'var(--surface-elevated)',
          border: isUser
            ? 'none'
            : '1px solid var(--border)',
          color: isUser ? 'white' : 'var(--text-primary)',
          boxShadow: isUser
            ? '0 4px 12px rgba(99, 102, 241, 0.3)'
            : 'var(--shadow-sm)',
          position: 'relative',
        }}
      >
        <p
          style={{
            fontSize: '0.9rem',
            lineHeight: 1.55,
            margin: 0,
            color: isUser ? 'white' : 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {message.content}
        </p>
      </div>

      {/* Timestamp */}
      {timeStr && (
        <span
          style={{
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            marginLeft: isUser ? 0 : '4px',
            marginRight: isUser ? '4px' : 0,
          }}
        >
          {timeStr}
        </span>
      )}
    </div>
  );
}
