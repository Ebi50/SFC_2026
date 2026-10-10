import React from 'react';

/** Pflicht-Hinweis: allgemeine Trainingsvorschläge, keine Beratung */
export const HealthNotice: React.FC = () => (
  <aside className="border-l-4 border-amber-500 bg-amber-50 text-amber-900 rounded-r-lg px-4 py-3 text-sm" role="note">
    <b>Hinweis:</b> Die Übungen sind allgemeine Trainingsvorschläge und ersetzen keine ärztliche oder physiotherapeutische
    Beratung. Bei Schmerzen, Vorerkrankungen oder nach Verletzungen vorher fachlich abklären. Übungen nur im schmerzfreien
    Bereich ausführen; bei Schmerzen abbrechen.
  </aside>
);

interface LoginHintProps {
  isLoggedIn: boolean;
  onLogin: () => void;
  onRegister: () => void;
  onOpenPlan: () => void;
}

export const LoginHint: React.FC<LoginHintProps> = ({ isLoggedIn, onLogin, onRegister, onOpenPlan }) => (
  <div className="bg-white border border-primary/40 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3 shadow-sm">
    {isLoggedIn ? (
      <>
        <p className="flex-1 min-w-[200px] m-0 text-secondary">Du bist angemeldet. Dein persönlicher Plan speichert Fortschritt, Einstellungen und Verlauf geräteübergreifend.</p>
        <button type="button" onClick={onOpenPlan} className="bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg px-4 py-2">Zu meinem Plan</button>
      </>
    ) : (
      <>
        <p className="flex-1 min-w-[200px] m-0 text-secondary font-semibold">Einloggen, um Fortschritt, Einstellungen und Verlauf geräteübergreifend zu speichern.</p>
        <button type="button" onClick={onLogin} className="bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg px-4 py-2">Einloggen</button>
        <button type="button" onClick={onRegister} className="border border-gray-300 hover:border-primary font-semibold rounded-lg px-4 py-2">Registrieren</button>
      </>
    )}
  </div>
);

export const TrainingHelp: React.FC<{ demo: boolean }> = ({ demo }) => (
  <details className="bg-white border border-gray-200 rounded-xl px-4 py-3">
    <summary className="cursor-pointer font-semibold">So funktioniert der Plan</summary>
    <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-600">
      <li>Jeder Wochentag hat einen Schwerpunkt (z. B. Montag beidbeinige Kraft, Dienstag Einbein &amp; Stabilität, Sonntag Regeneration).</li>
      <li>Innerhalb des Schwerpunkts wechseln täglich Auswahl, Reihenfolge und Variante jeder Übung. Dieselbe Variante kommt nie zwei Tage hintereinander.</li>
      <li>4-Wochen-Zyklus ab deinem Startdatum: Woche 1 Einstieg, Woche 2–3 mehr Umfang, Woche 4 Entlastung. Danach beginnt der Zyklus neu. Das Startdatum lässt sich oben ändern.</li>
      <li>Startwerte – an das eigene Niveau anpassen. Lieber eine Wiederholung weniger als eine unsaubere.</li>
      <li>„Training starten“ führt nacheinander durch alle Übungen des Tages: Ansage der nächsten Übung mit Skizzen (Zeit zum Einrichten einstellbar), dann Sätze, Seitenwechsel und Pausen. Am Ende jeder Übung wird sie automatisch abgehakt.</li>
      <li>Gesamtdauer: Der Plan füllt den Tag nach Priorität auf – erst die Schwerpunkt-Übungen des Wochentags, abwechselnd mit Mobilität, dann weitere Übungen. Bleibt Zeit übrig, gibt es einen Satz mehr; bei sehr kurzer Dauer werden Sätze reduziert.</li>
      <li>„Basisprogramm“ = Grundübungen für Hüfte und Rücken. „Ergänzung Radsport“ = zusätzliche Übungen ohne Gewichte gegen typische Radsport-Defizite: verkürzte Hüftbeuger und Oberschenkel, Rundrücken und eingeschränkte Drehung der Brustwirbelsäule, schwache Rumpf- und Rückenstrecker-Ausdauer, schwacher seitlicher Po (Kniespur).</li>
      {demo
        ? <li>Ohne Login werden Häkchen und Einstellungen nur in diesem Browser gespeichert.</li>
        : <li>Mit „zu leicht / passt / zu schwer“ passt der Plan Dosis und Variante der Übung künftig für dich an.</li>}
      <li>Alle Abbildungen sind schematische Skizzen, eigens für diesen Plan gezeichnet.</li>
    </ul>
  </details>
);
