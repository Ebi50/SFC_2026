import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Event, Participant, Result, Settings, Team, TeamMember } from '../types';
import { getInitialSettings } from '../services/mockDataService';
import { eventsApi, participantsApi, seasonsApi, settingsApi } from '../services/api';
import { calculateSeasonResults, mergeSeasons, sliceSeason } from '../services/seasonData';

/** Lädt Teilnehmer, Events, Saisons und Saison-Einstellungen und leitet die Daten der gewählten Saison ab */
export function useSeasonData(isAdmin: boolean) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [settings, setSettings] = useState<Settings>(getInitialSettings());
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [participantsData, eventsData, seasonsData] = await Promise.all([
        participantsApi.getAll(),
        eventsApi.getAll(),
        seasonsApi.getAll(),
      ]);
      setParticipants(participantsData.participants);
      setEvents(eventsData.events);
      setResults(eventsData.results);
      setTeams(eventsData.teams);
      setTeamMembers(eventsData.teamMembers);

      const seasons = mergeSeasons(seasonsData.seasons || [], eventsData.events || []);
      setAvailableSeasons(seasons);
      // nur vorbelegen – eine bereits gewählte Saison bleibt beim Neuladen erhalten
      if (seasons.length > 0) setSelectedSeason(prev => prev ?? seasons[0]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Beim Start und nach An-/Abmelden als Admin (andere Datensicht) neu laden
  useEffect(() => {
    loadData();
  }, [isAdmin, loadData]);

  // Saison-Einstellungen; Fallback auf globale Einstellungen bzw. Standardwerte
  useEffect(() => {
    if (!selectedSeason) return;
    (async () => {
      try {
        setSettings(await settingsApi.getForSeason(selectedSeason));
      } catch (err) {
        console.error('Error loading season settings:', err);
        try {
          setSettings(await settingsApi.get());
        } catch (err2) {
          console.error('Error loading global settings:', err2);
          setSettings(getInitialSettings());
        }
      }
    })();
  }, [selectedSeason]);

  const handleSettingsChange = async (newSettings: Settings) => {
    try {
      if (selectedSeason) await settingsApi.updateForSeason(selectedSeason, newSettings);
      else await settingsApi.update(newSettings);
      setSettings(newSettings);
      await loadData();
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const season = useMemo(
    () => sliceSeason({ events, results, teams, teamMembers }, selectedSeason),
    [events, results, teams, teamMembers, selectedSeason],
  );
  const calculatedResults = useMemo(
    () => calculateSeasonResults(season, participants, settings),
    [season, participants, settings],
  );

  return {
    loading,
    participants, setParticipants,
    events, setEvents,
    results, setResults,
    teams, setTeams,
    teamMembers, setTeamMembers,
    settings, handleSettingsChange,
    selectedSeason, setSelectedSeason,
    availableSeasons, setAvailableSeasons,
    season, calculatedResults,
  };
}

export type SeasonData = ReturnType<typeof useSeasonData>;
