import { useEffect, useState } from 'react';
import type { View } from '../../types';

const PATHS: Partial<Record<View, string>> = { training: '/training', trainingPlan: '/training/plan' };

/** Startansicht aus der URL (Direktaufruf von /training bzw. /training/plan) */
export function viewFromPath(pathname: string): View | null {
  const p = pathname.replace(/\/+$/, '');
  if (p === '/training/plan') return 'trainingPlan';
  if (p === '/training') return 'training';
  return null;
}

/**
 * Hält die URL für die Trainingsansichten aktuell und schützt /training/plan:
 * ohne Login geht es zum Login, danach zurück zum Plan.
 */
export function useTrainingRoute(view: View, setView: (v: View) => void, isLoggedIn: boolean, authLoading: boolean) {
  const [returnTo, setReturnTo] = useState<View | null>(null);

  useEffect(() => {
    const target = PATHS[view];
    const onTraining = viewFromPath(window.location.pathname) !== null;
    if (target && window.location.pathname !== target) window.history.replaceState(null, '', target);
    else if (!target && onTraining) window.history.replaceState(null, '', '/');
  }, [view]);

  useEffect(() => {
    if (view === 'trainingPlan' && !authLoading && !isLoggedIn) {
      setReturnTo('trainingPlan');
      setView('userLogin');
    } else if (view !== 'userLogin' && returnTo) {
      setReturnTo(null);
    }
  }, [view, authLoading, isLoggedIn, returnTo, setView]);

  return { afterLoginView: returnTo ?? undefined };
}
