import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

interface GPXFile {
  filename: string;
  path: string;
  uploadDate: string;
}

export const StreckenView: React.FC = () => {
  const { isAdmin } = useAuth();
  const [gpxFiles, setGpxFiles] = useState<GPXFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedGPX, setSelectedGPX] = useState<GPXFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadGPXFiles = async () => {
    try {
      const response = await fetch('/api/strecken', {
        credentials: 'include',
      });
      if (response.ok) {
        const files = await response.json();
        setGpxFiles(files);
      }
    } catch (error) {
      console.error('Error loading GPX files:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGPXFiles();
  }, []);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.gpx')) {
      alert('Bitte nur GPX-Dateien hochladen');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('gpx', file);

    try {
      const response = await fetch('/api/strecken/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        await loadGPXFiles();
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

  const handleDelete = async (filename: string) => {
    if (!confirm(`Möchten Sie "${filename}" wirklich löschen?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/strecken/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        if (selectedGPX?.filename === filename) {
          setSelectedGPX(null);
        }
        await loadGPXFiles();
      } else {
        const error = await response.json();
        alert(error.error || 'Fehler beim Löschen');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Fehler beim Löschen');
    }
  };

  const handleView = (file: GPXFile) => {
    setSelectedGPX(file);
  };

  const handleDownload = (file: GPXFile) => {
    const link = document.createElement('a');
    link.href = file.path;
    link.download = file.filename;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-display font-bold text-dark-bg flex items-center">
            <svg className="w-8 h-8 mr-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Strecken
          </h1>
          <p className="text-gray-600 mt-2">GPX-Dateien verwalten und anzeigen</p>
        </div>

        {isAdmin && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".gpx"
              onChange={handleUpload}
              className="hidden"
              id="gpx-upload"
            />
            <label
              htmlFor="gpx-upload"
              className={`gradient-dark text-white font-semibold py-3 px-6 rounded-xl inline-flex items-center space-x-3 cursor-pointer ${
                uploading ? 'opacity-50 cursor-not-allowed' : 'btn-hover shadow-card'
              }`}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>GPX hochladen</span>
                </>
              )}
            </label>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 text-dark-bg">Verfügbare Strecken</h2>
          
          {gpxFiles.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Keine GPX-Dateien vorhanden</p>
          ) : (
            <div className="space-y-3">
              {gpxFiles.map((file) => (
                <div
                  key={file.filename}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedGPX?.filename === file.filename
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-dark-bg">{file.filename}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(file.uploadDate).toLocaleDateString('de-DE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleView(file)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Anzeigen"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDownload(file)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Herunterladen"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(file.filename)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Löschen"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 text-dark-bg">Kartenansicht</h2>
          
          {selectedGPX ? (
            <div className="h-[600px] bg-gray-100 rounded-lg overflow-hidden">
              <iframe
                src={`/gpx-viewer.html?file=${encodeURIComponent(selectedGPX.path)}`}
                className="w-full h-full border-none"
                title={`GPX Viewer: ${selectedGPX.filename}`}
              />
            </div>
          ) : (
            <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Wählen Sie eine Strecke zum Anzeigen aus</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
