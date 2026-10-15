'use client';

import {
  createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState,
  type ReactNode,
} from 'react';
import { Compass, Sparkles } from 'lucide-react';
import ProductTour from '@/components/tour/ProductTour';
import {
  APP_TOUR_STEPS, hasCompletedTour, initialTourState, markTourCompleted, tourReducer,
  type TourStep,
} from '@/lib/tour';

const MOBILE_BREAKPOINT = 768;
const WELCOME_DELAY_MS = 700;

interface TourContextValue {
  startTour: () => void;
  active: boolean;
}

const TourContext = createContext<TourContextValue>({ startTour: () => {}, active: false });

export const useTour = () => useContext(TourContext);

interface TourProviderProps {
  children: ReactNode;
  steps?: TourStep[];
  /** Greet first-time users with a welcome dialog. */
  autoStart?: boolean;
  /** Called to open/close the mobile sidebar drawer for sidebar steps. */
  onSidebarRequest?: (open: boolean) => void;
}

const safeStorage = () => (typeof window === 'undefined' ? undefined : window.localStorage);

export function TourProvider({ children, steps = APP_TOUR_STEPS, autoStart = true, onSidebarRequest }: TourProviderProps) {
  const [state, dispatch] = useReducer(tourReducer, initialTourState);
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  useEffect(() => {
    if (!autoStart || hasCompletedTour(safeStorage())) return;
    const timer = window.setTimeout(() => setWelcomeOpen(true), WELCOME_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [autoStart]);

  const startTour = useCallback(() => {
    setWelcomeOpen(false);
    dispatch({ type: 'start', total: steps.length });
  }, [steps.length]);

  const dismissWelcome = useCallback(() => {
    setWelcomeOpen(false);
    markTourCompleted(safeStorage());
  }, []);

  // Persist completion and close the mobile drawer when the tour ends.
  useEffect(() => {
    if (!state.completed) return;
    markTourCompleted(safeStorage());
    onSidebarRequest?.(false);
  }, [state.completed, onSidebarRequest]);

  const step = state.active ? steps[state.index] : undefined;

  // On small screens the sidebar is an off-canvas drawer; open it for sidebar steps.
  useEffect(() => {
    if (!step || !onSidebarRequest || window.innerWidth > MOBILE_BREAKPOINT) return;
    onSidebarRequest(step.area === 'sidebar');
  }, [step, onSidebarRequest]);

  // Keyboard navigation while the tour is running.
  useEffect(() => {
    if (!state.active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dispatch({ type: 'skip' });
      else if (event.key === 'ArrowRight') dispatch({ type: 'next' });
      else if (event.key === 'ArrowLeft') dispatch({ type: 'prev' });
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [state.active]);

  const value = useMemo(() => ({ startTour, active: state.active }), [startTour, state.active]);

  return (
    <TourContext.Provider value={value}>
      {children}

      {welcomeOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div
            className="modal-box welcome-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nf-welcome-title"
            aria-describedby="nf-welcome-desc"
          >
            <div className="welcome-hero">
              <span className="nx-eyebrow" style={{ color: 'var(--nx-gold)' }}>
                <Sparkles size={13} strokeWidth={2.2} /> Pengguna baru
              </span>
              <h2 id="nf-welcome-title" style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.4px', marginTop: 8, lineHeight: 1.25 }}>
                Selamat datang di NexFinance
              </h2>
              <p id="nf-welcome-desc" style={{ fontSize: 14, color: 'rgba(255,255,255,0.78)', marginTop: 8, lineHeight: 1.6 }}>
                Ikuti tur singkat untuk mengenal navigasi, area kerja, dan pusat bantuan. Hanya butuh sekitar satu menit.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '16px 20px 20px', flexWrap: 'wrap' }}>
              <button type="button" className="tour-btn" onClick={dismissWelcome}>
                Nanti saja
              </button>
              <button type="button" className="tour-btn tour-btn-primary" onClick={startTour} autoFocus>
                <Compass size={15} strokeWidth={2} /> Mulai tur
              </button>
            </div>
          </div>
        </div>
      )}

      {step && (
        <ProductTour
          step={step}
          index={state.index}
          total={state.total}
          onNext={() => dispatch({ type: 'next' })}
          onPrev={() => dispatch({ type: 'prev' })}
          onSkip={() => dispatch({ type: 'skip' })}
        />
      )}
    </TourContext.Provider>
  );
}
