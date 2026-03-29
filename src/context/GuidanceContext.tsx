/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TOUR_STEPS } from './tourSteps';

const BEGINNER_MODE_KEY = 'alphamove.beginnerMode';
const TOUR_SEEN_KEY = 'alphamove.tourSeen';

export interface TourStep {
  route: string;
  target: string;
  title: string;
  body: string;
  whyItMatters: string;
}

interface GuidanceContextValue {
  beginnerMode: boolean;
  setBeginnerMode: (value: boolean) => void;
  hasSeenTour: boolean;
  tourOpen: boolean;
  currentStep: TourStep | null;
  stepIndex: number;
  totalSteps: number;
  startTour: (startIndex?: number) => void;
  maybeStartTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  activeTourTarget: string | null;
}

const GuidanceContext = createContext<GuidanceContextValue | null>(null);

function readStoredBoolean(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;
  const value = window.localStorage.getItem(key);
  if (value === null) return fallback;
  return value === 'true';
}

export function GuidanceProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [beginnerMode, setBeginnerModeState] = useState(() =>
    readStoredBoolean(BEGINNER_MODE_KEY, true)
  );
  const [hasSeenTour, setHasSeenTour] = useState(() =>
    readStoredBoolean(TOUR_SEEN_KEY, false)
  );
  const [tourOpen, setTourOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    window.localStorage.setItem(BEGINNER_MODE_KEY, String(beginnerMode));
  }, [beginnerMode]);

  useEffect(() => {
    window.localStorage.setItem(TOUR_SEEN_KEY, String(hasSeenTour));
  }, [hasSeenTour]);

  const currentStep = tourOpen ? TOUR_STEPS[stepIndex] ?? null : null;

  useEffect(() => {
    if (!currentStep) return;
    if (location.pathname !== currentStep.route) {
      navigate(currentStep.route);
    }
  }, [currentStep, location.pathname, navigate]);

  const setBeginnerMode = useCallback((value: boolean) => {
    setBeginnerModeState(value);
  }, []);

  const startTour = useCallback((startIndex = 0) => {
    setStepIndex(startIndex);
    setTourOpen(true);
  }, []);

  const maybeStartTour = useCallback(() => {
    if (!hasSeenTour) {
      setStepIndex(0);
      setTourOpen(true);
    }
  }, [hasSeenTour]);

  const completeTour = useCallback(() => {
    setTourOpen(false);
    setHasSeenTour(true);
  }, []);

  const nextStep = useCallback(() => {
    setStepIndex((prev) => {
      if (prev >= TOUR_STEPS.length - 1) {
        completeTour();
        return prev;
      }
      return prev + 1;
    });
  }, [completeTour]);

  const previousStep = useCallback(() => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const skipTour = useCallback(() => {
    completeTour();
  }, [completeTour]);

  const value = useMemo<GuidanceContextValue>(() => ({
    beginnerMode,
    setBeginnerMode,
    hasSeenTour,
    tourOpen,
    currentStep,
    stepIndex,
    totalSteps: TOUR_STEPS.length,
    startTour,
    maybeStartTour,
    nextStep,
    previousStep,
    skipTour,
    activeTourTarget: currentStep?.target ?? null,
  }), [
    beginnerMode,
    currentStep,
    hasSeenTour,
    maybeStartTour,
    nextStep,
    previousStep,
    setBeginnerMode,
    skipTour,
    startTour,
    stepIndex,
    tourOpen,
  ]);

  return (
    <GuidanceContext.Provider value={value}>
      {children}
    </GuidanceContext.Provider>
  );
}

export function useGuidance() {
  const context = useContext(GuidanceContext);
  if (!context) {
    throw new Error('useGuidance must be used within GuidanceProvider');
  }
  return context;
}
