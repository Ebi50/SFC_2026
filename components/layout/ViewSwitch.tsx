import React from 'react';
import type { View } from '../../types';
import type { SeasonData } from '../../hooks/useSeasonData';
import type { ParticipantEditor } from '../../hooks/useParticipantEditor';
import type { EventEditor } from '../../hooks/useEventEditor';
import { eventTeamData } from '../../services/seasonData';
import { Standings } from '../Standings';
import { ParticipantsList } from '../ParticipantsList';
import { EventsList } from '../EventsList';
import { SettingsView } from '../SettingsView';
import { EventDetailView } from '../EventDetailView';
import { ReglementView } from '../ReglementView';
import { StreckenView } from '../StreckenView';
import { HomeView } from '../HomeView';
import { ImpressumView } from '../ImpressumView';
import { UserLogin } from '../UserLogin';
import { UserRegister } from '../UserRegister';
import { UserProfile } from '../UserProfile';
import { ForgotPassword } from '../ForgotPassword';
import { ResetPassword } from '../ResetPassword';
import { TeilnahmeerklaerungView } from '../TeilnahmeerklaerungView';
import { ImpressionenView } from '../ImpressionenView';
import { TechnikView } from '../TechnikView';
import { GdprStatusView } from '../GdprStatusView';
import { TrainingView } from '../training/TrainingView';
import { TrainingPlanView } from '../training/TrainingPlanView';

interface Props {
  view: View;
  setView: (v: View) => void;
  data: SeasonData;
  participantEditor: ParticipantEditor;
  eventEditor: EventEditor;
  resetToken: string;
  afterLoginView?: View;
  selectedEventId: string | null;
  onViewEvent: (eventId: string) => void;
  onBackToEvents: () => void;
  onOpenBulkEmail: () => void;
}

/** Wählt anhand der aktiven Ansicht die passende Seite */
export const ViewSwitch: React.FC<Props> = ({
  view, setView, data, participantEditor: pe, eventEditor: ee, resetToken, afterLoginView,
  selectedEventId, onViewEvent, onBackToEvents, onOpenBulkEmail,
}) => {
  const { participants, events, teams, teamMembers, settings, selectedSeason, season, calculatedResults } = data;

  switch (view) {
    case 'home': return <HomeView />;
    case 'reglement': return <ReglementView selectedSeason={selectedSeason} />;
    case 'strecken': return <StreckenView />;
    case 'participants':
      return (
        <ParticipantsList
          participants={participants}
          onEditParticipant={pe.openEdit}
          onDeleteParticipant={pe.remove}
          onOpenImportModal={pe.openImport}
          onNewParticipant={pe.openNew}
        />
      );
    case 'events':
      return (
        <EventsList
          events={season.events}
          onNewEvent={() => ee.openEvent()}
          onEditEvent={ee.openEvent}
          onDeleteEvent={ee.deleteEvent}
          onViewDetails={onViewEvent}
        />
      );
    case 'standings':
      return (
        <Standings
          participants={participants}
          events={season.events}
          results={calculatedResults}
          settings={settings}
          teams={season.teams}
          teamMembers={season.teamMembers}
        />
      );
    case 'settings':
      return (
        <SettingsView
          settings={settings}
          onSettingsChange={data.handleSettingsChange}
          selectedSeason={selectedSeason}
          participants={participants}
          events={season.events}
        />
      );
    case 'impressionen': return <ImpressionenView />;
    case 'technik': return <TechnikView />;
    case 'gdpr': return <GdprStatusView onOpenBulkEmail={onOpenBulkEmail} />;
    case 'training': return <TrainingView onNavigate={setView} />;
    case 'trainingPlan': return <TrainingPlanView />;
    case 'impressum': return <ImpressumView />;
    case 'teilnahmeerklaerung': return <TeilnahmeerklaerungView />;
    case 'userLogin': return <UserLogin onNavigate={setView} afterLogin={afterLoginView} />;
    case 'userRegister': return <UserRegister onNavigate={setView} />;
    case 'userProfile': return <UserProfile onBack={() => setView('home')} />;
    case 'forgotPassword': return <ForgotPassword onNavigate={setView} />;
    case 'resetPassword': return <ResetPassword token={resetToken} onNavigate={setView} />;
    case 'eventDetail': {
      const event = events.find(e => e.id === selectedEventId);
      if (!event) {
        return <div>Event nicht gefunden. <button onClick={onBackToEvents} className="text-primary underline">Zurück zur Übersicht</button></div>;
      }
      const t = eventTeamData(teams, teamMembers, event.id);
      return (
        <EventDetailView
          event={event}
          participants={participants}
          results={calculatedResults.filter(r => r.eventId === event.id)}
          teams={t.teams}
          teamMembers={t.teamMembers}
          settings={settings}
          onBack={onBackToEvents}
          onEditTeams={ee.openTeams}
        />
      );
    }
    default:
      return <div>Wählen Sie eine Ansicht</div>;
  }
};
