import { describe, expect, it } from 'vitest';
import { calculateSeasonResults, eventTeamData, mergeSeasons, replaceEventTeams, sliceSeason } from './seasonData';
import { getInitialSettings } from './mockDataService';
import type { Event, Result, Team, TeamMember } from '../types';

const ev = (id: string, season: number, finished = false) =>
  ({ id, name: id, date: '2026-05-01', location: 'X', eventType: 'EZF', notes: '', finished, season }) as unknown as Event;
const res = (id: string, eventId: string, points = 7): Result => ({ id, eventId, participantId: 'p1', dnf: false, points });
const team = (id: string, eventId: string): Team => ({ id, eventId, name: id });
const member = (id: string, teamId: string): TeamMember => ({ id, teamId, participantId: 'p1', penaltyMinus2: false });

const all = {
  events: [ev('e1', 2025), ev('e2', 2026), ev('e3', 2026)],
  results: [res('r1', 'e1'), res('r2', 'e2'), res('r3', 'e3')],
  teams: [team('t1', 'e1'), team('t2', 'e2')],
  teamMembers: [member('m1', 't1'), member('m2', 't2')],
};

describe('seasonData', () => {
  it('mergeSeasons vereint DB- und Event-Saisons absteigend ohne Duplikate', () => {
    expect(mergeSeasons([2024, 2026], all.events)).toEqual([2026, 2025, 2024]);
  });

  it('sliceSeason filtert alle Bereiche auf eine Saison', () => {
    const s = sliceSeason(all, 2026);
    expect(s.events.map(e => e.id)).toEqual(['e2', 'e3']);
    expect(s.results.map(r => r.id)).toEqual(['r2', 'r3']);
    expect(s.teams.map(t => t.id)).toEqual(['t2']);
    expect(s.teamMembers.map(m => m.id)).toEqual(['m2']);
    expect(sliceSeason(all, null).events).toEqual([]);
  });

  it('calculateSeasonResults setzt offene Events auf 0 Punkte', () => {
    const out = calculateSeasonResults(sliceSeason(all, 2026), [], getInitialSettings());
    expect(out.map(r => [r.id, r.points])).toEqual([['r2', 0], ['r3', 0]]);
  });

  it('replaceEventTeams tauscht nur die Teams und Mitglieder des Events', () => {
    const out = replaceEventTeams(all.teams, all.teamMembers, 'e2', { teams: [team('t9', 'e2')], teamMembers: [member('m9', 't9')] });
    expect(out.teams.map(t => t.id)).toEqual(['t1', 't9']);
    expect(out.teamMembers.map(m => m.id)).toEqual(['m1', 'm9']);
  });

  it('eventTeamData liefert Teams und Mitglieder eines Events', () => {
    expect(eventTeamData(all.teams, all.teamMembers, 'e1')).toEqual({ teams: [team('t1', 'e1')], teamMembers: [member('m1', 't1')] });
  });
});
