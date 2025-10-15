
import React, { useState } from 'react';
import { Participant, PerfClass, Gender } from '../types';
import { CloseIcon } from './icons';
import { useAuth } from './AuthContext';

interface ParticipantFormModalProps {
  onClose: () => void;
  onSave: (participant: Participant) => void;
  participant: Participant;
  isNew: boolean;
}

export const ParticipantFormModal: React.FC<ParticipantFormModalProps> = ({ onClose, onSave, participant, isNew }) => {
  const { isAdmin } = useAuth();
  const [formData, setFormData] = useState<Participant>(participant);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveClick = () => {
    if (!isAdmin) {
      alert('Sie benötigen Admin-Rechte zum Bearbeiten von Teilnehmern');
      return;
    }

    const dataToSave = {
      ...formData,
      birthYear: Number(formData.birthYear)
    };
    onSave(dataToSave);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-secondary">{isNew ? 'Neuen Teilnehmer erstellen' : 'Teilnehmer bearbeiten'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><CloseIcon /></button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">Vorname *</label>
              <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md w-full" required disabled={!isAdmin} />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Nachname *</label>
              <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md w-full" required disabled={!isAdmin} />
            </div>
          </div>
          
          {isAdmin && (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-4">
                <h3 className="font-semibold text-yellow-800 mb-2">🔒 Geschützte Datenschutzfelder (nur für Admins sichtbar)</h3>
                <p className="text-sm text-yellow-700">Diese Felder sind für die Öffentlichkeit nicht sichtbar.</p>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-Mail</label>
                <input type="email" id="email" name="email" value={formData.email || ''} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md w-full" />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefon</label>
                <input type="tel" id="phone" name="phone" value={formData.phone || ''} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md w-full" />
              </div>
            </>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="club" className="block text-sm font-medium text-gray-700">Verein <span className="text-gray-400">(Optional)</span></label>
              <input type="text" id="club" name="club" value={formData.club || ''} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md w-full" disabled={!isAdmin} />
            </div>
            <div>
              <label htmlFor="startNumber" className="block text-sm font-medium text-gray-700">Startnummer <span className="text-gray-400">(Optional)</span></label>
              <input type="text" id="startNumber" name="startNumber" value={formData.startNumber || ''} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md w-full" disabled={!isAdmin} />
            </div>
            <div>
              <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">Nationalität <span className="text-gray-400">(Optional)</span></label>
              <input type="text" id="nationality" name="nationality" value={formData.nationality || ''} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md w-full" disabled={!isAdmin} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="birthYear" className="block text-sm font-medium text-gray-700">Jahrgang *</label>
              <input type="number" id="birthYear" name="birthYear" value={formData.birthYear} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md w-full" required disabled={!isAdmin} />
            </div>
            <div>
              <label htmlFor="perfClass" className="block text-sm font-medium text-gray-700">Klasse *</label>
              <select id="perfClass" name="perfClass" value={formData.perfClass} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md w-full" disabled={!isAdmin}>
                {Object.values(PerfClass).map(pc => <option key={pc} value={pc}>Klasse {pc}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Geschlecht *</label>
              <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md w-full" disabled={!isAdmin}>
                <option value={Gender.Male}>Männlich</option>
                <option value={Gender.Female}>Weiblich</option>
              </select>
            </div>
          </div>
          <div className="flex items-center pt-2">
            <input
              type="checkbox"
              id="isRsvMember"
              name="isRsvMember"
              checked={formData.isRsvMember}
              onChange={handleChange}
              className="h-4 w-4 text-primary focus:ring-primary-dark border-gray-300 rounded"
              disabled={!isAdmin}
            />
            <label htmlFor="isRsvMember" className="ml-2 block text-sm font-medium text-gray-900">
              Ist RSV Mitglied
            </label>
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 mt-8">
          <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Abbrechen</button>
          {isAdmin && (
            <button onClick={handleSaveClick} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">Speichern</button>
          )}
        </div>
      </div>
    </div>
  );
};
