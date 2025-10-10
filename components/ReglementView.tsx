import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

interface ReglementInfo {
  exists: boolean;
  path?: string;
  uploadDate?: string;
  size?: number;
  seasonYear?: number;
}

interface ReglementViewProps {
  selectedSeason: number | null;
}

export const ReglementView: React.FC<ReglementViewProps> = ({ selectedSeason }) => {
  const { isAdmin } = useAuth();
  const [reglementInfo, setReglementInfo] = useState<ReglementInfo>({ exists: false });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadReglementInfo = async () => {
    if (!selectedSeason) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`/api/reglement/exists/${selectedSeason}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setReglementInfo(data);
      }
    } catch (error) {
      console.error('Error loading reglement info:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReglementInfo();
  }, [selectedSeason]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedSeason) {
      alert('Keine Saison ausgewählt');
      return;
    }

    if (!file.name.endsWith('.pdf')) {
      alert('Bitte nur PDF-Dateien hochladen');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('reglement', file);
    formData.append('seasonYear', selectedSeason.toString());

    try {
      const response = await fetch('/api/reglement/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        // Lade neue Info und force iframe reload durch key change
        await loadReglementInfo();
        setIframeKey(prev => prev + 1);
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Fehler beim Hochladen');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Fehler beim Hochladen');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-full">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-display font-bold text-dark-bg flex items-center">
              <svg className="w-8 h-8 mr-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Reglement
            </h1>
            <p className="text-gray-600 mt-2">Skinfit Cup Reglement {selectedSeason || '2025'}</p>
            {reglementInfo.exists && reglementInfo.uploadDate && (
              <p className="text-gray-500 text-sm mt-1">
                Hochgeladen am {formatDate(reglementInfo.uploadDate)} ({formatFileSize(reglementInfo.size)})
              </p>
            )}
          </div>
          
          {isAdmin && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>{uploading ? 'Wird hochgeladen...' : 'PDF hochladen'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <p className="text-gray-600">Lade Reglement...</p>
        </div>
      ) : reglementInfo.exists && reglementInfo.path ? (
        <div className="bg-white rounded-xl shadow-md overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <iframe
            key={iframeKey}
            src={`${reglementInfo.path}?t=${reglementInfo.uploadDate || Date.now()}`}
            className="w-full h-full"
            title="Skinfit Cup Reglement"
            style={{ border: 'none' }}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Kein Reglement vorhanden</h3>
          <p className="text-gray-600">
            {isAdmin 
              ? 'Laden Sie ein Reglement-PDF hoch, um es hier anzuzeigen.' 
              : 'Der Administrator hat noch kein Reglement hochgeladen.'}
          </p>
        </div>
      )}
    </div>
  );
};
