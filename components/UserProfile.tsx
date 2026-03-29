import React, { useState, useEffect } from 'react';
import { userApi } from '../services/api';
import { useAuth } from './AuthContext';
import { PerfClass, Gender } from '../types';

interface UserProfileProps {
  onBack: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onBack }) => {
  const { userLogout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Account deletion
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Profile fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthYear, setBirthYear] = useState(2000);
  const [gender, setGender] = useState<Gender>(Gender.Male);
  const [perfClass, setPerfClass] = useState<PerfClass>(PerfClass.C);
  const [isRsvMember, setIsRsvMember] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await userApi.getProfile();
      setProfile(data);
      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
      setPhone(data.phone || '');
      setBirthYear(data.birthYear || 2000);
      setGender(data.gender || Gender.Male);
      setPerfClass(data.perfClass || PerfClass.C);
      setIsRsvMember(Boolean(data.isRsvMember));
    } catch {
      setError('Profil konnte nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await userApi.updateProfile({ firstName, lastName, phone, birthYear, gender, perfClass, isRsvMember });
      setMessage('Profil erfolgreich gespeichert.');
    } catch (err: any) {
      setError(err?.error || 'Fehler beim Speichern.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Die Passwörter stimmen nicht überein.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Das neue Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }

    setChangingPassword(true);
    try {
      await userApi.changePassword(currentPassword, newPassword);
      setPasswordMessage('Passwort erfolgreich geändert.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err?.error || 'Fehler beim Ändern des Passworts.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Bitte Passwort eingeben.');
      return;
    }
    setDeleting(true);
    setDeleteError('');
    try {
      await userApi.deleteAccount(deletePassword);
      await userLogout();
      onBack();
    } catch (err: any) {
      setDeleteError(err?.error || 'Fehler beim Löschen des Kontos.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Laden...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="mb-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg"
      >
        &larr; Zurück
      </button>

      <h1 className="text-3xl font-bold text-secondary mb-6">Mein Profil</h1>

      {/* Profile Form */}
      <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Profildaten</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vorname *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nachname *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon / Handy</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Geburtsjahr *</label>
              <input
                type="number"
                value={birthYear}
                onChange={(e) => setBirthYear(parseInt(e.target.value))}
                min={1920}
                max={2020}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Geschlecht *</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value={Gender.Male}>Männlich</option>
                <option value={Gender.Female}>Weiblich</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Klasse *</label>
              <select
                value={perfClass}
                onChange={(e) => setPerfClass(e.target.value as PerfClass)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value={PerfClass.A}>Klasse A</option>
                <option value={PerfClass.B}>Klasse B</option>
                <option value={PerfClass.C}>Klasse C</option>
                <option value={PerfClass.D}>Klasse D</option>
              </select>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isRsvMember"
              checked={isRsvMember}
              onChange={(e) => setIsRsvMember(e.target.checked)}
              className="h-4 w-4 text-primary border-gray-300 rounded"
            />
            <label htmlFor="isRsvMember" className="ml-2 text-sm text-gray-700">RSV Mitglied</label>
          </div>

          {message && <p className="text-green-600 text-sm">{message}</p>}
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Speichert...' : 'Profil speichern'}
          </button>
        </form>
      </div>

      {/* Password Change */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Passwort ändern</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aktuelles Passwort</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Neues Passwort</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Neues Passwort bestätigen</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {passwordMessage && <p className="text-green-600 text-sm">{passwordMessage}</p>}
          {passwordError && <p className="text-red-600 text-sm">{passwordError}</p>}

          <button
            type="submit"
            disabled={changingPassword}
            className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {changingPassword ? 'Wird geändert...' : 'Passwort ändern'}
          </button>
        </form>
      </div>

      {/* Account Deletion */}
      <div className="bg-white rounded-2xl shadow-card p-6 mt-6 border border-red-200">
        <h2 className="text-xl font-bold text-red-600 mb-2">Konto löschen</h2>
        <p className="text-sm text-gray-600 mb-4">
          Dein Konto und alle persönlichen Daten werden unwiderruflich gelöscht.
          Deine bisherigen Ergebnisse bleiben anonymisiert in der Wertung erhalten.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Konto löschen...
          </button>
        ) : (
          <div className="space-y-3 bg-red-50 p-4 rounded-lg">
            <p className="text-sm font-semibold text-red-700">
              Bist du sicher? Gib dein Passwort zur Bestätigung ein:
            </p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Passwort eingeben"
              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            {deleteError && <p className="text-red-600 text-sm">{deleteError}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? 'Wird gelöscht...' : 'Endgültig löschen'}
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteError(''); }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
