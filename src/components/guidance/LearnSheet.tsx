import { useMemo, useState } from 'react';
import BottomSheet from './BottomSheet';

interface LearnSheetProps {
  open: boolean;
  onClose: () => void;
  onAskAlpha?: (topic: string) => void;
  initialTopic?: string | null;
}

interface Lesson {
  id: string;
  title: string;
  summary: string;
  body: string[];
}

const LESSONS: Lesson[] = [
  {
    id: 'stock',
    title: 'What is a stock?',
    summary: 'A stock is a small ownership slice of a company.',
    body: [
      'When you buy one share, you are buying a tiny piece of the business.',
      'If the business grows and investors value it more highly, the share price can rise.',
    ],
  },
  {
    id: 'prices',
    title: 'Why do stock prices move?',
    summary: 'Prices move when expectations about the future change.',
    body: [
      'Earnings, product launches, rates, and headlines all change what investors think comes next.',
      'A stock can fall even after good news if the market expected something even better.',
    ],
  },
  {
    id: 'etf',
    title: 'ETF vs single stock',
    summary: 'A single stock is one company. An ETF is a basket.',
    body: [
      'Single stocks can move harder in either direction.',
      'ETFs usually spread risk across many companies, which makes them a steadier first practice idea for many beginners.',
    ],
  },
  {
    id: 'diversification',
    title: 'Diversification',
    summary: 'Do not let one idea decide your whole result.',
    body: [
      'Diversification means spreading your exposure so one bad move hurts less.',
      'It is not about owning everything. It is about avoiding one fragile bet.',
    ],
  },
  {
    id: 'orders',
    title: 'Market order vs limit order',
    summary: 'A market order buys now. A limit order buys only at your chosen price or better.',
    body: [
      'Market orders are simple, but the final fill price can move a bit.',
      'Limit orders give you more price control, but the trade may not execute.',
    ],
  },
  {
    id: 'thesis',
    title: 'What makes a thesis good?',
    summary: 'A good thesis says what you believe, why, and what could prove you wrong.',
    body: [
      '“I saw it on TikTok” is not a thesis. “I think demand is growing and the stock is being mispriced” is at least a starting point.',
      'AlphaMove is built to make you say the quiet part out loud before you trade.',
    ],
  },
  {
    id: 'risk',
    title: 'How to think about risk',
    summary: 'Risk is not just losing money. It is not understanding what you own.',
    body: [
      'Before a trade, ask what could go wrong and how much of your portfolio this move should control.',
      'A small, understandable mistake teaches more than a big, reckless one.',
    ],
  },
  {
    id: 'brief',
    title: 'How to use the Morning Brief',
    summary: 'The brief is there to turn noise into context.',
    body: [
      'Read it to understand what moved, what matters to your holdings, and what question to think about today.',
      'It is less about predicting the market and more about learning what deserves attention.',
    ],
  },
];

export default function LearnSheet({
  open,
  onClose,
  onAskAlpha,
  initialTopic,
}: LearnSheetProps) {
  const initialLesson = useMemo(
    () => LESSONS.find((lesson) => lesson.id === initialTopic) ?? LESSONS[0],
    [initialTopic]
  );
  const [activeId, setActiveId] = useState(initialLesson.id);

  const activeLesson = LESSONS.find((lesson) => lesson.id === activeId) ?? LESSONS[0];

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Learn the board"
      subtitle="Short lessons for the moments when you want context before you make a move."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {LESSONS.map((lesson) => {
            const active = lesson.id === activeLesson.id;
            return (
              <button
                key={lesson.id}
                onClick={() => setActiveId(lesson.id)}
                style={{
                  border: `1px solid ${active ? 'rgba(99, 102, 241, 0.35)' : 'var(--border)'}`,
                  background: active ? 'rgba(99, 102, 241, 0.12)' : 'var(--surface)',
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  borderRadius: '999px',
                  padding: '8px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {lesson.title}
              </button>
            );
          })}
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '18px',
            padding: '16px',
          }}
        >
          <p style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>
            {activeLesson.title}
          </p>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '12px' }}>
            {activeLesson.summary}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeLesson.body.map((paragraph) => (
              <p key={paragraph} style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {onAskAlpha && (
          <button
            onClick={() => onAskAlpha(activeLesson.title)}
            className="btn btn-secondary btn-full"
            style={{ fontSize: '0.92rem' }}
          >
            Ask Alpha about “{activeLesson.title}”
          </button>
        )}
      </div>
    </BottomSheet>
  );
}
