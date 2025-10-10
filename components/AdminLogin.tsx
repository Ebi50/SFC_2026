import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { LockClosedIcon, EyeIcon, EyeOffIcon } from './icons';

export function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(password);
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Anmeldung fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-card p-4 border border-white/20">
      <div className="flex items-center space-x-2 mb-3">
        <LockClosedIcon />
        <h3 className="font-display font-semibold text-white text-sm uppercase tracking-wide">Admin</h3>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="relative mb-2">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passwort"
            className="w-full p-2 pr-10 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 placeholder-gray-400 bg-white"
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowPassword(!showPassword);
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none pointer-events-auto"
            tabIndex={-1}
          >
            {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
          </button>
        </div>
        {error && (
          <p className="text-red-600 text-xs mb-2">{error}</p>
        )}
        <button
          type="submit"
          disabled={isLoading || !password}
          className="w-full gradient-red text-white font-semibold py-2.5 px-3 rounded-xl text-sm btn-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Anmelden...' : 'Anmelden'}
        </button>
      </form>
      <p className="text-xs text-white/60 mt-2 text-center">
        Nur für Admins
      </p>
    </div>
  );
}

export function AdminStatus() {
  const { isAdmin, logout } = useAuth();

  if (!isAdmin) return null;

  return (
    <div className="gradient-red rounded-2xl shadow-card p-4 border border-white/20">
      <div className="flex items-center space-x-2 mb-3">
        <LockClosedIcon />
        <span className="font-display font-semibold text-white text-sm uppercase tracking-wide">Admin-Modus</span>
      </div>
      <button
        onClick={logout}
        className="w-full bg-white text-primary px-3 py-2.5 rounded-xl text-sm font-semibold btn-hover"
      >
        Abmelden
      </button>
    </div>
  );
}
