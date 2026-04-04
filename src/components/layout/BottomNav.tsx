import { useNavigate, useLocation } from 'react-router-dom';

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9 21 9 15 12 15C15 15 15 21 15 21M9 21H15"
        stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function TradeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M2 20L8 14L12 18L22 4" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 4H22V10" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function MentorIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C6.47715 2 2 6.47715 2 12C2 13.8214 2.48697 15.5291 3.33782 17L2 22L7 20.6622C8.47087 21.5131 10.1786 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z"
        stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M8 10.5H8.01M12 10.5H12.01M16 10.5H16.01"
        stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7}/>
      <path d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20"
        stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round"
      />
    </svg>
  );
}

function FeedIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M17 20H7a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v9a2 2 0 01-2 2z"
        stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" />
    </svg>
  );
}

const ICONS = [HomeIcon, TradeIcon, FeedIcon, MentorIcon, ProfileIcon];
const PATHS = ['/', '/trade', '/feed', '/mentor', '/profile'];
const LABELS = ['Home', 'Trade', 'Feed', 'Mentor', 'Profile'];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <nav
      className="bottom-nav-hide-desktop"
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 'var(--app-max-width)',
        height: 'var(--bottom-nav-height)',
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'stretch',
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {PATHS.map((path, index) => {
        const active = isActive(path);
        const Icon = ICONS[index];
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            aria-label={LABELS[index]}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: active ? 'var(--accent)' : 'var(--text-muted)',
              transition: 'color 0.2s ease',
              padding: '6px 4px 8px',
              WebkitTapHighlightColor: 'transparent',
              position: 'relative',
            }}
          >
            {/* Active pill background */}
            {active && (
              <span
                style={{
                  position: 'absolute',
                  top: '8px',
                  width: '44px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  animation: 'fadeIn 0.2s ease',
                }}
              />
            )}

            <span style={{ position: 'relative', zIndex: 1 }}>
              <Icon active={active} />
            </span>

            <span
              style={{
                fontSize: '0.6rem',
                fontWeight: active ? 700 : 500,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {LABELS[index]}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
