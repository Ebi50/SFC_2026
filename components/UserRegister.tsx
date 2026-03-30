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
    phone: '',
    password: '',
    confirmPassword: '',
    birthYear: new Date().getFullYear() - 30,
    gender: Gender.Male,
    perfClass: PerfClass.C,
    isRsvMember: false,
    waiverAccepted: false,
    fotoConsent: false,
  });
  const [showPassword, setShowPassword] = useState(false);
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

    if (!form.waiverAccepted) {
      setError('Bitte bestaetige die Teilnahmeerklaerung & den Haftungsverzicht.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Die Passwoerter stimmen nicht ueberein.');
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
        phone: form.phone,
        password: form.password,
        birthYear: form.birthYear as number,
        gender: form.gender,
        perfClass: form.perfClass,
        isRsvMember: form.isRsvMember,
        waiverAccepted: form.waiverAccepted,
        fotoConsent: form.fotoConsent,
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

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Telefon/Mobil *</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="z.B. 0171 1234567"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
            autoComplete="tel"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Passwort *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Bestätigen *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
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

        {/* Teilnahmeerklaerung (Pflicht) */}
        <div className={`border-2 rounded-lg p-4 transition-colors ${form.waiverAccepted ? 'border-green-500 bg-green-50' : 'border-primary bg-red-50'}`}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="waiverAccepted"
              checked={form.waiverAccepted}
              onChange={handleChange}
              className="mt-1 w-5 h-5 accent-primary"
            />
            <span className="text-sm text-gray-800">
              Ich habe die{' '}
              <button type="button" onClick={() => onNavigate('teilnahmeerklaerung')} className="text-primary hover:underline font-semibold">
                Teilnahmeerklaerung &amp; den Haftungsverzicht
              </button>
              {' '}gelesen und erklaere mich damit einverstanden. Ich nehme auf eigenes Risiko teil und verzichte auf Regressansprueche. *
            </span>
          </label>
        </div>

        {/* Foto-Einwilligung (Freiwillig) */}
        <div className={`border-2 rounded-lg p-4 transition-colors ${form.fotoConsent ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="fotoConsent"
              checked={form.fotoConsent}
              onChange={handleChange}
              className="mt-1 w-5 h-5 accent-green-600"
            />
            <span className="text-sm text-gray-800">
              <strong>Freiwillig:</strong> Ich willige ein, dass Fotos/Videos, auf denen ich erkennbar bin, auf der SkinfitCup-Website und auf Instagram veroeffentlicht werden duerfen. Ich kann diese Einwilligung jederzeit widerrufen.
            </span>
          </label>
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
