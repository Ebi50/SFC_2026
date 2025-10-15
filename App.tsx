import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Participant, Event, Result, Team, TeamMember, Settings, View, EventType, PerfClass, Gender } from './types';
import { getInitialSettings } from './services/mockDataService';
import { calculatePointsForEvent } from './services/scoringService';
import { participantsApi, eventsApi, settingsApi, seasonsApi } from './services/api';
import { useAuth } from './components/AuthContext';
import { AdminLogin, AdminStatus } from './components/AdminLogin';
import { Standings } from './components/Standings';
import { ParticipantsList } from './components/ParticipantsList';
import { ParticipantImportModal } from './components/ParticipantImportModal';
import { ParticipantFormModal } from './components/ParticipantFormModal';
import { EventsList } from './components/EventsList';
import { EventFormModal, TeamEditModal } from './components/EventFormModal';
import { NewSeasonModal } from './components/NewSeasonModal';
import { UsersIcon, CalendarIcon, ChartBarIcon, CogIcon } from './components/icons';
import { SettingsView } from './components/SettingsView';
import { EventDetailView } from './components/EventDetailView';
import { InstallPWA } from './components/InstallPWA';
import { ReglementView } from './components/ReglementView';
import { StreckenView } from './components/StreckenView';

const Sidebar: React.FC<{ 
  activeView: View; 
  setView: (view: View) => void; 
  isAdmin: boolean;
  isMobileOpen: boolean;
  onClose: () => void;
}> = ({ activeView, setView, isAdmin, isMobileOpen, onClose }) => {
  const [isAdminExpanded, setIsAdminExpanded] = React.useState(false);
  
  const allNavItems = [
    { view: 'reglement', label: 'Reglement', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, requiresAdmin: false },
    { view: 'participants', label: 'Teilnehmer', icon: <UsersIcon />, requiresAdmin: true },
    { view: 'events', label: 'Events', icon: <CalendarIcon />, requiresAdmin: false },
    { view: 'strecken', label: 'Strecken', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>, requiresAdmin: false },
    { view: 'standings', label: 'Gesamtwertung', icon: <ChartBarIcon />, requiresAdmin: false },
    { view: 'settings', label: 'Einstellungen', icon: <CogIcon />, requiresAdmin: true },
  ] as const;

  const navItems = allNavItems.filter(item => !item.requiresAdmin || isAdmin);
  const isDetailView = activeView === 'eventDetail';

  const handleNavClick = (view: View) => {
    setView(view);
    onClose();
  };

  return (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <div className={`
        w-64 gradient-dark text-white p-5 flex flex-col h-screen fixed shadow-2xl z-50 overflow-y-auto
        transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
      <div className="mb-8 flex-shrink-0">
        <div className="flex items-center justify-center mb-4">
          <div className="relative w-28 h-28 rounded-full border border-primary bg-white p-1">
            <img 
              src="/logo.jpg" 
              alt="Skinfit Cup Logo" 
              className="w-full h-full object-contain rounded-full"
            />
          </div>
        </div>
        <h1 className="text-3xl font-display font-bold text-white text-center tracking-wide">
          SKINFIT<span className="text-primary">CUP</span>
        </h1>
      </div>
      
      <div className="lg:hidden flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-xl font-bold">Menü</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <nav className="flex-1 flex-shrink-0">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.view}>
              <button
                onClick={() => handleNavClick(item.view)}
                className={`w-full text-left flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 ${
                  activeView === item.view || (isDetailView && item.view === 'events')
                    ? 'gradient-red text-white font-semibold shadow-hover transform scale-105'
                    : 'hover:bg-white/10 hover:translate-x-1'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="mt-4 pt-4 border-t border-white/20 flex-shrink-0">
        <button
          onClick={() => setIsAdminExpanded(!isAdminExpanded)}
          className="w-full px-3 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center"
        >
          {isAdmin ? '🔓 Admin' : '🔒 Admin-Login'}
        </button>
        
        {isAdminExpanded && (
          <div className="mt-3 bg-white/10 rounded-lg p-3">
            {isAdmin ? <AdminStatus /> : <AdminLogin />}
          </div>
        )}
      </div>
    </div>
    </>
  );
};

const App: React.FC = () => {
  const { isAdmin } = useAuth();
  const [view, setView] = useState<View>('events');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [settings, setSettings] = useState<Settings>(getInitialSettings());
  
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);
  const [isNewSeasonModalOpen, setNewSeasonModalOpen] = useState(false);
  
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isEventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);

  const [isParticipantModalOpen, setParticipantModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | undefined>(undefined);
  
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [isTeamEditModalOpen, setTeamEditModalOpen] = useState(false);
  const [editingEventForTeams, setEditingEventForTeams] = useState<Event | null>(null);

  const [loading, setLoading] = useState(true);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [participantsData, eventsData, seasonsData] = await Promise.all([
        participantsApi.getAll(),
        eventsApi.getAll(),
        seasonsApi.getAll()
      ]);

      setParticipants(participantsData.participants);
      setEvents(eventsData.events);
      setResults(eventsData.results);
      setTeams(eventsData.teams);
      setTeamMembers(eventsData.teamMembers);

      const seasonsFromDb = seasonsData.seasons || [];
      const seasonsFromEvents = (eventsData.events || []).map(e => e.season);
      const uniqueSeasons = [...new Set([...seasonsFromDb, ...seasonsFromEvents])].sort((a, b) => Number(b) - Number(a));
      setAvailableSeasons(uniqueSeasons);
      
      if (uniqueSeasons.length > 0 && !selectedSeason) {
        setSelectedSeason(uniqueSeasons[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);  // Remove selectedSeason dependency to avoid infinite loop

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load season-specific settings when selectedSeason changes
  useEffect(() => {
    const loadSeasonSettings = async () => {
      if (selectedSeason) {
        try {
          const seasonSettings = await settingsApi.getForSeason(selectedSeason);
          setSettings(seasonSettings);
        } catch (err) {
          console.error('Error loading season settings:', err);
          // Fallback to global settings
          try {
            const globalSettings = await settingsApi.get();
            setSettings(globalSettings);
          } catch (err2) {
            console.error('Error loading global settings:', err2);
            setSettings(getInitialSettings());
          }
        }
      }
    };
    
    loadSeasonSettings();
  }, [selectedSeason]);

  useEffect(() => {
    loadData();
  }, []);

  const handleSettingsChange = async (newSettings: Settings) => {
    try {
      if (selectedSeason) {
        await settingsApi.updateForSeason(selectedSeason, newSettings);
      } else {
        await settingsApi.update(newSettings);
      }
      setSettings(newSettings);
      await loadData();
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const eventsForSeason = useMemo(() => 
    (events || []).filter(e => e.season === selectedSeason),
    [events, selectedSeason]
  );

  const resultsForSeason = useMemo(() => {
    const eventIdsInSeason = new Set(eventsForSeason.map(e => e.id));
    return (results || []).filter(r => eventIdsInSeason.has(r.eventId));
  }, [results, eventsForSeason]);

  const teamsForSeason = useMemo(() => {
    const eventIdsInSeason = new Set(eventsForSeason.map(e => e.id));
    return (teams || []).filter(t => eventIdsInSeason.has(t.eventId));
  }, [teams, eventsForSeason]);

  const teamMembersForSeason = useMemo(() => {
    const teamIdsInSeason = new Set(teamsForSeason.map(t => t.id));
    return (teamMembers || []).filter(tm => teamIdsInSeason.has(tm.teamId));
  }, [teamMembers, teamsForSeason]);

  // Calculate results with proper points for finished events
  const calculatedResults = useMemo(() => {
    const allCalculatedResults: Result[] = [];

    for (const event of eventsForSeason) {
      const eventResults = resultsForSeason.filter(r => r.eventId === event.id);
      
      if (event.finished && eventResults.length > 0) {
        // Recalculate points for finished events
        const calculatedEventResults = calculatePointsForEvent(
          event,
          eventResults,
          participants,
          teamsForSeason,
          teamMembersForSeason,
          settings
        );
        allCalculatedResults.push(...calculatedEventResults);
      } else {
        // Keep original results for unfinished events (with 0 points)
        allCalculatedResults.push(...eventResults.map(r => ({ ...r, points: 0 })));
      }
    }

    return allCalculatedResults;
  }, [eventsForSeason, resultsForSeason, participants, teamsForSeason, teamMembersForSeason, settings]);

  const handleImportParticipants = async (newParticipants: Participant[]) => {
    try {
      const createdParticipants = await participantsApi.import(newParticipants);
      setParticipants(prev => [...prev, ...createdParticipants]);
      setImportModalOpen(false);
    } catch (error) {
      console.error('Error importing participants:', error);
      alert('Fehler beim Importieren der Teilnehmer');
    }
  };

  const handleOpenEventModal = (event?: Event) => {
    setEditingEvent(event);
    setEventModalOpen(true);
  };

  const handleCloseEventModal = () => {
    setEditingEvent(undefined);
    setEventModalOpen(false);
  };

  const handleSaveEvent = async (event: Event, eventResults: Result[], eventTeams: Team[], eventTeamMembers: TeamMember[]) => {
    try {
      // Validate that we have a season selected for new events
      if (!editingEvent && !selectedSeason) {
        alert('Bitte wählen Sie zuerst eine Saison aus oder erstellen Sie eine neue Saison.');
        return;
      }
      
      let savedEventId = event.id;
      
      // Ensure event has season - use selectedSeason for new events, keep existing season for edits
      const eventWithSeason = {
        ...event,
        season: editingEvent ? editingEvent.season : selectedSeason!
      };
      
      if (editingEvent) {
        await eventsApi.update(eventWithSeason.id, eventWithSeason);
        setEvents(prev => prev.map(e => e.id === eventWithSeason.id ? eventWithSeason : e));
      } else {
        const created = await eventsApi.create(eventWithSeason);
        savedEventId = created.id;
        setEvents(prev => [...prev, created]);
      }

      const savedResults = await eventsApi.saveResults(savedEventId, eventResults);
      setResults(prev => {
        const filtered = prev.filter(r => r.eventId !== savedEventId);
        return [...filtered, ...savedResults];
      });

      const savedTeamsData = await eventsApi.saveTeams(savedEventId, eventTeams, eventTeamMembers);
      setTeams(prev => {
        const filtered = prev.filter(t => t.eventId !== savedEventId);
        return [...filtered, ...savedTeamsData.teams];
      });
      setTeamMembers(prev => {
        const teamIdsToRemove = new Set(teams.filter(t => t.eventId === savedEventId).map(t => t.id));
        const filtered = prev.filter(tm => !teamIdsToRemove.has(tm.teamId));
        return [...filtered, ...savedTeamsData.teamMembers];
      });

      setEditingEvent(undefined);
      setEventModalOpen(false);
    } catch (error: any) {
      console.error('Error saving event:', error);
      const errorMessage = error?.message || error?.toString() || 'Unbekannter Fehler';
      alert(`Fehler beim Speichern des Events:\n${errorMessage}`);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('Möchten Sie dieses Event wirklich löschen?')) {
      try {
        await eventsApi.delete(eventId);
        setEvents(prev => prev.filter(e => e.id !== eventId));
        setResults(prev => prev.filter(r => r.eventId !== eventId));
        setTeams(prev => prev.filter(t => t.eventId !== eventId));
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Fehler beim Löschen des Events');
      }
    }
  };

  const handleOpenNewParticipantModal = () => {
    const newParticipant: Participant = {
      id: '',
      firstName: '',
      lastName: '',
      birthYear: new Date().getFullYear() - 30,
      perfClass: 'C' as PerfClass,
      gender: 'M' as Gender,
      email: '',
      phone: '',
      isRsvMember: false,
    };
    setEditingParticipant(newParticipant);
    setParticipantModalOpen(true);
  };

  const handleOpenEditParticipantModal = (participant: Participant) => {
    setEditingParticipant(participant);
    setParticipantModalOpen(true);
  };

  const handleCloseParticipantModal = () => {
    setEditingParticipant(undefined);
    setParticipantModalOpen(false);
  };

  const handleSaveParticipant = async (participant: Participant) => {
    try {
      if (participant.id) {
        await participantsApi.update(participant.id, participant);
        setParticipants(prev => prev.map(p => p.id === participant.id ? participant : p));
      } else {
        // Remove id from object when creating new participant
        const { id, ...participantData } = participant;
        const created = await participantsApi.create(participantData as Omit<Participant, 'id'>);
        setParticipants(prev => [...prev, created]);
      }
      handleCloseParticipantModal();
    } catch (error) {
      console.error('Error saving participant:', error);
      alert('Fehler beim Speichern des Teilnehmers');
    }
  };

  const handleDeleteParticipant = async (participantId: string) => {
    if (confirm('Möchten Sie diesen Teilnehmer wirklich löschen?')) {
      try {
        await participantsApi.delete(participantId);
        setParticipants(prev => prev.filter(p => p.id !== participantId));
        // Also remove from results and teams if they exist
        setResults(prev => prev.filter(r => r.participantId !== participantId));
        setTeamMembers(prev => prev.filter(tm => tm.participantId !== participantId));
      } catch (error: any) {
        console.error('Error deleting participant:', error);
        const errorMessage = error?.message || error?.toString() || 'Unbekannter Fehler';
        alert(`Fehler beim Löschen des Teilnehmers:\n${errorMessage}`);
      }
    }
  };

  const handleViewEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setView('eventDetail');
  };

  const handleBackToEventsList = () => {
    setSelectedEventId(null);
    setView('events');
  };

  const handleOpenTeamEditModal = (event: Event) => {
    setEditingEventForTeams(event);
    setTeamEditModalOpen(true);
  };

  const handleCloseTeamEditModal = () => {
    setEditingEventForTeams(null);
    setTeamEditModalOpen(false);
  };

  const handleSaveTeamsAndMembers = async (eventId: string, newTeams: Team[], newTeamMembers: TeamMember[]) => {
    try {
      const savedData = await eventsApi.saveTeams(eventId, newTeams, newTeamMembers);
      
      setTeams(prev => {
        const filtered = prev.filter(t => t.eventId !== eventId);
        return [...filtered, ...savedData.teams];
      });
      
      setTeamMembers(prev => {
        const teamIdsToRemove = new Set(teams.filter(t => t.eventId === eventId).map(t => t.id));
        const filtered = prev.filter(tm => !teamIdsToRemove.has(tm.teamId));
        return [...filtered, ...savedData.teamMembers];
      });

      handleCloseTeamEditModal();
    } catch (error) {
      console.error('Error saving teams:', error);
      alert('Fehler beim Speichern der Teams');
    }
  };

  const handleCreateSeason = async (season: number) => {
    try {
      await seasonsApi.create(season);
      setAvailableSeasons(prev => [...prev, season].sort((a, b) => b - a));
      setSelectedSeason(season);
      setNewSeasonModalOpen(false);
    } catch (error) {
      console.error('Error creating season:', error);
      alert('Fehler beim Erstellen der Saison');
    }
  };

  const isNewParticipant = !editingParticipant?.id;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Daten...</p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (view) {
      case 'reglement':
        return <ReglementView selectedSeason={selectedSeason} />;
      case 'strecken':
        return <StreckenView />;
      case 'participants':
        return <ParticipantsList 
          participants={participants} 
          onEditParticipant={handleOpenEditParticipantModal} 
          onDeleteParticipant={handleDeleteParticipant} 
          onOpenImportModal={() => setImportModalOpen(true)} 
          onNewParticipant={handleOpenNewParticipantModal} 
        />;
      case 'events':
        return <EventsList 
          events={eventsForSeason} 
          onNewEvent={() => handleOpenEventModal()} 
          onEditEvent={handleOpenEventModal} 
          onDeleteEvent={handleDeleteEvent} 
          onViewDetails={handleViewEvent} 
        />;
      case 'standings':
        return <Standings 
          participants={participants} 
          events={eventsForSeason} 
          results={calculatedResults} 
          settings={settings}
          teams={teamsForSeason}
          teamMembers={teamMembersForSeason}
        />;
      case 'settings':
        return <SettingsView 
          settings={settings} 
          onSettingsChange={handleSettingsChange}
          selectedSeason={selectedSeason}
          participants={participants}
          events={eventsForSeason}
        />;
      case 'eventDetail': {
        const selectedEvent = events.find(e => e.id === selectedEventId);
        if (!selectedEvent) {
          return <div>Event nicht gefunden. <button onClick={handleBackToEventsList} className="text-primary underline">Zurück zur Übersicht</button></div>;
        }
        
        const eventResults = calculatedResults.filter(r => r.eventId === selectedEventId);
        const eventTeams = teams.filter(t => t.eventId === selectedEventId);
        const eventTeamIds = new Set(eventTeams.map(t => t.id));
        const eventTeamMembers = teamMembers.filter(tm => eventTeamIds.has(tm.teamId));

        return <EventDetailView 
          event={selectedEvent}
          participants={participants}
          results={eventResults}
          teams={eventTeams}
          teamMembers={eventTeamMembers}
          settings={settings}
          onBack={handleBackToEventsList}
          onEditTeams={handleOpenTeamEditModal}
        />;
      }
      default:
        return <div>Wählen Sie eine Ansicht</div>;
    }
  };

  return (
    <div className="flex bg-light min-h-screen font-sans">
      <div className="no-print">
        <Sidebar 
          activeView={view} 
          setView={setView} 
          isAdmin={isAdmin}
          isMobileOpen={isMobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
      </div>
      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="flex justify-between items-center mb-4 no-print">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden gradient-red text-white p-2 rounded-lg shadow-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1 lg:flex-none"></div>
          <div className="flex items-center space-x-2 lg:space-x-4">
            <label htmlFor="season-select" className="font-bold text-gray-700 text-sm lg:text-xl">Saison:</label>
            <div className="relative inline-block">
              <select 
                id="season-select"
                value={selectedSeason || ''} 
                onChange={e => setSelectedSeason(Number(e.target.value))}
                className="block appearance-none bg-gradient-to-r from-gray-100 to-white w-40 lg:w-56 px-4 py-3 text-xl font-black text-gray-900 border-4 border-gray-300 rounded-xl shadow-xl hover:border-primary focus:border-primary focus:outline-none"
                style={{
                  textAlign: 'center',
                  fontSize: '24px',
                  letterSpacing: '0.05em'
                }}
              >
                {availableSeasons.map(s => (
                  <option 
                    key={s} 
                    value={s} 
                    style={{
                      fontSize: '24px',
                      fontWeight: 900,
                      padding: '12px',
                      backgroundColor: 'white',
                      color: '#1a202c'
                    }}
                  >
                    {s}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4">
                <svg className="h-6 w-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <button 
              onClick={() => setNewSeasonModalOpen(true)}
              className="bg-secondary hover:bg-gray-700 text-white font-bold py-2 px-2 lg:px-4 rounded-lg flex items-center space-x-1 lg:space-x-2 transition-transform transform hover:scale-105 text-sm lg:text-base"
            >
              <span className="hidden lg:inline">Neue Saison</span>
              <span className="lg:hidden">+</span>
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 lg:p-8 min-h-full">
          {renderView()}
        </div>
      </main>
      {isImportModalOpen && (
        <ParticipantImportModal
          onClose={() => setImportModalOpen(false)}
          onImport={handleImportParticipants}
          existingParticipants={participants}
          settings={settings}
        />
      )}
      {isEventModalOpen && selectedSeason && (
        <EventFormModal
          onClose={handleCloseEventModal}
          onSave={handleSaveEvent}
          event={editingEvent}
          allParticipants={participants}
          eventResults={editingEvent ? results.filter(r => r.eventId === editingEvent.id) : []}
          eventTeams={editingEvent ? teams.filter(t => t.eventId === editingEvent.id) : []}
          eventTeamMembers={editingEvent ? teamMembers.filter(tm => teams.some(t => t.id === tm.teamId && t.eventId === editingEvent.id)) : []}
          settings={settings}
          selectedSeason={selectedSeason}
        />
      )}
      {isNewSeasonModalOpen && (
        <NewSeasonModal
          onClose={() => setNewSeasonModalOpen(false)}
          onSave={handleCreateSeason}
          existingSeasons={availableSeasons}
        />
      )}
      {isParticipantModalOpen && editingParticipant && (
        <ParticipantFormModal
          onClose={handleCloseParticipantModal}
          onSave={handleSaveParticipant}
          participant={editingParticipant}
          isNew={isNewParticipant}
        />
      )}
      {isTeamEditModalOpen && editingEventForTeams && (
        <TeamEditModal
          event={editingEventForTeams}
          initialTeams={teams.filter(t => t.eventId === editingEventForTeams.id)}
          initialTeamMembers={teamMembers.filter(tm => teams.some(t => t.id === tm.teamId && t.eventId === editingEventForTeams.id))}
          allParticipants={participants}
          onClose={handleCloseTeamEditModal}
          onSave={handleSaveTeamsAndMembers}
        />
      )}
      <InstallPWA />
    </div>
  );
};

export default App;
