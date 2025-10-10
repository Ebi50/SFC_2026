import React, { useMemo, useState } from 'react';
import { Event, Participant, Result, Team, TeamMember, Settings, EventType, GroupLabel, EventNotes } from '../types';
import { CalendarIcon } from './icons';
import { calculateHandicap, getParticipantGroup } from '../services/scoringService';

interface PublicEventViewProps {
    event: Event | null;
    participants: Participant[];
    results: Result[];
    teams: Team[];
    teamMembers: TeamMember[];
    settings: Settings;
}

const eventTypeLabels: Record<EventType, string> = {
    [EventType.EZF]: 'Einzelzeitfahren',
    [EventType.MZF]: 'Mannschaftszeitfahren',
    [EventType.BZF]: 'Bergzeitfahren',
    [EventType.Handicap]: 'Handicap',
};

const formatDate = (dateString: string) => new Intl.DateTimeFormat('de-DE', { dateStyle: 'full' }).format(new Date(dateString));

const formatSecondsToMMSS = (totalSeconds?: number): string => {
    if (totalSeconds === null || totalSeconds === undefined || !isFinite(totalSeconds) || totalSeconds < 0) {
        return '-';
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.round(totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const getPlacementPoints = (rank: number): number => {
    if (rank <= 10) return 8;
    if (rank <= 20) return 7;
    if (rank <= 30) return 6;
    return 5;
};

export const PublicEventView: React.FC<PublicEventViewProps> = ({ event, participants, results, teams, teamMembers, settings }) => {
    const [filterStatus, setFilterStatus] = useState<'all' | 'finished' | 'dnf'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'rank', direction: 'asc' });

    const participantMap = useMemo(() => new Map(participants.map(p => [p.id, p])), [participants]);

    const getParticipantName = (id: string) => {
        const p = participantMap.get(id);
        return p ? `${p.lastName}, ${p.firstName}` : 'Unbekannt';
    }

    const participantMatchesSearch = (participantId: string, term: string): boolean => {
        const trimmedTerm = term.trim().toLowerCase();
        if (!trimmedTerm) return true;
        const participant = participantMap.get(participantId);
        if (!participant) return false;

        const fullName = `${participant.firstName} ${participant.lastName}`.toLowerCase();
        const reversedFullName = `${participant.lastName}, ${participant.firstName}`.toLowerCase();
        return fullName.includes(trimmedTerm) || reversedFullName.includes(trimmedTerm);
    };

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortArrow = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return '';
        return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    };

    const filteredResults = useMemo(() => {
        return results.filter(result => {
            const nameMatch = participantMatchesSearch(result.participantId, searchTerm);
            const statusMatch = filterStatus === 'all' || (filterStatus === 'finished' && !result.dnf) || (filterStatus === 'dnf' && result.dnf);
            return nameMatch && statusMatch;
        });
    }, [results, searchTerm, filterStatus]);

    if (!event) {
        return (
            <div className="bg-white rounded-2xl shadow-card p-8 mt-8">
                <h2 className="text-3xl font-display font-bold text-dark-bg mb-4">Event Details</h2>
                <p className="text-gray-600">Wählen Sie ein Event aus, um die Ergebnisse anzuzeigen.</p>
            </div>
        );
    }

    const renderTimeTrialResults = () => {
        const rankedFinishers = filteredResults
            .filter(r => !r.dnf && participantMap.has(r.participantId))
            .map(r => {
                const participant = participantMap.get(r.participantId)!;
                const handicap = calculateHandicap(participant, r, event, settings);
                const adjustedTime = (r.timeSeconds || 0) + handicap;
                return { ...r, participant, adjustedTime };
            })
            .sort((a, b) => a.adjustedTime - b.adjustedTime)
            .map((result, index) => ({ ...result, rank: index + 1 }));

        let displayData = [...rankedFinishers];

        if (sortConfig) {
            displayData.sort((a, b) => {
                let aVal: any;
                let bVal: any;
                if (sortConfig.key === 'name') {
                    aVal = getParticipantName(a.participantId);
                    bVal = getParticipantName(b.participantId);
                } else {
                    aVal = a[sortConfig.key as keyof typeof a] ?? (sortConfig.direction === 'asc' ? Infinity : -Infinity);
                    bVal = b[sortConfig.key as keyof typeof b] ?? (sortConfig.direction === 'asc' ? Infinity : -Infinity);
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                
                const rankDiff = (a.rank ?? Infinity) - (b.rank ?? Infinity);
                if (rankDiff !== 0) return rankDiff;

                return getParticipantName(a.participantId).localeCompare(getParticipantName(b.participantId));
            });
        }

        const dnfs = filteredResults.filter(r => r.dnf);

        if (displayData.length === 0 && dnfs.length === 0) {
            return <div className="p-4 text-center text-gray-500">Keine Ergebnisse für die aktuellen Filter gefunden.</div>;
        }

        return (
            <table className="w-full min-w-[700px] text-left">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-3 font-semibold text-sm text-gray-600 tracking-wider">
                            <button className="font-semibold" onClick={() => requestSort('rank')}>Rang{getSortArrow('rank')}</button>
                        </th>
                        <th className="p-3 font-semibold text-sm text-gray-600 tracking-wider">
                            <button className="font-semibold" onClick={() => requestSort('name')}>Name{getSortArrow('name')}</button>
                        </th>
                        <th className="p-3 font-semibold text-sm text-gray-600 tracking-wider text-center">
                            <button className="font-semibold" onClick={() => requestSort('timeSeconds')}>Fahrzeit{getSortArrow('timeSeconds')}</button>
                        </th>
                        <th className="p-3 font-semibold text-sm text-gray-600 tracking-wider text-center">
                            <button className="font-semibold" onClick={() => requestSort('adjustedTime')}>Wertungszeit{getSortArrow('adjustedTime')}</button>
                        </th>
                        <th className="p-3 font-semibold text-sm text-gray-600 tracking-wider text-right">
                            <button className="font-semibold" onClick={() => requestSort('points')}>Punkte{getSortArrow('points')}</button>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {displayData.map((result) => (
                        <tr key={result.id} className="hover:bg-primary/10">
                            <td className="p-3 font-bold">{result.rank}.</td>
                            <td className="p-3">
                                <div className="flex items-center">
                                    <span>{getParticipantName(result.participantId)}</span>
                                    {result.winnerRank && result.winnerRank <= settings.winnerPoints.length && (
                                        <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                            +{settings.winnerPoints[result.winnerRank - 1]} Bonus Pts
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="p-3 font-mono text-center">{formatSecondsToMMSS(result.timeSeconds)}</td>
                            <td className="p-3 font-mono text-center font-semibold text-primary-dark">{formatSecondsToMMSS(result.adjustedTime)}</td>
                            <td className="p-3 font-mono text-right font-bold">{result.points}</td>
                        </tr>
                    ))}
                    {dnfs.map(result => (
                        <tr key={result.id} className="hover:bg-red-50 opacity-70">
                            <td className="p-3 font-bold text-red-600">DNF</td>
                            <td className="p-3">{getParticipantName(result.participantId)}</td>
                            <td className="p-3 font-mono text-center">-</td>
                            <td className="p-3 font-mono text-center">-</td>
                            <td className="p-3 font-mono text-right font-bold">{result.points}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    const renderMZFResults = () => {
        const allTeamsRanked = useMemo(() => {
            const allTeamsWithData = teams.map(team => {
                const allMembersOfTeam = teamMembers.filter(tm => tm.teamId === team.id);
                const validFinisherResults = allMembersOfTeam
                    .map(member => results.find(r => r.participantId === member.participantId))
                    .filter((r): r is Result => r !== undefined && !r.dnf && r.timeSeconds != null && r.timeSeconds > 0);

                if (validFinisherResults.length < 2) {
                    return { ...team, adjustedTime: Infinity, totalTeamHandicap: 0, rank: Infinity };
                }

                const sortedFinisherTimes = validFinisherResults.map(r => r.timeSeconds!).sort((a, b) => a - b);
                const baseTime = sortedFinisherTimes[Math.max(0, validFinisherResults.length - 2)];

                const totalTeamHandicap = allMembersOfTeam.reduce((sum, member) => {
                    const participant = participantMap.get(member.participantId);
                    const result = results.find(r => r.participantId === member.participantId);
                    if (participant && result) {
                        return sum + calculateHandicap(participant, result, event, settings);
                    }
                    return sum;
                }, 0);

                const adjustedTime = baseTime + totalTeamHandicap;

                return { ...team, adjustedTime, totalTeamHandicap, rank: 0 };
            });

            const sortedTeams = [...allTeamsWithData].sort((a, b) => {
                const timeDiff = a.adjustedTime - b.adjustedTime;
                if (timeDiff !== 0) return timeDiff;
                return a.name.localeCompare(b.name);
            });

            const rankedTeamsWithTies = [];
            let rank = 1;
            for (let i = 0; i < sortedTeams.length; i++) {
                const team = sortedTeams[i];

                if (!isFinite(team.adjustedTime)) {
                    rankedTeamsWithTies.push({ ...team, rank: Infinity });
                    continue;
                }

                if (i > 0 && sortedTeams[i].adjustedTime > sortedTeams[i - 1].adjustedTime) {
                    rank = i + 1;
                }

                rankedTeamsWithTies.push({ ...team, rank: rank });
            }
            return rankedTeamsWithTies;
        }, [teams, teamMembers, results, participantMap, event, settings]);

        const displayedTeams = allTeamsRanked.filter(team => {
            const members = teamMembers.filter(tm => tm.teamId === team.id);
            if (members.length === 0) return false;

            return members.some(member => {
                const nameMatches = participantMatchesSearch(member.participantId, searchTerm);
                if (!nameMatches) return false;

                const result = results.find(r => r.participantId === member.participantId);
                const statusMatches = filterStatus === 'all'
                    || (result && ((filterStatus === 'finished' && !result.dnf) || (filterStatus === 'dnf' && result.dnf)));

                return statusMatches;
            });
        });

        if (displayedTeams.length === 0) {
            return <div className="p-4 text-center text-gray-500">Keine Ergebnisse für die aktuellen Filter gefunden.</div>;
        }

        return (
            <div className="space-y-6">
                {displayedTeams.map((team) => {
                    const teamRank = team.rank;
                    let teamPoints = 0;
                    if (isFinite(team.adjustedTime)) {
                        teamPoints = getPlacementPoints(teamRank);
                        if (teamRank <= settings.winnerPoints.length) {
                            teamPoints += settings.winnerPoints[teamRank - 1];
                        }
                    }
                    const displayedMembers = teamMembers
                        .filter(tm => tm.teamId === team.id)
                        .filter(member => {
                            if (filterStatus === 'all') return true;
                            const r = results.find(res => res.participantId === member.participantId);
                            if (!r) return false;
                            return (filterStatus === 'finished' && !r.dnf) || (filterStatus === 'dnf' && r.dnf);
                        });

                    return (
                        <div key={team.id} className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 min-w-[650px]">
                            <div className="flex justify-between items-center gap-4 mb-3 border-b pb-3">
                                <h4 className="text-xl font-bold text-secondary truncate whitespace-nowrap" title={team.name}>
                                    {team.rank}. {team.name}
                                </h4>
                                <div className="flex items-center space-x-6 flex-shrink-0">
                                    <div className="text-right">
                                        <div className="text-sm text-gray-500">Wertungszeit</div>
                                        <div className="text-2xl font-bold text-primary-dark">{isFinite(team.adjustedTime) ? formatSecondsToMMSS(team.adjustedTime) : 'N/A'}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-500">Ges. Handicap</div>
                                        {isFinite(team.adjustedTime) ? (
                                            <div className={`text-2xl font-bold ${team.totalTeamHandicap > 0 ? 'text-red-600' : team.totalTeamHandicap < 0 ? 'text-green-600' : 'text-gray-800'}`}>
                                                {team.totalTeamHandicap > 0 ? '+' : ''}{team.totalTeamHandicap.toFixed(0)}s
                                            </div>
                                        ) : (
                                            <div className="text-2xl font-bold text-gray-400">N/A</div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-500">Punkte</div>
                                        <div className="text-2xl font-bold text-primary-dark">{teamPoints}</div>
                                    </div>
                                </div>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr>
                                        <th className="p-2 font-semibold text-gray-600">Name</th>
                                        <th className="p-2 font-semibold text-gray-600 text-center">Fahrzeit</th>
                                        <th className="p-2 font-semibold text-gray-600 text-center">Status</th>
                                        <th className="p-2 font-semibold text-gray-600 text-right">Punkte</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedMembers
                                        .sort((a, b) => getParticipantName(a.participantId).localeCompare(getParticipantName(b.participantId)))
                                        .map(member => {
                                            const result = results.find(r => r.participantId === member.participantId);
                                            return (
                                                <tr key={member.id}>
                                                    <td className="p-2">{getParticipantName(member.participantId)}</td>
                                                    <td className="p-2 text-center font-mono">{formatSecondsToMMSS(result?.timeSeconds)}</td>
                                                    <td className="p-2 text-center font-semibold">{result?.dnf ? <span className="text-red-600">DNF</span> : 'Finisher'}</td>
                                                    <td className="p-2 text-right font-mono font-bold">{result?.points ?? 0}</td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderHandicapResults = () => {
        if (results.length === 0) {
            return <div className="text-center text-gray-500 py-8">Noch keine Ergebnisse für dieses Event vorhanden.</div>;
        }
        if (filteredResults.length === 0) {
            return <div className="p-4 text-center text-gray-500">Keine Ergebnisse für die aktuellen Filter gefunden.</div>;
        }

        const groupedResults = filteredResults.reduce<Record<GroupLabel, Result[]>>((acc, result) => {
            const participant = participantMap.get(result.participantId);
            if (participant) {
                const group = getParticipantGroup(participant);
                acc[group].push(result);
            }
            return acc;
        }, { [GroupLabel.Ambitious]: [], [GroupLabel.Hobby]: [], [GroupLabel.Women]: [] });

        const resultGroups = [
            { title: "Männer Ambitioniert (C/D)", resultsForGroup: groupedResults[GroupLabel.Ambitious] },
            { title: "Männer Hobby (A/B)", resultsForGroup: groupedResults[GroupLabel.Hobby] },
            { title: "Frauen", resultsForGroup: groupedResults[GroupLabel.Women] }
        ];

        return (
            <div>
                {resultGroups.map(({ title, resultsForGroup }) => {
                    if (resultsForGroup.length === 0) {
                        return null;
                    }

                    const finishers = resultsForGroup.filter(r => !r.dnf);
                    const dnfs = resultsForGroup.filter(r => r.dnf);

                    const rankedResults = [...finishers]
                        .sort((a, b) => {
                            const aHasWinnerRank = a.winnerRank ? 1 : 0;
                            const bHasWinnerRank = b.winnerRank ? 1 : 0;

                            if (aHasWinnerRank !== bHasWinnerRank) {
                                return bHasWinnerRank - aHasWinnerRank;
                            }

                            if (a.winnerRank && b.winnerRank) {
                                return a.winnerRank - b.winnerRank;
                            }

                            const pointsDiff = (b.points ?? 0) - (a.points ?? 0);
                            if (pointsDiff !== 0) return pointsDiff;
                            return getParticipantName(a.participantId).localeCompare(getParticipantName(b.participantId));
                        })
                        .map((r, index) => ({ ...r, rank: index + 1 }));

                    return (
                        <div key={title} className="mb-8">
                            <h3 className="text-xl font-bold text-secondary mb-4">{title}</h3>
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="w-full min-w-[600px] text-left">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-3 font-semibold text-sm text-gray-600 tracking-wider">Rang</th>
                                            <th className="p-3 font-semibold text-sm text-gray-600 tracking-wider">Name</th>
                                            <th className="p-3 font-semibold text-sm text-gray-600 tracking-wider">Zielgruppe</th>
                                            <th className="p-3 font-semibold text-sm text-gray-600 tracking-wider text-right">Punkte</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {rankedResults.map((result) => (
                                            <tr key={result.id} className="hover:bg-primary/10">
                                                <td className="p-3 font-bold">{result.rank}.</td>
                                                <td className="p-3">
                                                    <div className="flex items-center">
                                                        <span>
                                                            {getParticipantName(result.participantId)}
                                                            {(() => {
                                                                const participant = participantMap.get(result.participantId);
                                                                return participant?.perfClass ? ` (${participant.perfClass})` : '';
                                                            })()}
                                                        </span>
                                                        {result.winnerRank && result.winnerRank <= settings.winnerPoints.length && (
                                                            <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                                +{settings.winnerPoints[result.winnerRank - 1]} Bonus Pts
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3">{result.finisherGroup ?? 1}</td>
                                                <td className="p-3 font-mono text-right font-bold">{result.points}</td>
                                            </tr>
                                        ))}
                                        {dnfs.map(result => (
                                            <tr key={result.id} className="hover:bg-red-50 opacity-70">
                                                <td className="p-3 font-bold text-red-600">DNF</td>
                                                <td className="p-3">
                                                    {getParticipantName(result.participantId)}
                                                    {(() => {
                                                        const participant = participantMap.get(result.participantId);
                                                        return participant?.perfClass ? ` (${participant.perfClass})` : '';
                                                    })()}
                                                </td>
                                                <td className="p-3">-</td>
                                                <td className="p-3 font-mono text-right font-bold">{result.points}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-2xl shadow-card p-8 mt-8">
            <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                    <CalendarIcon className="text-primary" />
                    <h2 className="text-3xl font-display font-bold text-dark-bg">{event.name}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <span className="text-sm text-gray-600">Datum:</span>
                        <p className="font-semibold">{formatDate(event.date)}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600">Ort:</span>
                        <p className="font-semibold">{event.location}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600">Art des Events:</span>
                        <p className="font-semibold">{eventTypeLabels[event.eventType]}</p>
                    </div>
                </div>
            </div>

            {(() => {
                try {
                    const eventNotes: EventNotes = event.notes ? JSON.parse(event.notes) : {};
                    const hasNotes = Object.values(eventNotes).some(note => note);
                    
                    if (!hasNotes) return null;
                    
                    const notesEntries = [
                        [GroupLabel.Hobby, eventNotes[GroupLabel.Hobby]],
                        [GroupLabel.Ambitious, eventNotes[GroupLabel.Ambitious]],
                        [GroupLabel.Women, eventNotes[GroupLabel.Women]]
                    ].filter((entry): entry is [GroupLabel, string] => !!entry[1]);
                    
                    return (
                        <div className="mb-6 p-6 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
                            <h4 className="text-lg font-bold text-gray-800 mb-4">Event-Notizen</h4>
                            <div className="space-y-4">
                                {notesEntries.map(([label, value]) => (
                                    <div key={label}>
                                        <h5 className="text-sm font-semibold text-gray-700 mb-1">{label}</h5>
                                        <p className="text-gray-600 whitespace-pre-wrap">{value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                } catch {
                    return null;
                }
            })()}

            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                    <input
                        type="text"
                        placeholder="Nach Namen suchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as 'all' | 'finished' | 'dnf')}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value="all">Alle</option>
                    <option value="finished">Finisher</option>
                    <option value="dnf">DNF</option>
                </select>
            </div>

            <div className="overflow-x-auto">
                {event.eventType === EventType.MZF ? renderMZFResults() : 
                 event.eventType === EventType.Handicap ? renderHandicapResults() : 
                 renderTimeTrialResults()}
            </div>
        </div>
    );
};
