import React, { useState, useEffect } from 'react';

interface GdprStats {
  total: number;
  withConsent: number;
  withoutConsent: number;
  withoutConsentWithEmail: number;
}

interface ParticipantGdpr {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  birthYear: number;
  perfClass: string;
  gender: string;
  dataConsent: number;
  dataConsentAt: string | null;
}

interface GdprStatusViewProps {
  onOpenBulkEmail: () => void;
}

export const GdprStatusView: React.FC<GdprStatusViewProps> = ({ onOpenBulkEmail }) => {
  const [stats, setStats] = useState<GdprStats | null>(null);
  const [participants, setParticipants] = useState<ParticipantGdpr[]>([]);
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [anonymizing, setAnonymizing] = useState(false);

  const loadData = async () => {
    try {
      const response = await fetch('/api/admin/gdpr-status');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setStats(data.stats);
      setParticipants(data.participantsWithoutConsent);
      setDeadline(data.deadline);
    } catch (error: any) {
      alert(`Fehler beim Laden: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSendConsentRequest = async () => {
    if (!confirm('DSGVO-Einwilligungsanfrage per BCC an alle Teilnehmer ohne Einwilligung senden?')) return;

    setSending(true);
    try {
      const response = await fetch('/api/admin/gdpr-send-consent-request', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      alert(`Einwilligungsanfrage an ${data.emailsSent} Teilnehmer versendet.`);
    } catch (error: any) {
      alert(`Fehler: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleAnonymize = async () => {
    if (!confirm('ACHTUNG: Kontaktdaten (E-Mail, Telefon, Adresse) aller Teilnehmer OHNE Einwilligung werden unwiderruflich gelöscht. Namen und Ergebnisse bleiben erhalten. Fortfahren?')) return;

    setAnonymizing(true);
    try {
      const response = await fetch('/api/admin/gdpr-anonymize', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      alert(`${data.anonymized} Teilnehmer anonymisiert.`);
      loadData();
    } catch (error: any) {
      alert(`Fehler: ${error.message}`);
    } finally {
      setAnonymizing(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Lade DSGVO-Status...</div>;
  }

  const now = new Date().toISOString().split('T')[0];
  const isDeadlinePassed = now >= deadline;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-gray-900">DSGVO-Verwaltung</h2>
          <p className="text-gray-600 mt-1">Einwilligungsstatus und Datenschutz</p>
        </div>
        <button
          onClick={onOpenBulkEmail}
          className="px-5 py-2.5 gradient-dark text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span>Massen-E-Mail</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-card p-5">
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Teilnehmer gesamt</div>
          </div>
          <div className="bg-white rounded-2xl shadow-card p-5">
            <div className="text-3xl font-bold text-green-600">{stats.withConsent}</div>
            <div className="text-sm text-gray-500">Mit Einwilligung</div>
          </div>
          <div className="bg-white rounded-2xl shadow-card p-5">
            <div className="text-3xl font-bold text-red-600">{stats.withoutConsent}</div>
            <div className="text-sm text-gray-500">Ohne Einwilligung</div>
          </div>
          <div className="bg-white rounded-2xl shadow-card p-5">
            <div className="text-3xl font-bold text-yellow-600">{stats.withoutConsentWithEmail}</div>
            <div className="text-sm text-gray-500">Ohne Einwilligung (mit E-Mail)</div>
          </div>
        </div>
      )}

      {/* Deadline Info */}
      <div className={`rounded-2xl shadow-card p-5 ${isDeadlinePassed ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        <div className="flex items-start space-x-3">
          <svg className={`w-6 h-6 mt-0.5 flex-shrink-0 ${isDeadlinePassed ? 'text-red-600' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 className={`font-semibold ${isDeadlinePassed ? 'text-red-800' : 'text-yellow-800'}`}>
              {isDeadlinePassed ? 'Frist abgelaufen!' : `Frist: ${new Date(deadline).toLocaleDateString('de-DE')}`}
            </h3>
            <p className={`text-sm mt-1 ${isDeadlinePassed ? 'text-red-700' : 'text-yellow-700'}`}>
              {isDeadlinePassed
                ? 'Die Frist zur Einwilligung ist abgelaufen. Kontaktdaten von Teilnehmern ohne Einwilligung sollten anonymisiert werden.'
                : 'Nach diesem Datum werden Kontaktdaten (E-Mail, Telefon, Adresse) von Teilnehmern ohne Einwilligung automatisch beim nächsten Server-Start gelöscht. Namen und Ergebnisse bleiben erhalten.'}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSendConsentRequest}
          disabled={sending || (stats?.withoutConsentWithEmail ?? 0) === 0}
          className="px-6 py-3 gradient-red text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span>{sending ? 'Sende...' : 'Einwilligungsanfrage senden'}</span>
        </button>

        {isDeadlinePassed && (
          <button
            onClick={handleAnonymize}
            disabled={anonymizing || (stats?.withoutConsent ?? 0) === 0}
            className="px-6 py-3 bg-red-100 text-red-700 font-semibold rounded-xl hover:bg-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>{anonymizing ? 'Anonymisiere...' : 'Jetzt anonymisieren'}</span>
          </button>
        )}
      </div>

      {/* Participants without consent */}
      {participants.length > 0 && (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="gradient-dark text-white p-4">
            <h3 className="text-lg font-display font-semibold">Teilnehmer ohne Einwilligung ({participants.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">E-Mail</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Jahrgang</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">LK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {participants.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.lastName}, {p.firstName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.email || '–'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.birthYear}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.perfClass}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {participants.length === 0 && !loading && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
          <svg className="w-12 h-12 text-green-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-green-800 font-semibold">Alle Teilnehmer haben ihre Einwilligung erteilt.</p>
        </div>
      )}
    </div>
  );
};
