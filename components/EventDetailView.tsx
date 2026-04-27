import React, { useMemo, useState, useEffect } from 'react';
import { Event, Participant, Result, Team, TeamMember, Settings, EventType, GroupLabel, EventNotes } from '../types';
import { ArrowLeftIcon, CalendarIcon, PencilIcon } from './icons';
import { calculateHandicap, getParticipantGroup } from '../services/scoringService';
import { useAuth } from './AuthContext';
import { eventsApi, eventRegistrationApi, userApi } from '../services/api';
import { EmailEventModal } from './EmailEventModal';

interface EventDetailViewProps {
    event: Event;
    participants: Participant[];
    results: Result[];
    teams: Team[];
    teamMembers: TeamMember[];
    settings: Settings;
    onBack: () => void;
    onEditTeams: (eventId: string) => void;
}

const eventTypeLabels: Record<EventType, string> = {
    [EventType.EZF]: 'Einzelzeitfahren',
    [EventType.MZF]: 'Mannschaftszeitfahren',
    [EventType.BZF]: 'Bergzeitfahren',
    [EventType.Handicap]: 'Handicap',
};

const formatDate = (dateString: string) => new Intl.DateTimeFormat('de-DE', { dateStyle: 'full' }).format(new Date(dateString));

// Helper function to format seconds into mm:ss
const formatSecondsToMMSS = (totalSeconds?: number): string => {
    if (totalSeconds === null || totalSeconds === undefined || !isFinite(totalSeconds) || totalSeconds < 0) {
        return '-';
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.round(totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Helper function to determine placement points, mirrored from scoringService
const getPlacementPoints = (rank: number): number => {
    if (rank <= 10) return 8;
    if (rank <= 20) return 7;
    if (rank <= 30) return 6;
    return 5;
};

export const EventDetailView: React.FC<EventDetailViewProps> = ({ event, participants, results, teams, teamMembers, settings, onBack, onEditTeams }) => {
    const { isAdmin } = useAuth();
    
    const { isLoggedIn } = useAuth();

    const [filterStatus, setFilterStatus] = useState<'all' | 'finished' | 'dnf'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const [eventNotes, setEventNotes] = useState<EventNotes>({});
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [isSavingNotes, setIsSavingNotes] = useState(false);

    const [isEmailModalOpen, setEmailModalOpen] = useState(false);

    // Registration state
    const [isRegistered, setIsRegistered] = useState(false);
    const [registrationCount, setRegistrationCount] = useState(0);
    const [registeredParticipants, setRegisteredParticipants] = useState<any[]>([]);
    const [isRegistering, setIsRegistering] = useState(false);

    // Tab state - default to 'registrations' for upcoming events, 'results' for finished
    const [activeTab, setActiveTab] = useState<'results' | 'registrations'>(event.finished ? 'results' : 'registrations');

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 200);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Load registration data
    const loadRegistrations = () => {
        eventRegistrationApi.getRegistrations(event.id).then(data => {
            setRegistrationCount(data.count || 0);
            setRegisteredParticipants(data.registrations || []);
        }).catch(() => {});
    };

    useEffect(() => {
        loadRegistrations();
        if (isLoggedIn) {
            userApi.getMyRegistrations().then(data => {
                setIsRegistered(data.eventIds?.includes(event.id) || false);
            }).catch(() => {});
        }
    }, [event.id, isLoggedIn]);

    const handleRegister = async () => {
        setIsRegistering(true);
        try {
            await eventRegistrationApi.register(event.id);
            setIsRegistered(true);
            loadRegistrations();
        } catch (error) {
            console.error('Registration error:', error);
        } finally {
            setIsRegistering(false);
        }
    };

    const handleUnregister = async () => {
        setIsRegistering(true);
        try {
            await eventRegistrationApi.unregister(event.id);
            setIsRegistered(false);
            loadRegistrations();
        } catch (error) {
            console.error('Unregistration error:', error);
        } finally {
            setIsRegistering(false);
        }
    };

    useEffect(() => {
        // Set default sort order based on event type when the component mounts or the event changes.
        if (event.eventType === EventType.EZF || event.eventType === EventType.BZF) {
            // For individual time trials, the default sort is by rank, ascending.
            setSortConfig({ key: 'rank', direction: 'asc' });
        } else if (event.eventType === EventType.Handicap) {
             // For handicap events, the default sort is also by rank, ascending.
            setSortConfig({ key: 'rank', direction: 'asc' });
        } else if (event.eventType === EventType.MZF) {
            // For team time trials, the default sort is by the calculated team time, ascending.
            setSortConfig({ key: 'adjustedTime', direction: 'asc' });
        } else {
            // Clear sort config for any other event type.
            setSortConfig(null);
        }
    }, [event.eventType]);

    useEffect(() => {
        try {
            const parsedNotes: EventNotes = event.notes ? JSON.parse(event.notes) : {};
            setEventNotes(parsedNotes);
        } catch {
            setEventNotes({});
        }
    }, [event.notes]);

    const handleSaveNotes = async () => {
        setIsSavingNotes(true);
        try {
            const notesString = JSON.stringify(eventNotes);
            await eventsApi.update(event.id, { ...event, notes: notesString });
            setIsEditingNotes(false);
        } catch (error) {
            console.error('Fehler beim Speichern der Notizen:', error);
            alert('Fehler beim Speichern der Notizen');
        } finally {
            setIsSavingNotes(false);
        }
    };

    const participantMap = useMemo(() => new Map(participants.map(p => [p.id, p])), [participants]);
    
    const getParticipantName = (id: string) => {
        const p = participantMap.get(id);
        return p ? `${p.lastName}, ${p.firstName}` : 'Unbekannt';
    }

    // Unified and robust search function.
    const participantMatchesSearch = (participantId: string, term: string): boolean => {
        const trimmedTerm = term.trim().toLowerCase();
        if (!trimmedTerm) return true; // Always match if search term is empty
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
            const nameMatch = participantMatchesSearch(result.participantId, debouncedSearchTerm);
            const statusMatch = filterStatus === 'all' || (filterStatus === 'finished' && !result.dnf) || (filterStatus === 'dnf' && result.dnf);
            return nameMatch && statusMatch;
        });
    }, [results, debouncedSearchTerm, filterStatus, participantMap]);


    const renderTimeTrialResults = () => {
        // Step 1: Calculate ranks based on adjusted time. This is the official ranking.
        // BZF uses absolute time only, EZF uses handicap-adjusted time.
        const isBZF = event.eventType === EventType.BZF;
        const rankedFinishers = filteredResults
            .filter(r => !r.dnf && participantMap.has(r.participantId))
            .map(r => {
                const participant = participantMap.get(r.participantId)!;
                const handicap = isBZF ? 0 : calculateHandicap(participant, r, event, settings);
                const adjustedTime = (r.timeSeconds || 0) + handicap;
                return { ...r, participant, adjustedTime };
            })
            .sort((a, b) => a.adjustedTime - b.adjustedTime)
            .map((result, index) => ({...result, rank: index + 1}));

        // Step 2: Apply interactive sorting for display purposes. The official rank is preserved.
        let displayData: (typeof rankedFinishers[number] & { participantName?: string })[] = [...rankedFinishers];

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
                
                // 1st Tie-breaker: If primary sort values are equal, use the official rank.
                const rankDiff = (a.rank ?? Infinity) - (b.rank ?? Infinity);
                if (rankDiff !== 0) return rankDiff;

                // 2nd Tie-breaker: If ranks are also equal, sort by name alphabetically.
                return getParticipantName(a.participantId).localeCompare(getParticipantName(b.participantId));
            });
        }
        
        // Step 3: Handle participants who did not finish (DNF).
        const dnfs = filteredResults.filter(r => r.dnf);

        if (displayData.length === 0 && dnfs.length === 0) {
            return <div className="p-4 text-center text-gray-500">Keine Ergebnisse für die aktuellen Filter gefunden.</div>;
        }

        return (
             <table className="w-full min-w-[700px] text-left">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-3 font-semibold text-sm text-gray-600 tracking-wider w-16">
                            <button className="font-semibold" onClick={() => requestSort('rank')}>Rang{getSortArrow('rank')}</button>
                        </th>
                        <th className="p-3 font-semibold text-sm text-gray-600 tracking-wider">
                             <button className="font-semibold" onClick={() => requestSort('name')}>Name{getSortArrow('name')}</button>
                        </th>
                        <th className="p-3 font-semibold text-sm text-gray-600 tracking-wider text-center">
                            <button className="font-semibold" onClick={() => requestSort('timeSeconds')}>Fahrzeit{getSortArrow('timeSeconds')}</button>
                        </th>
                        {!isBZF && (
                            <th className="p-3 font-semibold text-sm text-gray-600 tracking-wider text-center">
                                <button className="font-semibold" onClick={() => requestSort('adjustedTime')}>Wertungszeit{getSortArrow('adjustedTime')}</button>
                            </th>
                        )}
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
                                        <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800" title={`Bonus points for placing ${result.winnerRank}`}>
                                            +{settings.winnerPoints[result.winnerRank - 1]} Bonus Pts
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="p-3 font-mono text-center">{formatSecondsToMMSS(result.timeSeconds)}</td>
                            {!isBZF && <td className="p-3 font-mono text-center font-semibold text-primary-dark">{formatSecondsToMMSS(result.adjustedTime)}</td>}
                            <td className="p-3 font-mono text-right font-bold">{result.points}</td>
                        </tr>
                    ))}
                    {dnfs.map(result => {
                         return (
                             <tr key={result.id} className="hover:bg-red-50 opacity-70">
                                <td className="p-3 font-bold text-red-600">DNF</td>
                                <td className="p-3">
                                    {getParticipantName(result.participantId)}
                                </td>
                                <td className="p-3 font-mono text-center">-</td>
                                {!isBZF && <td className="p-3 font-mono text-center">-</td>}
                                <td className="p-3 font-mono text-right font-bold">{result.points}</td>
                            </tr>
                         );
                    })}
                </tbody>
            </table>
        );
    };

    const renderMZFResults = () => {
        const allTeamsRanked = useMemo(() => {
            const allTeamsWithData = teams.map(team => {
                // Step 1: Identify all members of the current team.
                const allMembersOfTeam = teamMembers.filter(tm => tm.teamId === team.id);
    
                // Step 2: Determine the team's base time using the (n-1) rule on valid finishers.
                // A valid finisher is not DNF and has a recorded time > 0.
                const validFinisherResults = allMembersOfTeam
                    .map(member => results.find(r => r.participantId === member.participantId))
                    .filter((r): r is Result => r !== undefined && !r.dnf && r.timeSeconds != null && r.timeSeconds > 0);
                
                // Edge Case: Teams with fewer than two valid finishers cannot have a valid time.
                // Their time is set to Infinity to rank them last.
                if (validFinisherResults.length < 2) {
                    return { ...team, adjustedTime: Infinity, totalTeamHandicap: 0, rank: Infinity };
                }
                
                // The base time is the time of the second-to-last finisher (n-1 rule).
                const sortedFinisherTimes = validFinisherResults.map(r => r.timeSeconds!).sort((a, b) => a - b);
                const baseTime = sortedFinisherTimes[Math.max(0, validFinisherResults.length - 2)];
    
                // Step 3: Calculate the total team handicap.
                // This sum includes the handicaps of ALL team members, including those who are DNF.
                const totalTeamHandicap = allMembersOfTeam.reduce((sum, member) => {
                    const participant = participantMap.get(member.participantId);
                    // This will find the result for DNF riders too.
                    const result = results.find(r => r.participantId === member.participantId); 
                    if (participant && result) {
                        // calculateHandicap returns positive values for penalties and negative for bonuses.
                        return sum + calculateHandicap(participant, result, event, settings);
                    }
                    return sum;
                }, 0);
    
                // Step 4: Calculate the final adjusted time.
                // A bonus (negative handicap) reduces the time, a penalty (positive) increases it.
                const adjustedTime = baseTime + totalTeamHandicap;
                
                return { ...team, adjustedTime, totalTeamHandicap, rank: 0 };
            });

            // Sort teams first by adjusted time, then by name for a stable order.
            const sortedTeams = [...allTeamsWithData].sort((a, b) => {
                const timeDiff = a.adjustedTime - b.adjustedTime;
                if (timeDiff !== 0) return timeDiff;
                return a.name.localeCompare(b.name); // Stable sort criterion for ties
            });
            
            // Assign ranks using "Standard Competition Ranking" (e.g., 1, 2, 2, 4).
            // Teams with the same time receive the same rank.
            const rankedTeamsWithTies = [];
            let rank = 1;
            for (let i = 0; i < sortedTeams.length; i++) {
                const team = sortedTeams[i];
                
                if (!isFinite(team.adjustedTime)) {
                    rankedTeamsWithTies.push({ ...team, rank: Infinity });
                    continue;
                }
                
                // The rank only increases when the current team's time is greater than the previous team's time.
                // This assigns the same rank to all teams in a tie.
                if (i > 0 && sortedTeams[i].adjustedTime > sortedTeams[i - 1].adjustedTime) {
                    // The new rank is the current position in the sorted list (1-based index).
                    rank = i + 1;
                }
                
                rankedTeamsWithTies.push({ ...team, rank: rank });
            }
            return rankedTeamsWithTies;

        }, [teams, teamMembers, results, participantMap, event, settings]);
    
        const displayedTeams = useMemo(() => {
            const filtered = allTeamsRanked.filter(team => {
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
    
            if (sortConfig) {
                return [...filtered].sort((a, b) => {
                    const dir = sortConfig.direction === 'asc' ? 1 : -1;
                    let compareVal = 0;
                    if (sortConfig.key === 'adjustedTime') {
                        compareVal = (a.adjustedTime - b.adjustedTime) * dir;
                    } else if (sortConfig.key === 'name') {
                        compareVal = a.name.localeCompare(b.name) * dir;
                    }

                    if (compareVal !== 0) return compareVal;
                    // Secondary sort criterion
                    const rankDiff = (a.rank ?? Infinity) - (b.rank ?? Infinity);
                    if (rankDiff !== 0) return rankDiff;
                    // Tertiary sort criterion
                    return a.name.localeCompare(b.name);
                });
            }
            return filtered;
        }, [allTeamsRanked, teamMembers, results, searchTerm, filterStatus, sortConfig, participantMap]);
    
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
                                     <button className="font-bold text-left" onClick={() => requestSort('name')}>{team.rank}. {team.name}{getSortArrow('name')}</button>
                                </h4>
                                <div className="flex items-center space-x-6 flex-shrink-0">
                                    <div className="text-right">
                                        <div className="text-sm text-gray-500">
                                            <button className="font-semibold" onClick={() => requestSort('adjustedTime')}>
                                                Wertungszeit{getSortArrow('adjustedTime')}
                                            </button>
                                        </div>
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

                    let rankedResults = [...finishers]
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

                    if (sortConfig) {
                        rankedResults.sort((a, b) => {
                            let aVal, bVal;
                            if (sortConfig.key === 'name') {
                                aVal = getParticipantName(a.participantId);
                                bVal = getParticipantName(b.participantId);
                            } else {
                                aVal = a[sortConfig.key as keyof typeof a] ?? (sortConfig.direction === 'asc' ? Infinity : -Infinity);
                                bVal = b[sortConfig.key as keyof typeof b] ?? (sortConfig.direction === 'asc' ? Infinity : -Infinity);
                            }
                            
                            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                            
                            // 1st Tie-breaker: If primary sort values are equal, use the official rank.
                            const rankDiff = (a.rank ?? Infinity) - (b.rank ?? Infinity);
                            if (rankDiff !== 0) return rankDiff;

                            // 2nd Tie-breaker: If ranks are also equal, sort by name alphabetically.
                            return getParticipantName(a.participantId).localeCompare(getParticipantName(b.participantId));
                        });
                    }

                    return (
                        <div key={title} className="mb-8">
                            <h3 className="text-xl font-bold text-secondary mb-4">{title}</h3>
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="w-full min-w-[700px] text-left">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-3 font-semibold text-sm text-gray-600 tracking-wider w-16">
                                                <button className="font-semibold" onClick={() => requestSort('rank')}>Rang{getSortArrow('rank')}</button>
                                            </th>
                                            <th className="p-3 font-semibold text-sm text-gray-600 tracking-wider">
                                                <button className="font-semibold" onClick={() => requestSort('name')}>Name{getSortArrow('name')}</button>
                                            </th>
                                            <th className="p-3 font-semibold text-sm text-gray-600 tracking-wider w-32 text-center">
                                                <button className="font-semibold" onClick={() => requestSort('finisherGroup')}>Zielgruppe{getSortArrow('finisherGroup')}</button>
                                            </th>
                                            <th className="p-3 font-semibold text-sm text-gray-600 tracking-wider w-24 text-right">
                                                <button className="font-semibold" onClick={() => requestSort('points')}>Punkte{getSortArrow('points')}</button>
                                            </th>
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
                                                            <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800" title={`Bonus points for placing ${result.winnerRank}`}>
                                                                +{settings.winnerPoints[result.winnerRank - 1]} Bonus Pts
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center">{result.finisherGroup ?? 1}</td>
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
                                                <td className="p-3 text-center">-</td>
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
    }

    const renderResults = () => {
        switch (event.eventType) {
            case EventType.EZF:
            case EventType.BZF:
                return renderTimeTrialResults();
            case EventType.MZF:
                return renderMZFResults();
            case EventType.Handicap:
                return renderHandicapResults();
            default:
                return <div>Ergebnisanzeige für diesen Event-Typ nicht implementiert.</div>;
        }
    };
    
    const perfClassLabels: Record<string, string> = { A: 'Klasse A', B: 'Klasse B', C: 'Klasse C', D: 'Klasse D' };
    const genderLabels: Record<string, string> = { m: 'Männlich', w: 'Weiblich' };

    const registrationsByClass: Record<string, any[]> = useMemo(() => {
        const grouped: Record<string, any[]> = {};
        for (const reg of registeredParticipants) {
            const cls = reg.perfClass || '?';
            if (!grouped[cls]) grouped[cls] = [];
            grouped[cls].push(reg);
        }
        const sorted: Record<string, any[]> = {};
        for (const cls of ['A', 'B', 'C', 'D']) {
            if (grouped[cls]) sorted[cls] = grouped[cls];
        }
        for (const cls of Object.keys(grouped)) {
            if (!sorted[cls]) sorted[cls] = grouped[cls];
        }
        return sorted;
    }, [registeredParticipants]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <button onClick={onBack} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg flex items-center space-x-2">
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>Zurück zur Event-Liste</span>
                </button>
                {isAdmin && (
                    <button
                        onClick={() => setEmailModalOpen(true)}
                        className="gradient-red text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-transform transform hover:scale-105 shadow-lg"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>E-Mail an Teilnehmer</span>
                    </button>
                )}
            </div>

            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-3">
                    <CalendarIcon />
                    <h1 className="text-3xl font-bold text-secondary">{event.name}</h1>
                </div>
                {event.eventType === EventType.MZF && (
                    <button
                        onClick={() => onEditTeams(event.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-transform transform hover:scale-105"
                    >
                        <PencilIcon className="w-5 h-5" />
                        <span>Teams bearbeiten</span>
                    </button>
                )}
            </div>
             <div className="flex items-center space-x-6 text-gray-600 mb-6 border-b pb-4">
                <span><strong>Datum:</strong> {formatDate(event.date)}</span>
                <span><strong>Ort:</strong> {event.location}</span>
                <span><strong>Typ:</strong> {eventTypeLabels[event.eventType]}</span>
                <span>
                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ event.finished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800' }`}>
                      {event.finished ? 'Abgeschlossen' : 'Anstehend'}
                    </span>
                </span>
                {registrationCount > 0 && (
                    <span className="text-sm text-gray-500">{registrationCount} Anmeldung{registrationCount !== 1 ? 'en' : ''}</span>
                )}
                {isLoggedIn && !event.finished && (
                    <button
                        onClick={isRegistered ? handleUnregister : handleRegister}
                        disabled={isRegistering}
                        className={`px-4 py-1 text-sm font-semibold rounded-full transition-colors ${
                            isRegistered
                                ? 'bg-green-100 text-green-800 hover:bg-red-100 hover:text-red-800'
                                : 'bg-primary text-white hover:bg-primary-dark'
                        } disabled:opacity-50`}
                    >
                        {isRegistering ? '...' : isRegistered ? 'Angemeldet ✓' : 'Anmelden'}
                    </button>
                )}
            </div>
            
            {event.report && (
                <div className="mb-6 p-6 bg-blue-50 border-2 border-blue-200 rounded-xl shadow-sm">
                    <h4 className="text-lg font-bold text-gray-800 mb-3">Bericht / Zusammenfassung</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{event.report}</p>
                </div>
            )}

             {(Object.values(eventNotes).some(note => note) || isAdmin) && (
                <div className="mb-6 p-6 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-bold text-gray-800">Event-Notizen</h4>
                        {isAdmin && !isEditingNotes && (
                            <button
                                onClick={() => setIsEditingNotes(true)}
                                className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg transition"
                            >
                                Bearbeiten
                            </button>
                        )}
                        {isAdmin && isEditingNotes && (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveNotes}
                                    disabled={isSavingNotes}
                                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
                                >
                                    {isSavingNotes ? 'Speichert...' : 'Speichern'}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditingNotes(false);
                                        try {
                                            const parsedNotes: EventNotes = event.notes ? JSON.parse(event.notes) : {};
                                            setEventNotes(parsedNotes);
                                        } catch {
                                            setEventNotes({});
                                        }
                                    }}
                                    disabled={isSavingNotes}
                                    className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
                                >
                                    Abbrechen
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="space-y-4">
                        {[
                            { key: GroupLabel.Hobby, label: 'Männer Hobby (A/B)' },
                            { key: GroupLabel.Ambitious, label: 'Männer Ambitioniert (C/D)' },
                            { key: GroupLabel.Women, label: 'Frauen' }
                        ].map(({ key, label }) => (
                            eventNotes[key] || isEditingNotes ? (
                                <div key={key} className="border-b pb-3 last:border-b-0">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                                    {isEditingNotes ? (
                                        <textarea
                                            value={eventNotes[key] || ''}
                                            onChange={(e) => setEventNotes({ ...eventNotes, [key]: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                            rows={3}
                                            placeholder={`Notizen für ${label}...`}
                                        />
                                    ) : (
                                        <p className="text-gray-600 whitespace-pre-wrap">
                                            {eventNotes[key]}
                                        </p>
                                    )}
                                </div>
                            ) : null
                        ))}
                    </div>
                </div>
            )}
            
            {/* Tabs */}
            <div className="flex border-b mb-6">
                <button
                    onClick={() => setActiveTab('registrations')}
                    className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
                        activeTab === 'registrations'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Anmeldungen ({registrationCount})
                </button>
                {(event.finished || isAdmin) && (
                    <button
                        onClick={() => setActiveTab('results')}
                        className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
                            activeTab === 'results'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Ergebnisse ({event.finished ? results.length : '–'})
                    </button>
                )}
            </div>

            {activeTab === 'results' && !event.finished && isAdmin && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-sm text-yellow-800">
                    Hinweis: Dieses Event ist noch nicht abgeschlossen. Die Ergebnisse sind nur für dich als Admin sichtbar.
                </div>
            )}

            {activeTab === 'registrations' && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {registeredParticipants.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            Noch keine Anmeldungen für dieses Event.
                        </div>
                    ) : (
                        <div className="p-4 space-y-6">
                            {Object.entries(registrationsByClass).map(([cls, regs]) => (
                                <div key={cls}>
                                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                                            {perfClassLabels[cls] || cls}
                                        </span>
                                        <span className="text-sm font-normal text-gray-500">{regs.length} Teilnehmer</span>
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left table-fixed">
                                            <colgroup>
                                                <col style={{ width: '48px' }} />
                                                <col />
                                                <col style={{ width: '140px' }} />
                                                <col style={{ width: '180px' }} />
                                            </colgroup>
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="p-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                                                    <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                                                    <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Geschlecht</th>
                                                    <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Angemeldet am</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {regs.map((reg: any, idx: number) => (
                                                    <tr key={reg.participantId} className="hover:bg-gray-50">
                                                        <td className="p-3 text-gray-400 text-sm">{idx + 1}</td>
                                                        <td className="p-3 font-medium text-gray-800">{reg.lastName}, {reg.firstName}</td>
                                                        <td className="p-3 text-gray-600">{genderLabels[reg.gender] || reg.gender}</td>
                                                        <td className="p-3 text-gray-500 text-sm">
                                                            {reg.registeredAt ? new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(reg.registeredAt)) : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'results' && (
                <>
                    {/* Search & Filter - inline to avoid re-mount */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border flex flex-wrap items-center justify-between gap-4">
                        <div className="flex-grow min-w-[250px]">
                            <input
                                type="text"
                                placeholder="Teilnehmer suchen..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">Status:</span>
                            <div className="flex rounded-md shadow-sm">
                                <button onClick={() => setFilterStatus('all')} className={`px-4 py-2 text-sm font-medium border rounded-l-md ${filterStatus === 'all' ? 'bg-primary text-white border-primary-dark' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>Alle</button>
                                <button onClick={() => setFilterStatus('finished')} className={`px-4 py-2 text-sm font-medium border-t border-b ${filterStatus === 'finished' ? 'bg-primary text-white border-primary-dark' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>Finisher</button>
                                <button onClick={() => setFilterStatus('dnf')} className={`px-4 py-2 text-sm font-medium border rounded-r-md ${filterStatus === 'dnf' ? 'bg-primary text-white border-primary-dark' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>DNF</button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="overflow-x-auto p-4">
                            {renderResults()}
                        </div>
                    </div>
                </>
            )}
            
            {isEmailModalOpen && (
                <EmailEventModal
                    event={event}
                    onClose={() => setEmailModalOpen(false)}
                    onSend={async (message) => {
                        const response = await fetch(`/api/events/${event.id}/send-email`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ message })
                        });
                        
                        if (!response.ok) {
                            const error = await response.json();
                            throw new Error(error.error || 'Fehler beim Versenden');
                        }
                    }}
                />
            )}
        </div>
    );
};