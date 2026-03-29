import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './styles/globals.css';
import './styles/animations.css';

import { useAuth } from './hooks/useAuth';
import { invalidatePortfolioCache } from './hooks/usePortfolio';
import { XP_THRESHOLDS } from './config/constants';
import { GuidanceProvider } from './context/GuidanceContext';
import AppShell from './components/layout/AppShell';
import WelcomeScreen from './components/onboarding/WelcomeScreen';
import CapitalInput from './components/onboarding/CapitalInput';
import OnboardingWizard, { hasSeenWizard } from './components/onboarding/OnboardingWizard';
import HomePage from './pages/HomePage';
import PortfolioPage from './pages/PortfolioPage';
import TradePage from './pages/TradePage';
import MentorPage from './pages/MentorPage';
import ProfilePage from './pages/ProfilePage';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0A0A0F', padding: '24px', gap: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem' }}>♟</div>
          <h2 style={{ color: '#F8FAFC', fontSize: '1.25rem', fontWeight: 700 }}>Something went wrong</h2>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', maxWidth: '30ch', lineHeight: 1.6 }}>
            AlphaMove hit an unexpected error. Try reloading the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ background: '#6366F1', color: 'white', border: 'none', borderRadius: '12px', padding: '14px 28px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Reload
          </button>
          {import.meta.env.DEV && this.state.error && (
            <pre style={{ fontSize: '0.7rem', color: '#64748B', maxWidth: '90vw', overflow: 'auto', textAlign: 'left', padding: '12px', background: '#14141F', borderRadius: '8px' }}>
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        gap: '20px',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          boxShadow: '0 0 40px rgba(99, 102, 241, 0.4)',
          animation: 'pulse 2s ease-in-out infinite',
        }}
      >
        ♟
      </div>

      <div style={{ textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #F8FAFC 0%, #94A3B8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em',
            marginBottom: '4px',
          }}
        >
          AlphaMove
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
          Loading your position...
        </p>
      </div>

      <div
        style={{
          width: '120px',
          height: '3px',
          background: 'var(--surface)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, var(--accent), #7C3AED, var(--accent))',
            borderRadius: '2px',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
}

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<'enter' | 'exit'>('enter');
  const prevKey = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevKey.current) {
      prevKey.current = location.pathname;
      setTransitionStage('exit');
      const t = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('enter');
      }, 120);
      return () => clearTimeout(t);
    }
  }, [location]);

  return (
    <div
      key={displayLocation.pathname}
      style={{
        opacity: transitionStage === 'enter' ? 1 : 0,
        transform: transitionStage === 'enter' ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
        minHeight: 0,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </div>
  );
}

function AuthGate() {
  const { user, loading, signIn, signInAsGuest, updateUser, isGuest } = useAuth();
  const [wizardDone, setWizardDone] = useState(false);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <div className="app-container">
        <WelcomeScreen onSignIn={signIn} onGuestSignIn={signInAsGuest} loading={loading} />
      </div>
    );
  }

  if (!user.onboardingComplete) {
    const handleCapitalSubmit = async (amount: number) => {
      await updateUser({
        startingCapital: amount,
        currentCash: amount,
        onboardingComplete: true,
      });
      // Clear stale portfolio cache so TradePage reads fresh currentCash
      if (user?.uid) invalidatePortfolioCache(user.uid);
    };

    return (
      <div className="app-container">
        <CapitalInput
          onSubmit={handleCapitalSubmit}
          userName={user.displayName || 'Trader'}
        />
      </div>
    );
  }

  // Show onboarding wizard for new users who haven't seen it yet
  if (!wizardDone && !hasSeenWizard()) {
    const handleWizardComplete = async (startingLevel: number) => {
      const clampedLevel = Math.max(1, Math.min(10, startingLevel));
      const startingXP = XP_THRESHOLDS[clampedLevel - 1] ?? 0;
      const xpToNextLevel = clampedLevel < XP_THRESHOLDS.length
        ? XP_THRESHOLDS[clampedLevel] - startingXP
        : 0;
      await updateUser({ level: clampedLevel, xp: startingXP, xpToNextLevel });
      setWizardDone(true);
    };
    return (
      <div className="app-container">
        <OnboardingWizard
          startingCapital={user.startingCapital || 500}
          onComplete={handleWizardComplete}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      <AppShell user={user} isGuest={isGuest} onSignIn={signIn}>
        <PageTransition>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/trade" element={<TradePage />} />
            <Route path="/mentor" element={<MentorPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PageTransition>
      </AppShell>
    </div>
  );
}

export default function App() {
  const Router = import.meta.env.PROD ? HashRouter : BrowserRouter;

  return (
    <ErrorBoundary>
      <Router>
        <GuidanceProvider>
          <AuthGate />
        </GuidanceProvider>
      </Router>
    </ErrorBoundary>
  );
}
