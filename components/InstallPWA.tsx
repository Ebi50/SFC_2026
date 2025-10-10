import React, { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInStandaloneMode, setIsInStandaloneMode] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
    
    setIsIOS(isIOSDevice);
    setIsInStandaloneMode(isStandalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallButton(false);
    }
  };

  const handleShowIOSInstructions = () => {
    setShowIOSInstructions(true);
  };

  const handleCloseIOSInstructions = () => {
    setShowIOSInstructions(false);
  };

  if (isInStandaloneMode) return null;

  if (showIOSInstructions && isIOS) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
          <button 
            onClick={handleCloseIOSInstructions}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="text-center">
            <div className="gradient-red w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">App installieren</h3>
            <p className="text-gray-600 mb-6">
              Installieren Sie Skinfit Cup als App auf Ihrem iPhone:
            </p>

            <div className="space-y-4 text-left">
              <div className="flex items-start space-x-3">
                <div className="gradient-red text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-gray-700">
                    Tippen Sie auf das <strong>Teilen-Symbol</strong> 
                    <svg className="w-5 h-5 inline mx-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/>
                    </svg>
                    (unten in Safari)
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="gradient-red text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-gray-700">
                    Scrollen Sie und wählen Sie <strong>"Zum Home-Bildschirm"</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="gradient-red text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-gray-700">
                    Tippen Sie auf <strong>"Hinzufügen"</strong> - fertig! 🎉
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleCloseIOSInstructions}
              className="mt-6 w-full gradient-red text-white font-semibold py-3 px-6 rounded-xl btn-hover"
            >
              Verstanden
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showInstallButton) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
        <button
          onClick={handleInstallClick}
          className="gradient-red text-white font-semibold py-3 px-6 rounded-xl shadow-lg flex items-center space-x-2 btn-hover"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>App installieren</span>
        </button>
      </div>
    );
  }

  if (isIOS) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
        <button
          onClick={handleShowIOSInstructions}
          className="gradient-red text-white font-semibold py-3 px-6 rounded-xl shadow-lg flex items-center space-x-2 btn-hover"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span>App installieren</span>
        </button>
      </div>
    );
  }

  return null;
};
