import React, { useState } from 'react';
import type { View } from './types';
import { useAuth } from './components/AuthContext';
import { InstallPWA } from './components/InstallPWA';
import { Sidebar } from './components/layout/Sidebar';
import { SeasonBar } from './components/layout/SeasonBar';
import { ViewSwitch } from './components/layout/ViewSwitch';
import { AppModals } from './components/layout/AppModals';
import { useSeasonData } from './hooks/useSeasonData';
import { useParticipantEditor } from './hooks/useParticipantEditor';
import { useEventEditor } from './hooks/useEventEditor';
import { useTrainingRoute, viewFromPath } from './components/training/useTrainingRoute';

// Hülle der App: Menü, Saisonauswahl, aktive Seite und Dialoge.
// Daten und Bearbeiten-Logik liegen in hooks/, die Seitenauswahl in components/layout/ViewSwitch.

const resetTokenFromUrl = () => new URLSearchParams(window.location.search).get('resetToken') || '';

const App: React.FC = () => {
  const { isAdmin, isLoggedIn, user, userLogout, isLoading: authLoading } = useAuth();
  const [resetToken] = useState(resetTokenFromUrl);
  const [view, setView] = useState<View>(() => (resetTokenFromUrl() ? 'resetPassword' : viewFromPath(window.location.pathname) ?? 'home'));
  const { afterLoginView } = useTrainingRoute(view, setView, isLoggedIn, authLoading);

  const data = useSeasonData(isAdmin);
  const participantEditor = useParticipantEditor(data);
  const eventEditor = useEventEditor(data);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isBulkEmailOpen, setBulkEmailOpen] = useState(false);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const viewEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setView('eventDetail');
  };
  const backToEvents = () => {
    setSelectedEventId(null);
    setView('events');
  };

  if (data.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Daten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-light min-h-screen font-sans">
      <div className="no-print">
        <Sidebar
          activeView={view}
          setView={setView}
          isAdmin={isAdmin}
          isLoggedIn={isLoggedIn}
          userName={user ? user.email : null}
          onUserLogout={userLogout}
          isMobileOpen={isMobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
      </div>
      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <SeasonBar
          seasons={data.availableSeasons}
          selected={data.selectedSeason}
          onSelect={data.setSelectedSeason}
          isAdmin={isAdmin}
          onNewSeason={eventEditor.openSeason}
          onOpenMenu={() => setMobileSidebarOpen(true)}
        />
        <div className="bg-white rounded-xl shadow-md p-4 lg:p-8 min-h-full">
          <ViewSwitch
            view={view}
            setView={setView}
            data={data}
            participantEditor={participantEditor}
            eventEditor={eventEditor}
            resetToken={resetToken}
            afterLoginView={afterLoginView}
            selectedEventId={selectedEventId}
            onViewEvent={viewEvent}
            onBackToEvents={backToEvents}
            onOpenBulkEmail={() => setBulkEmailOpen(true)}
          />
        </div>
      </main>
      <AppModals
        data={data}
        participantEditor={participantEditor}
        eventEditor={eventEditor}
        isBulkEmailOpen={isBulkEmailOpen}
        onCloseBulkEmail={() => setBulkEmailOpen(false)}
      />
      <InstallPWA />
    </div>
  );
};

export default App;
