import React, { useState } from 'react';
import { Settings, AgeHandicapRule, PerfClass, Participant, Event } from '../types';
import { CogIcon, PlusIcon, TrashIcon, DownloadIcon } from './icons';
import { generateProjectMarkdown } from '../services/markdownGenerator';

interface SettingsViewProps {
  settings: Settings;
  onSettingsChange: (newSettings: Settings) => void;
  selectedSeason: number | null;
  participants: Participant[];
  events: Event[];
}

const generateSpecDocument = () => {
  const content = `
Projektspezifikation & Systemarchitektur
=======================================

Projekt: Skinfit Cup Verwaltungs- & Wertungsapp
Version: Aktueller Stand
Datum: ${new Date().toLocaleDateString('de-DE')}

---

1. Systemarchitektur
--------------------
Die Anwendung ist als moderne Single-Page-Application (SPA) konzipiert und nutzt eine klare, komponentenbasierte Architektur, die auf bewährten Frontend-Prinzipien aufbaut. Die Architektur lässt sich in vier Hauptschichten unterteilen, die eine hohe Wartbarkeit, Testbarkeit und Skalierbarkeit gewährleisten.

1.1 Beschreibung der Schichten
*   Präsentationsschicht (UI-Komponenten): Verantwortlich für die Darstellung der UI und Entgegennahme von Benutzerinteraktionen. Befindet sich im Verzeichnis \`components/\`.
*   State-Management-Schicht (App.tsx): Fungiert als zentrale Container-Komponente und ist die alleinige Quelle der Wahrheit ('Single Source of Truth') für den gesamten Anwendungszustand.
*   Geschäftslogik-Schicht (Services): Komplett von React entkoppelte TypeScript-Module, die die Kernlogik der Anwendung (z.B. Wertungsberechnung) enthalten.
*   Datenschicht (types.ts): Definiert alle zentralen Datenstrukturen und Typen für Typsicherheit und eine saubere Codebasis.

2. Funktionsübersicht (Spezifikation)
-------------------------------------

2.1 Teilnehmerverwaltung
*   Listenansicht, Bearbeiten, Löschen und Import von Teilnehmern via CSV und Excel.

2.2 Event- & Ergebnisverwaltung
*   Anlegen, Bearbeiten und Löschen von Events.
*   Kontextsensitive Ergebniseingabe für EZF, BZF, MZF und Handicap-Rennen.
*   Live-Berechnung von angepassten Zeiten und Handicaps direkt im Formular.

2.3 Wertungs- & Berechnungslogik
*   Automatische Neuberechnung der Punkte bei Datenänderungen.
*   Komplexes, konfigurierbares Handicap-System basierend auf Alter, Geschlecht, Leistungsklasse und Material.
*   Korrekte MZF-Teamzeit-Berechnung nach der (n-1)-Regel.

2.4 Gesamtwertung
*   Gruppierte Ansichten für Ambitionierte, Hobby-Fahrer und Frauen.
*   Dynamische Spaltenüberschriften für Rennen.
*   Automatische Berücksichtigung von Streichergebnissen.

2.5 Einstellungen
*   Konfiguration von Bonus-Punkten, Material-Handicaps und Streichergebnissen.
`.trim();

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Skinfit_Cup_App_Spezifikation.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSettingsChange, selectedSeason, participants, events }) => {

  const handleCloseSeason = () => {
    if (!selectedSeason) {
      alert('Keine Saison ausgewählt.');
      return;
    }

    if (settings.closedSeasons?.includes(selectedSeason)) {
      alert('Diese Saison ist bereits abgeschlossen.');
      return;
    }

    const confirmation = window.confirm(
      `Möchten Sie die Saison ${selectedSeason} wirklich abschließen?\n\n` +
      'Nach dem Abschließen werden Streichresultate in der Gesamtwertung angewendet. ' +
      'Diese Aktion kann nicht rückgängig gemacht werden.'
    );

    if (confirmation) {
      const newClosedSeasons = [...(settings.closedSeasons || []), selectedSeason];
      onSettingsChange({ ...settings, closedSeasons: newClosedSeasons });
      alert(`Saison ${selectedSeason} wurde erfolgreich abgeschlossen.`);
    }
  };

  const handleWinnerPointsChange = (index: number, value: string) => {
    if (value === '') {
      const newWinnerPoints = [...settings.winnerPoints];
      newWinnerPoints[index] = 0;
      onSettingsChange({ ...settings, winnerPoints: newWinnerPoints });
      return;
    }
    
    const points = parseInt(value, 10);
    if (!isNaN(points) && points >= 0) {
      const newWinnerPoints = [...settings.winnerPoints];
      newWinnerPoints[index] = points;
      onSettingsChange({ ...settings, winnerPoints: newWinnerPoints });
    }
  };

  const handleTTBonusChange = (
    key: 'aeroBars' | 'ttEquipment',
    field: 'enabled' | 'seconds',
    value: boolean | number
  ) => {
    const newBonuses = {
      ...settings.timeTrialBonuses,
      [key]: {
        ...settings.timeTrialBonuses[key],
        [field]: value,
      },
    };
    onSettingsChange({ ...settings, timeTrialBonuses: newBonuses });
  };
  
  const handleHandicapBasePointsChange = (pClass: PerfClass, value: string) => {
    const points = parseInt(value, 10);
    if (!isNaN(points) && points >= 0) {
        const newBasePoints = {
            ...settings.handicapBasePoints,
            [pClass]: points,
        };
        onSettingsChange({ ...settings, handicapBasePoints: newBasePoints });
    }
  };

  const handleHandicapSettingChange = (
    category: 'gender' | 'perfClass',
    key: 'female' | 'hobby',
    field: 'enabled' | 'seconds',
    value: boolean | number
  ) => {
    const newHandicapSettings = {
        ...settings.handicapSettings,
        [category]: {
            ...settings.handicapSettings[category],
            [key]: {
                ...settings.handicapSettings[category][key],
                [field]: value,
            }
        }
    };
    onSettingsChange({ ...settings, handicapSettings: newHandicapSettings });
  };
  
  const handleAgeBracketChange = (
    index: number,
    field: keyof AgeHandicapRule,
    value: boolean | number
  ) => {
    const newBrackets = [...settings.handicapSettings.ageBrackets];
    newBrackets[index] = { ...newBrackets[index], [field]: value };
    onSettingsChange({
        ...settings,
        handicapSettings: { ...settings.handicapSettings, ageBrackets: newBrackets }
    });
  };

  const handleAddAgeBracket = () => {
    const newBracket: AgeHandicapRule = { minAge: 65, maxAge: 99, seconds: -150, enabled: true };
    const newBrackets = [...settings.handicapSettings.ageBrackets, newBracket];
    onSettingsChange({
        ...settings,
        handicapSettings: { ...settings.handicapSettings, ageBrackets: newBrackets }
    });
  };

  const handleRemoveAgeBracket = (index: number) => {
    const newBrackets = settings.handicapSettings.ageBrackets.filter((_, i) => i !== index);
    onSettingsChange({
        ...settings,
        handicapSettings: { ...settings.handicapSettings, ageBrackets: newBrackets }
    });
  };

  const handleDownloadSpecification = () => {
    generateSpecDocument();
  };

  const handleDownloadMarkdown = () => {
    const content = generateProjectMarkdown(participants, events, selectedSeason);
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Skinfit_Cup_${selectedSeason}_Dokumentation.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const perfClasses: PerfClass[] = [PerfClass.A, PerfClass.B, PerfClass.C, PerfClass.D];

  return (
    <div>
      <div className="flex items-center space-x-3 mb-6">
        <CogIcon />
        <h1 className="text-3xl font-bold text-secondary">Einstellungen</h1>
      </div>
      <div className="space-y-8">
        {/* Statistiken */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-secondary mb-4 border-b pb-2">Statistiken</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Seitenbesuche gesamt</p>
              <p className="text-3xl font-bold text-primary">{settings.pageViews || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Teilnehmer gesamt</p>
              <p className="text-3xl font-bold text-primary">{participants.length}</p>
            </div>
          </div>
        </div>

        {/* Downloads & Dokumentation */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-secondary mb-4 border-b pb-2">Dokumente & Dokumentation</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-md font-medium text-gray-700 mb-2">Projekt-Dokumentation herunterladen</label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleDownloadSpecification}
                  className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-transform transform hover:scale-105"
                >
                  <DownloadIcon className="w-5 h-5" />
                  <span>Spezifikation (.txt)</span>
                </button>
                <button
                  onClick={handleDownloadMarkdown}
                  className="bg-secondary hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-transform transform hover:scale-105"
                >
                  <DownloadIcon className="w-5 h-5" />
                  <span>Projekt-Doku (.md)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Time Trial Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-secondary mb-4 border-b pb-2">Zeitfahr-Wertung</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-md font-medium text-gray-700">Bonus-Punkte für Top-Platzierungen</label>
              <p className="text-sm text-gray-500 mb-2">Punkte, die zusätzlich zu den Platzierungspunkten vergeben werden (manuelle Zuweisung im Event).</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {settings.winnerPoints.map((points, index) => (
                  <div key={index}>
                    <label htmlFor={`winner-points-${index}`} className="block text-sm font-medium text-gray-600">{index + 1}. Platz</label>
                    <input
                      type="number"
                      id={`winner-points-${index}`}
                      value={points}
                      min="0"
                      onChange={(e) => handleWinnerPointsChange(index, e.target.value)}
                      className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                    />
                  </div>
                ))}
              </div>
            </div>
            <hr />
            <div>
              <label className="block text-md font-medium text-gray-700">Material-Handicap</label>
              <p className="text-sm text-gray-500 mb-2">Zeitstrafen für spezielle Ausrüstung bei Zeitfahren.</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded-md bg-gray-50">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="aero-bars-enabled"
                      checked={settings.timeTrialBonuses.aeroBars.enabled}
                      onChange={(e) => handleTTBonusChange('aeroBars', 'enabled', e.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-primary-dark border-gray-300 rounded"
                    />
                    <label htmlFor="aero-bars-enabled" className="ml-3 block text-sm font-medium text-gray-800">Lenkeraufsatz</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={settings.timeTrialBonuses.aeroBars.seconds}
                      onChange={(e) => handleTTBonusChange('aeroBars', 'seconds', parseInt(e.target.value, 10) || 0)}
                      className="w-20 p-1 border border-gray-300 rounded-md text-sm"
                      disabled={!settings.timeTrialBonuses.aeroBars.enabled}
                    />
                    <span className="text-sm text-gray-600">Sekunden</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md bg-gray-50">
                   <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="tt-equipment-enabled"
                      checked={settings.timeTrialBonuses.ttEquipment.enabled}
                      onChange={(e) => handleTTBonusChange('ttEquipment', 'enabled', e.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-primary-dark border-gray-300 rounded"
                    />
                    <label htmlFor="tt-equipment-enabled" className="ml-3 block text-sm font-medium text-gray-800">Weiteres Zeitfahrmaterial</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={settings.timeTrialBonuses.ttEquipment.seconds}
                      onChange={(e) => handleTTBonusChange('ttEquipment', 'seconds', parseInt(e.target.value, 10) || 0)}
                      className="w-20 p-1 border border-gray-300 rounded-md text-sm"
                      disabled={!settings.timeTrialBonuses.ttEquipment.enabled}
                    />
                    <span className="text-sm text-gray-600">Sekunden</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Handicap System Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-secondary mb-4 border-b pb-2">Handicap-System</h3>
            <p className="text-sm text-gray-500 mb-4">Zeitboni (negative Sekunden), die bei Zeitfahren auf die Endzeit angerechnet werden.</p>
            <div className="space-y-6">
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 rounded-md bg-gray-50">
                        <div className="flex items-center">
                            <input type="checkbox" id="female-bonus-enabled" checked={settings.handicapSettings.gender.female.enabled} onChange={(e) => handleHandicapSettingChange('gender', 'female', 'enabled', e.target.checked)} className="h-4 w-4 text-primary focus:ring-primary-dark border-gray-300 rounded"/>
                            <label htmlFor="female-bonus-enabled" className="ml-3 block text-sm font-medium text-gray-800">Bonus für Frauen</label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input type="number" value={settings.handicapSettings.gender.female.seconds} onChange={(e) => handleHandicapSettingChange('gender', 'female', 'seconds', parseInt(e.target.value, 10) || 0)} className="w-20 p-1 border border-gray-300 rounded-md text-sm" disabled={!settings.handicapSettings.gender.female.enabled}/>
                            <span className="text-sm text-gray-600">Sekunden</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-md bg-gray-50">
                        <div className="flex items-center">
                            <input type="checkbox" id="hobby-bonus-enabled" checked={settings.handicapSettings.perfClass.hobby.enabled} onChange={(e) => handleHandicapSettingChange('perfClass', 'hobby', 'enabled', e.target.checked)} className="h-4 w-4 text-primary focus:ring-primary-dark border-gray-300 rounded"/>
                            <label htmlFor="hobby-bonus-enabled" className="ml-3 block text-sm font-medium text-gray-800">Bonus für Hobby-Klassen (A/B)</label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input type="number" value={settings.handicapSettings.perfClass.hobby.seconds} onChange={(e) => handleHandicapSettingChange('perfClass', 'hobby', 'seconds', parseInt(e.target.value, 10) || 0)} className="w-20 p-1 border border-gray-300 rounded-md text-sm" disabled={!settings.handicapSettings.perfClass.hobby.enabled}/>
                            <span className="text-sm text-gray-600">Sekunden</span>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-md font-medium text-gray-700 mb-2">Altersklassen-Bonus</label>
                    <div className="space-y-2">
                        {settings.handicapSettings.ageBrackets.map((bracket, index) => (
                            <div key={index} className="grid grid-cols-12 gap-x-3 gap-y-2 items-center p-2 rounded-md bg-gray-50 border">
                                <div className="col-span-1 flex items-center">
                                    <input type="checkbox" checked={bracket.enabled} onChange={(e) => handleAgeBracketChange(index, 'enabled', e.target.checked)} className="h-4 w-4 text-primary focus:ring-primary-dark border-gray-300 rounded"/>
                                </div>
                                <div className="col-span-5 md:col-span-3">
                                    <label className="text-sm font-medium">Alter von</label>
                                    <input type="number" value={bracket.minAge} onChange={(e) => handleAgeBracketChange(index, 'minAge', parseInt(e.target.value, 10) || 0)} className="w-full p-1 border border-gray-300 rounded-md text-sm" disabled={!bracket.enabled}/>
                                </div>
                                <div className="col-span-5 md:col-span-3">
                                    <label className="text-sm font-medium">bis</label>
                                    <input type="number" value={bracket.maxAge} onChange={(e) => handleAgeBracketChange(index, 'maxAge', parseInt(e.target.value, 10) || 0)} className="w-full p-1 border border-gray-300 rounded-md text-sm" disabled={!bracket.enabled}/>
                                </div>
                                <div className="col-span-8 md:col-span-3">
                                    <label className="text-sm font-medium">Bonus (Sek.)</label>
                                    <input type="number" value={bracket.seconds} onChange={(e) => handleAgeBracketChange(index, 'seconds', parseInt(e.target.value, 10) || 0)} className="w-full p-1 border border-gray-300 rounded-md text-sm" disabled={!bracket.enabled}/>
                                </div>
                                <div className="col-span-4 md:col-span-2 flex items-end justify-end">
                                    <button onClick={() => handleRemoveAgeBracket(index)} className="text-red-500 hover:text-red-700 p-1" aria-label="Altersklasse entfernen"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleAddAgeBracket} className="mt-3 text-primary hover:text-primary-dark font-semibold py-2 px-3 rounded-lg border border-primary flex items-center space-x-2 text-sm">
                        <PlusIcon className="w-4 h-4" /> <span>Altersklasse hinzufügen</span>
                    </button>
                </div>
            </div>
        </div>
        
        {/* Handicap Race Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-secondary mb-4 border-b pb-2">Handicap-Rennen</h3>
          <div>
            <label className="block text-md font-medium text-gray-700">Basis-Punkte pro Leistungsklasse</label>
            <p className="text-sm text-gray-500 mb-2">Punkte, die ein Finisher der Zielgruppe 1 in der jeweiligen Klasse erhält.</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {perfClasses.map((pClass) => (
                <div key={pClass}>
                  <label htmlFor={`handicap-points-${pClass}`} className="block text-sm font-medium text-gray-600">Klasse {pClass}</label>
                  <input
                    type="number"
                    id={`handicap-points-${pClass}`}
                    value={settings.handicapBasePoints[pClass] || 0}
                    min="0"
                    onChange={(e) => handleHandicapBasePointsChange(pClass, e.target.value)}
                    className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Season Management */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-secondary mb-4 border-b pb-2">Saison-Verwaltung</h3>
          <div>
            <label className="block text-md font-medium text-gray-700 mb-2">Saison abschließen</label>
            <p className="text-sm text-gray-500 mb-4">
              Schließen Sie die Saison {selectedSeason} ab, um Streichresultate in der Gesamtwertung anzuwenden.
              {settings.closedSeasons?.includes(selectedSeason || 0) && (
                <span className="block mt-2 text-green-600 font-semibold">✓ Diese Saison ist bereits abgeschlossen.</span>
              )}
            </p>
            <button
              onClick={handleCloseSeason}
              disabled={settings.closedSeasons?.includes(selectedSeason || 0)}
              className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {settings.closedSeasons?.includes(selectedSeason || 0) 
                ? 'Saison abgeschlossen' 
                : `Saison ${selectedSeason} abschließen`}
            </button>
            <p className="text-xs text-gray-500 mt-3">
              <strong>Hinweis:</strong> Nach dem Abschließen werden folgende Regeln angewendet:<br />
              • Teilnehmer mit nur 1 Event: Kein Streichresultat<br />
              • Teilnehmer mit mehreren Events: Das schlechteste Resultat wird gestrichen<br />
              • Nicht-Teilnahme zählt automatisch als Streichresultat
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
