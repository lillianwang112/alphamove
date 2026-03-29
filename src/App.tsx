import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/globals.css';
import './styles/animations.css';

import { useAuth } from './hooks/useAuth';
import AppShell from './components/layout/AppShell';
import WelcomeScreen from './components/onboarding/WelcomeScreen';
import CapitalInput from './components/onboarding/CapitalInput';
import HomePage from './pages/HomePage';
import PortfolioPage from './pages/PortfolioPage';
import TradePage from './pages/TradePage';
import MentorPage from './pages/MentorPage';
import ProfilePage from './pages/ProfilePage';

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

function AuthGate() {
  const { user, loading, signIn, updateUser } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <div className="app-container">
        <WelcomeScreen onSignIn={signIn} loading={loading} />
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

  return (
    <div className="app-container">
      <AppShell user={user}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/trade" element={<TradePage />} />
          <Route path="/mentor" element={<MentorPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthGate />
    </BrowserRouter>
  );
}
