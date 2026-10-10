import type { Event, Participant, Result, Settings, Team, TeamMember } from '../types';
import { calculatePointsForEvent } from './scoringService';

export interface SeasonSlice {
  events: Event[];
  results: Result[];
  teams: Team[];
  teamMembers: TeamMember[];
}

/** Saisons aus der Datenbank plus alle, in denen es Events gibt – absteigend sortiert, ohne Duplikate */
export function mergeSeasons(dbSeasons: number[], events: Pick<Event, 'season'>[]): number[] {
  return [...new Set([...dbSeasons, ...events.map(e => e.season)])].sort((a, b) => Number(b) - Number(a));
}

/** Schneidet Events, Ergebnisse, Teams und Teammitglieder auf eine Saison zu */
export function sliceSeason(all: SeasonSlice, season: number | null): SeasonSlice {
  const events = (all.events || []).filter(e => e.season === season);
  const eventIds = new Set(events.map(e => e.id));
  const teams = (all.teams || []).filter(t => eventIds.has(t.eventId));
  const teamIds = new Set(teams.map(t => t.id));
  return {
    events,
    results: (all.results || []).filter(r => eventIds.has(r.eventId)),
    teams,
    teamMembers: (all.teamMembers || []).filter(tm => teamIds.has(tm.teamId)),
  };
}

/** Punkte für abgeschlossene Events neu berechnen; offene Events behalten ihre Ergebnisse mit 0 Punkten */
export function calculateSeasonResults(season: SeasonSlice, participants: Participant[], settings: Settings): Result[] {
  return season.events.flatMap(event => {
    const eventResults = season.results.filter(r => r.eventId === event.id);
    if (event.finished && eventResults.length > 0) {
      return calculatePointsForEvent(event, eventResults, participants, season.teams, season.teamMembers, settings);
    }
    return eventResults.map(r => ({ ...r, points: 0 }));
  });
}

/** Ersetzt die Teams eines Events und deren Mitglieder durch die gespeicherten Daten */
export function replaceEventTeams(
  teams: Team[], teamMembers: TeamMember[], eventId: string, saved: { teams: Team[]; teamMembers: TeamMember[] },
): { teams: Team[]; teamMembers: TeamMember[] } {
  const oldTeamIds = new Set(teams.filter(t => t.eventId === eventId).map(t => t.id));
  return {
    teams: [...teams.filter(t => t.eventId !== eventId), ...saved.teams],
    teamMembers: [...teamMembers.filter(tm => !oldTeamIds.has(tm.teamId)), ...saved.teamMembers],
  };
}

/** Teams und Mitglieder eines einzelnen Events */
export function eventTeamData(teams: Team[], teamMembers: TeamMember[], eventId: string) {
  const eventTeams = teams.filter(t => t.eventId === eventId);
  const ids = new Set(eventTeams.map(t => t.id));
  return { teams: eventTeams, teamMembers: teamMembers.filter(tm => ids.has(tm.teamId)) };
}
