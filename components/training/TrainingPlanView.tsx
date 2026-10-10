import React, { useMemo, useState } from 'react';
import { useAuth } from '../AuthContext';
import { hash } from '../../lib/training/planner';
import { TrainingShell } from './TrainingShell';
import { TrainingDay } from './TrainingDay';
import { ExerciseCatalog } from './ExerciseCatalog';
import { History } from './History';
import { useServerTrainingStore } from './useServerTrainingStore';

type TabKey = 'today' | 'history' | 'catalog' | 'data';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'today', label: 'Mein Tagesplan' },
  { key: 'history', label: 'Verlauf' },
  { key: 'catalog', label: 'Übungskatalog' },
  { key: 'data', label: 'Meine Daten' },
];

const DeleteData: React.FC<{ onDelete: () => Promise<void> }> = ({ onDelete }) => {
  const [step, setStep] = useState<'idle' | 'confirm' | 'busy' | 'done' | 'error'>('idle');
  const run = async () => {
    setStep('busy');
    try { await onDelete(); setStep('done'); } catch { setStep('error'); }
  };
  return (
    <section className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col gap-3">
      <h2 className="font-display text-lg font-semibold text-secondary">Gespeicherte Trainingsdaten</h2>
      <p className="text-sm text-gray-600 m-0">
        Gespeichert werden nur Trainingsdaten: Datum, Übung, Variante, Sätze, Wiederholungen bzw. Haltezeit, Erledigt-Status,
        deine Einstellungen (Dauer, Pausen, Zyklusstart) und deine Rückmeldung „zu leicht / passt / zu schwer“ je Übung.
        Keine Schmerz- oder Gesundheitsangaben. Beim Löschen des Kontos werden diese Daten automatisch mitgelöscht.
      </p>
      {step === 'confirm' ? (
        <div className="flex flex-wrap items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <span className="text-sm text-red-900 flex-1 min-w-[200px]">Wirklich alle Trainingsdaten unwiderruflich löschen?</span>
          <button type="button" onClick={run} className="bg-primary text-white font-semibold rounded-lg px-4 py-2">Ja, löschen</button>
          <button type="button" onClick={() => setStep('idle')} className="border border-gray-300 font-semibold rounded-lg px-4 py-2">Abbrechen</button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setStep('confirm')} disabled={step === 'busy'} className="border border-primary text-primary font-semibold rounded-lg px-4 py-2 hover:bg-red-50">
            Trainingsdaten löschen
          </button>
          {step === 'done' && <span className="text-sm text-green-700" role="status">Alle Trainingsdaten wurden gelöscht.</span>}
          {step === 'error' && <span className="text-sm text-red-700" role="alert">Löschen fehlgeschlagen. Bitte erneut versuchen.</span>}
        </div>
      )}
    </section>
  );
};

const Plan: React.FC<{ userId: string }> = ({ userId }) => {
  const store = useServerTrainingStore(userId);
  const userSeed = useMemo(() => hash(userId), [userId]);
  const [tab, setTab] = useState<TabKey>('today');

  const status = store.status === 'loading'
    ? <p className="text-gray-600">Lade deine Trainingsdaten …</p>
    : store.status === 'error'
      ? <p className="text-red-700" role="alert">{store.error}</p>
      : null;

  return (
    <TrainingShell
      subtitle="Dein persönlicher Plan – Fortschritt, Einstellungen und Verlauf werden in deinem Konto gespeichert."
      tabs={TABS}
      active={tab}
      onTab={setTab}
      top={(store.pending > 0 || (store.status === 'ready' && store.error)) && (
        <p className="text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-3 py-2 m-0" role="status">
          {store.error ?? `${store.pending} Änderung(en) noch nicht gespeichert – sie werden automatisch übertragen, sobald die Verbindung wieder steht.`}
        </p>
      )}
    >
      {status ?? (
        tab === 'today' ? <TrainingDay store={store} userSeed={userSeed} demo={false} />
          : tab === 'history' ? <History log={store.log} settings={store.settings} />
            : tab === 'catalog' ? <ExerciseCatalog />
              : <DeleteData onDelete={store.deleteAll} />
      )}
    </TrainingShell>
  );
};

/** Geschützter Bereich /training/plan – ohne Login leitet useTrainingRoute zum Login um */
export const TrainingPlanView: React.FC = () => {
  const { user } = useAuth();
  return user ? <Plan key={user.id} userId={user.id} /> : null;
};
