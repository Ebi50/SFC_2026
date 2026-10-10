import { useState } from 'react';
import type { Gender, Participant, PerfClass } from '../types';
import { participantsApi } from '../services/api';
import type { SeasonData } from './useSeasonData';

const errorText = (error: any) => error?.message || error?.toString() || 'Unbekannter Fehler';

/** Teilnehmer anlegen, bearbeiten, löschen und importieren (Admin) */
export function useParticipantEditor(data: SeasonData) {
  const { setParticipants, setResults, setTeamMembers } = data;
  const [isImportOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Participant | undefined>(undefined);

  const openNew = () => setEditing({
    id: '',
    firstName: '',
    lastName: '',
    birthYear: new Date().getFullYear() - 30,
    perfClass: 'C' as PerfClass,
    gender: 'M' as Gender,
    email: '',
    phone: '',
    isRsvMember: false,
  });

  const save = async (participant: Participant) => {
    try {
      if (participant.id) {
        await participantsApi.update(participant.id, participant);
        setParticipants(prev => prev.map(p => (p.id === participant.id ? participant : p)));
      } else {
        const { id: _id, ...participantData } = participant;
        const created = await participantsApi.create(participantData as Omit<Participant, 'id'>);
        setParticipants(prev => [...prev, created]);
      }
      setEditing(undefined);
    } catch (error) {
      console.error('Error saving participant:', error);
      alert('Fehler beim Speichern des Teilnehmers');
    }
  };

  const remove = async (participantId: string) => {
    if (!confirm('Möchten Sie diesen Teilnehmer wirklich löschen?')) return;
    try {
      await participantsApi.delete(participantId);
      setParticipants(prev => prev.filter(p => p.id !== participantId));
      // auch aus Ergebnissen und Teams entfernen
      setResults(prev => prev.filter(r => r.participantId !== participantId));
      setTeamMembers(prev => prev.filter(tm => tm.participantId !== participantId));
    } catch (error) {
      console.error('Error deleting participant:', error);
      alert(`Fehler beim Löschen des Teilnehmers:\n${errorText(error)}`);
    }
  };

  const importAll = async (newParticipants: Participant[]) => {
    try {
      setParticipants(await participantsApi.import(newParticipants));
      setImportOpen(false);
    } catch (error) {
      console.error('Error importing participants:', error);
      alert('Fehler beim Importieren der Teilnehmer');
    }
  };

  return {
    editing, isNew: !editing?.id, openNew, openEdit: setEditing, close: () => setEditing(undefined), save, remove,
    isImportOpen, openImport: () => setImportOpen(true), closeImport: () => setImportOpen(false), importAll,
  };
}

export type ParticipantEditor = ReturnType<typeof useParticipantEditor>;
