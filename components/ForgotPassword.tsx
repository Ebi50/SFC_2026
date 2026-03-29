import React, { useState } from 'react';
import { userApi } from '../services/api';
import { View } from '../types';

interface ForgotPasswordProps {
  onNavigate: (view: View) => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await userApi.forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || err.error || 'Fehler beim Senden der E-Mail.');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <svg className="w-12 h-12 mx-auto text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h2 className="text-xl font-bold text-green-800 mb-2">E-Mail gesendet!</h2>
          <p className="text-green-700 mb-4">
            Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir dir einen Link zum Zurücksetzen deines Passworts gesendet.
          </p>
          <p className="text-sm text-green-600 mb-6">Bitte prüfe auch deinen Spam-Ordner.</p>
          <button
            onClick={() => onNavigate('userLogin')}
            className="text-primary hover:underline font-semibold"
          >
            Zurück zur Anmeldung
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-3xl font-bold text-secondary mb-2 text-center">Passwort vergessen</h1>
      <p className="text-gray-600 text-center mb-6">
        Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">E-Mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
            autoComplete="email"
            autoFocus
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading || !email}
          className="w-full gradient-red text-white font-bold py-3 px-4 rounded-lg btn-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Wird gesendet...' : 'Reset-Link senden'}
        </button>
      </form>

      <p className="text-center mt-6 text-gray-600">
        <button
          onClick={() => onNavigate('userLogin')}
          className="text-primary hover:underline font-semibold"
        >
          Zurück zur Anmeldung
        </button>
      </p>
    </div>
  );
};
