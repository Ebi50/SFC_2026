import React from 'react';
import { ParticipantImportModal } from '../ParticipantImportModal';
import { ParticipantFormModal } from '../ParticipantFormModal';
import { EventFormModal, TeamEditModal } from '../EventFormModal';
import { NewSeasonModal } from '../NewSeasonModal';
import { BulkEmailModal } from '../BulkEmailModal';
import { eventTeamData, sliceSeason } from '../../services/seasonData';
import type { SeasonData } from '../../hooks/useSeasonData';
import type { ParticipantEditor } from '../../hooks/useParticipantEditor';
import type { EventEditor } from '../../hooks/useEventEditor';

interface Props {
  data: SeasonData;
  participantEditor: ParticipantEditor;
  eventEditor: EventEditor;
  isBulkEmailOpen: boolean;
  onCloseBulkEmail: () => void;
}

/** Alle Admin-Dialoge der App an einer Stelle */
export const AppModals: React.FC<Props> = ({ data, participantEditor: pe, eventEditor: ee, isBulkEmailOpen, onCloseBulkEmail }) => {
  const { participants, events, results, teams, teamMembers, settings, selectedSeason, availableSeasons } = data;
  const editing = ee.editingEvent;
  const editingTeams = editing ? eventTeamData(teams, teamMembers, editing.id) : { teams: [], teamMembers: [] };
  // Für den Event-Dialog: Events und Ergebnisse der Saison des Events (neue Events: gewählte Saison)
  const dialogSeason = sliceSeason({ events, results, teams, teamMembers }, editing?.season ?? selectedSeason);

  return (
    <>
      {pe.isImportOpen && (
        <ParticipantImportModal onClose={pe.closeImport} onImport={pe.importAll} existingParticipants={participants} settings={settings} />
      )}
      {ee.isEventOpen && selectedSeason && (
        <EventFormModal
          onClose={ee.closeEvent}
          onSave={ee.saveEvent}
          event={editing}
          allParticipants={participants}
          eventResults={editing ? results.filter(r => r.eventId === editing.id) : []}
          eventTeams={editingTeams.teams}
          eventTeamMembers={editingTeams.teamMembers}
          settings={settings}
          selectedSeason={selectedSeason}
          allSeasonEvents={dialogSeason.events}
          allSeasonResults={dialogSeason.results}
        />
      )}
      {ee.isSeasonOpen && (
        <NewSeasonModal onClose={ee.closeSeason} onSave={ee.createSeason} existingSeasons={availableSeasons} />
      )}
      {pe.editing && (
        <ParticipantFormModal onClose={pe.close} onSave={pe.save} participant={pe.editing} isNew={pe.isNew} />
      )}
      {ee.teamEvent && (() => {
        const t = eventTeamData(teams, teamMembers, ee.teamEvent.id);
        return (
          <TeamEditModal
            event={ee.teamEvent}
            initialTeams={t.teams}
            initialTeamMembers={t.teamMembers}
            allParticipants={participants}
            onClose={ee.closeTeams}
            onSave={ee.saveTeams}
          />
        );
      })()}
      {isBulkEmailOpen && <BulkEmailModal onClose={onCloseBulkEmail} />}
    </>
  );
};
