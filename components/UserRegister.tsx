import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { View, Gender, PerfClass } from '../types';

interface UserRegisterProps {
  onNavigate: (view: View) => void;
}

export const UserRegister: React.FC<UserRegisterProps> = ({ onNavigate }) => {
  const { userRegister } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthYear: new Date().getFullYear() - 30,
    gender: Gender.Male,
    perfClass: PerfClass.C,
    isRsvMember: false,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              name === 'birthYear' ? parseInt(value) || '' : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }

    if (form.password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }

    setIsLoading(true);
    try {
      await userRegister({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        birthYear: form.birthYear as number,
        gender: form.gender,
        perfClass: form.perfClass,
        isRsvMember: form.isRsvMember,
      });
      onNavigate('events');
    } catch (err: any) {
      setError(err.message || 'Registrierung fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-3xl font-bold text-secondary mb-6 text-center">Registrieren</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Vorname *</label>
            <input
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nachname *</label>
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">E-Mail *</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
            autoComplete="email"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Passwort *</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Bestätigen *</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Geburtsjahr *</label>
            <input
              type="number"
              name="birthYear"
              value={form.birthYear}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
              min={1930}
              max={new Date().getFullYear()}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Geschlecht *</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={Gender.Male}>Männlich</option>
              <option value={Gender.Female}>Weiblich</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Klasse *</label>
            <select
              name="perfClass"
              value={form.perfClass}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={PerfClass.A}>A (Hobby)</option>
              <option value={PerfClass.B}>B (Hobby)</option>
              <option value={PerfClass.C}>C (Ambitioniert)</option>
              <option value={PerfClass.D}>D (Ambitioniert)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isRsvMember"
            id="isRsvMember"
            checked={form.isRsvMember}
            onChange={handleChange}
            className="w-4 h-4 text-primary rounded focus:ring-primary"
          />
          <label htmlFor="isRsvMember" className="text-sm text-gray-700">RSV-Mitglied</label>
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full gradient-red text-white font-bold py-3 px-4 rounded-lg btn-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Wird registriert...' : 'Registrieren'}
        </button>
      </form>

      <p className="text-center mt-6 text-gray-600">
        Schon ein Konto?{' '}
        <button
          onClick={() => onNavigate('userLogin')}
          className="text-primary hover:underline font-semibold"
        >
          Anmelden
        </button>
      </p>
    </div>
  );
};
