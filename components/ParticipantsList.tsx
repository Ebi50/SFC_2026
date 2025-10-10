

import React, { useState, useMemo } from 'react';
import { Participant, Gender, PerfClass } from '../types';
import { UploadIcon, UsersIcon, PencilIcon, TrashIcon, CheckIcon, PlusIcon } from './icons';
import { useAuth } from './AuthContext';

interface ParticipantsListProps {
  participants: Participant[];
  onOpenImportModal: () => void;
  onEditParticipant: (participant: Participant) => void;
  onDeleteParticipant: (participantId: string) => void;
  onNewParticipant: () => void;
}

const getGenderLabel = (gender: Gender) => (gender === Gender.Male ? 'Männlich' : 'Weiblich');
const getPerfClassLabel = (perfClass: PerfClass) => `Klasse ${perfClass}`;

export const ParticipantsList: React.FC<ParticipantsListProps> = ({ participants, onOpenImportModal, onEditParticipant, onDeleteParticipant, onNewParticipant }) => {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredParticipants = useMemo(() => {
    let filtered = participants;
    
    // Apply search filter if search term exists
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = participants.filter(p => 
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(search) ||
        `${p.lastName} ${p.firstName}`.toLowerCase().includes(search)
      );
    }
    
    // Sort by last name, then by first name
    return [...filtered].sort((a, b) => {
      const lastNameComparison = a.lastName.localeCompare(b.lastName);
      if (lastNameComparison !== 0) return lastNameComparison;
      return a.firstName.localeCompare(b.firstName);
    });
  }, [participants, searchTerm]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <UsersIcon />
          <h1 className="text-3xl font-display font-bold text-dark-bg">Teilnehmer</h1>
        </div>
        <div className="flex items-center space-x-2">
           <button
            onClick={onNewParticipant}
            className="gradient-dark text-white font-semibold py-3 px-5 rounded-xl flex items-center space-x-2 btn-hover shadow-card"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Hinzufügen</span>
          </button>
          <button
            onClick={onOpenImportModal}
            className="bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-5 rounded-xl flex items-center space-x-2 btn-hover shadow-card"
          >
            <UploadIcon className="w-5 h-5" />
            <span>Importieren</span>
          </button>
        </div>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Nach Name suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        />
        {searchTerm && (
          <p className="text-sm text-gray-600 mt-2">
            {filteredParticipants.length} von {participants.length} Teilnehmer{filteredParticipants.length !== 1 ? 'n' : ''} gefunden
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="gradient-dark">
              <tr>
                <th className="p-4 font-display font-semibold text-sm text-white uppercase tracking-wider">Name</th>
                <th className="p-4 font-display font-semibold text-sm text-white uppercase tracking-wider">Jahrgang</th>
                <th className="p-4 font-display font-semibold text-sm text-white uppercase tracking-wider">Klasse</th>
                <th className="p-4 font-display font-semibold text-sm text-white uppercase tracking-wider">Geschlecht</th>
                <th className="p-4 font-display font-semibold text-sm text-white uppercase tracking-wider text-center">RSV Mitglied</th>
                {isAdmin && <th className="p-4 font-display font-semibold text-sm text-white uppercase tracking-wider">Telefon</th>}
                {isAdmin && <th className="p-4 font-display font-semibold text-sm text-white uppercase tracking-wider">E-Mail</th>}
                <th className="p-4 font-display font-semibold text-sm text-white uppercase tracking-wider text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredParticipants.map((p) => (
                <tr key={p.id} className="hover:bg-primary/10">
                  <td className="p-4 text-gray-800 font-medium">{p.lastName}, {p.firstName}</td>
                  <td className="p-4 text-gray-700">{p.birthYear}</td>
                  <td className="p-4 text-gray-700">{getPerfClassLabel(p.perfClass)}</td>
                  <td className="p-4 text-gray-700">{getGenderLabel(p.gender)}</td>
                  <td className="p-4 text-center">
                    {p.isRsvMember ? <CheckIcon className="w-6 h-6 text-primary mx-auto" /> : <span className="text-gray-400">-</span>}
                  </td>
                  {isAdmin && <td className="p-4 text-gray-500">{p.phone || '-'}</td>}
                  {isAdmin && <td className="p-4 text-gray-500">{p.email || '-'}</td>}
                  <td className="p-4 text-right">
                    <button onClick={() => onEditParticipant(p)} className="text-blue-600 hover:text-blue-800 p-2" aria-label={`Teilnehmer ${p.firstName} ${p.lastName} bearbeiten`}>
                        <PencilIcon />
                    </button>
                    {isAdmin && (
                      <button onClick={() => onDeleteParticipant(p.id)} className="text-red-600 hover:text-red-800 p-2 ml-2" aria-label={`Teilnehmer ${p.firstName} ${p.lastName} löschen`}>
                          <TrashIcon />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {participants.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 8 : 6} className="p-4 text-center text-gray-500">
                    Keine Teilnehmer vorhanden. Starten Sie mit dem Import.
                  </td>
                </tr>
              )}
              {participants.length > 0 && filteredParticipants.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 8 : 6} className="p-4 text-center text-gray-500">
                    Keine Teilnehmer mit "{searchTerm}" gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};