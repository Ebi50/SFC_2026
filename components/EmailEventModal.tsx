import React, { useState } from 'react';
import { Event } from '../types';

interface EmailEventModalProps {
  event: Event;
  onClose: () => void;
  onSend: (message: string) => Promise<void>;
}

export const EmailEventModal: React.FC<EmailEventModalProps> = ({ event, onClose, onSend }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      alert('Bitte geben Sie eine Nachricht ein');
      return;
    }

    setSending(true);
    try {
      await onSend(message);
      alert('E-Mails wurden erfolgreich versendet!');
      onClose();
    } catch (error: any) {
      alert(`Fehler beim Versenden: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="gradient-dark text-white p-6 rounded-t-2xl">
          <h2 className="text-2xl font-display font-bold">Email an Teilnehmer senden</h2>
          <p className="mt-2 text-sm opacity-90">Event: {event.name}</p>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nachricht
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={8}
              placeholder="Geben Sie hier Ihre Nachricht ein...

Die Nachricht wird an alle Teilnehmer dieses Events gesendet und enthält automatisch einen Link zur App."
              disabled={sending}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Hinweis:</strong> Die E-Mail wird an alle Teilnehmer mit registrierten E-Mail-Adressen versendet.
              Am Ende der Nachricht wird automatisch ein Link zur App eingefügt.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-colors"
              disabled={sending}
            >
              Abbrechen
            </button>
            <button
              onClick={handleSend}
              className="px-6 py-3 gradient-red text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={sending || !message.trim()}
            >
              {sending ? 'Sende...' : 'E-Mail senden'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
