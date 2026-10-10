import React, { useState } from 'react';
import type { View } from '../../types';
import { useAuth } from '../AuthContext';
import { TrainingShell } from './TrainingShell';
import { TrainingDay } from './TrainingDay';
import { ExerciseCatalog } from './ExerciseCatalog';
import { LoginHint } from './TrainingNotices';
import { useLocalTrainingStore } from './useLocalTrainingStore';

type TabKey = 'today' | 'catalog';

/** Öffentlicher Bereich /training: Demo-Tagesplan (nur lokal gespeichert) und Übungskatalog */
export const TrainingView: React.FC<{ onNavigate: (v: View) => void }> = ({ onNavigate }) => {
  const { isLoggedIn } = useAuth();
  const store = useLocalTrainingStore();
  const [tab, setTab] = useState<TabKey>('today');

  return (
    <TrainingShell
      subtitle="Mobilität, Kraft und Stabilität ohne Gewichte – ein Tagesplan mit Ablauf-Timer, abgestimmt auf Radsportler."
      tabs={[{ key: 'today', label: 'Heutiger Plan (Demo)' }, { key: 'catalog', label: 'Übungskatalog' }]}
      active={tab}
      onTab={setTab}
      top={
        <LoginHint
          isLoggedIn={isLoggedIn}
          onLogin={() => onNavigate('trainingPlan')}
          onRegister={() => onNavigate('userRegister')}
          onOpenPlan={() => onNavigate('trainingPlan')}
        />
      }
    >
      {tab === 'today' ? <TrainingDay store={store} demo /> : <ExerciseCatalog />}
    </TrainingShell>
  );
};
