import React, { useState } from 'react';

interface BulkEmailModalProps {
  onClose: () => void;
}

export const BulkEmailModal: React.FC<BulkEmailModalProps> = ({ onClose }) => {
  const [subject, setSubject] = useState('SkinfitCup – ');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      alert('Bitte Betreff und Nachricht ausfüllen');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/admin/bulk-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      alert(`E-Mail erfolgreich an ${data.emailsSent} Teilnehmer versendet (per BCC).`);
      onClose();
    } catch (error: any) {
      alert(`Fehler: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="gradient-dark text-white p-6 rounded-t-2xl">
          <h2 className="text-2xl font-display font-bold">E-Mail an alle Teilnehmer</h2>
          <p className="mt-2 text-sm opacity-90">
            Die E-Mail wird per BCC versendet – Empfänger sind füreinander nicht sichtbar.
          </p>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Betreff</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Betreff der E-Mail"
              disabled={sending}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nachricht</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={10}
              placeholder="Geben Sie hier Ihre Nachricht ein..."
              disabled={sending}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Hinweis:</strong> Die E-Mail wird an alle Teilnehmer mit hinterlegter E-Mail-Adresse
              per BCC versendet. Kein Empfänger kann die Adressen der anderen sehen.
              Am Ende wird automatisch ein Link zu www.sfc-rsv.de und das SkinfitCup-Branding eingefügt.
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
              disabled={sending || !subject.trim() || !message.trim()}
            >
              {sending ? 'Sende...' : 'E-Mail senden'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
