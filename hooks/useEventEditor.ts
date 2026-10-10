import { useState } from 'react';
import type { Event, Result, Team, TeamMember } from '../types';
import { eventsApi, seasonsApi } from '../services/api';
import { replaceEventTeams } from '../services/seasonData';
import type { SeasonData } from './useSeasonData';

const errorText = (error: any) => error?.message || error?.toString() || 'Unbekannter Fehler';

/** Events, Teams und Saisons bearbeiten (Admin) */
export function useEventEditor(data: SeasonData) {
  const { selectedSeason, setEvents, setResults, teams, setTeams, setTeamMembers, setAvailableSeasons, setSelectedSeason } = data;
  const [isEventOpen, setEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);
  const [teamEvent, setTeamEvent] = useState<Event | null>(null);
  const [isSeasonOpen, setSeasonOpen] = useState(false);

  const applySavedTeams = (eventId: string, saved: { teams: Team[]; teamMembers: TeamMember[] }) => {
    // alte Team-IDs aus dem aktuellen Render, Listen selbst funktional aktualisieren
    setTeams(prev => replaceEventTeams(prev, [], eventId, saved).teams);
    setTeamMembers(prev => replaceEventTeams(teams, prev, eventId, saved).teamMembers);
  };

  const openEvent = (event?: Event) => {
    setEditingEvent(event);
    setEventOpen(true);
  };

  const closeEvent = () => {
    setEditingEvent(undefined);
    setEventOpen(false);
  };

  const saveEvent = async (event: Event, eventResults: Result[], eventTeams: Team[], eventTeamMembers: TeamMember[]) => {
    try {
      if (!editingEvent && !selectedSeason) {
        alert('Bitte wählen Sie zuerst eine Saison aus oder erstellen Sie eine neue Saison.');
        return;
      }
      // Neue Events bekommen die gewählte Saison, bearbeitete behalten ihre
      const withSeason = { ...event, season: editingEvent ? editingEvent.season : selectedSeason! };
      let eventId = event.id;
      if (editingEvent) {
        await eventsApi.update(withSeason.id, withSeason);
        setEvents(prev => prev.map(e => (e.id === withSeason.id ? withSeason : e)));
      } else {
        const created = await eventsApi.create(withSeason);
        eventId = created.id;
        setEvents(prev => [...prev, created]);
      }
      const savedResults = await eventsApi.saveResults(eventId, eventResults);
      setResults(prev => [...prev.filter(r => r.eventId !== eventId), ...savedResults]);
      applySavedTeams(eventId, await eventsApi.saveTeams(eventId, eventTeams, eventTeamMembers));
      closeEvent();
    } catch (error) {
      console.error('Error saving event:', error);
      alert(`Fehler beim Speichern des Events:\n${errorText(error)}`);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Möchten Sie dieses Event wirklich löschen?')) return;
    try {
      await eventsApi.delete(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setResults(prev => prev.filter(r => r.eventId !== eventId));
      setTeams(prev => prev.filter(t => t.eventId !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Fehler beim Löschen des Events');
    }
  };

  const saveTeams = async (eventId: string, newTeams: Team[], newTeamMembers: TeamMember[]) => {
    try {
      applySavedTeams(eventId, await eventsApi.saveTeams(eventId, newTeams, newTeamMembers));
      setTeamEvent(null);
    } catch (error) {
      console.error('Error saving teams:', error);
      alert('Fehler beim Speichern der Teams');
    }
  };

  const createSeason = async (season: number) => {
    try {
      await seasonsApi.create(season);
      setAvailableSeasons(prev => [...prev, season].sort((a, b) => b - a));
      setSelectedSeason(season);
      setSeasonOpen(false);
    } catch (error) {
      console.error('Error creating season:', error);
      alert('Fehler beim Erstellen der Saison');
    }
  };

  return {
    isEventOpen, editingEvent, openEvent, closeEvent, saveEvent, deleteEvent,
    teamEvent, openTeams: (e: Event) => setTeamEvent(e), closeTeams: () => setTeamEvent(null), saveTeams,
    isSeasonOpen, openSeason: () => setSeasonOpen(true), closeSeason: () => setSeasonOpen(false), createSeason,
  };
}

export type EventEditor = ReturnType<typeof useEventEditor>;
