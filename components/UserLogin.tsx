import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { View } from '../types';

interface UserLoginProps {
  onNavigate: (view: View) => void;
}

export const UserLogin: React.FC<UserLoginProps> = ({ onNavigate }) => {
  const { userLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await userLogin(email, password);
      onNavigate('events');
    } catch (err: any) {
      setError(err.message || 'Anmeldung fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-3xl font-bold text-secondary mb-6 text-center">Anmelden</h1>

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
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Passwort</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading || !email || !password}
          className="w-full gradient-red text-white font-bold py-3 px-4 rounded-lg btn-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
        </button>
      </form>

      <p className="text-center mt-6 text-gray-600">
        Noch kein Konto?{' '}
        <button
          onClick={() => onNavigate('userRegister')}
          className="text-primary hover:underline font-semibold"
        >
          Jetzt registrieren
        </button>
      </p>
    </div>
  );
};
