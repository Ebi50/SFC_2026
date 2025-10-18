import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

interface HomeContent {
  id: string;
  title: string;
  description: string;
  pdfFile?: string;
  images: string[];
  uploadDate: string;
}

interface HomeContentManagerProps {
  onClose: () => void;
}

export const HomeContentManager: React.FC<HomeContentManagerProps> = ({ onClose }) => {
  const { isAdmin } = useAuth();
  const [content, setContent] = useState<HomeContent>({
    id: '',
    title: 'Skinfit Cup 2025',
    description: 'Herzlich willkommen zum Skinfit Cup! Hier finden Sie alle wichtigen Informationen zu unserem Radsport-Event.',
    images: [],
    uploadDate: new Date().toISOString()
  });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const loadContent = async () => {
    try {
      const response = await fetch('/api/home/content', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setContent(data);
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  const handleSave = async () => {
    if (!isAdmin) {
      alert('Sie benötigen Admin-Rechte für diese Aktion');
      return;
    }

    if (!content.title || !content.description) {
      alert('Bitte füllen Sie Titel und Beschreibung aus');
      return;
    }

    setUploading(true);
    try {
      const saveData = {
        title: content.title,
        description: content.description,
        pdfFile: content.pdfFile || null,
        images: content.images || []
      };

      console.log('Sending save data:', saveData);

      const response = await fetch('/api/home/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(saveData),
      });

      const responseText = await response.text();
      console.log('Save response:', response.status, responseText);

      if (response.ok) {
        alert('Inhalte erfolgreich gespeichert!');
        onClose();
      } else {
        let errorMessage;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || 'Unbekannter Fehler';
        } catch {
          errorMessage = `Server-Fehler: ${response.status}`;
        }
        alert(`Fehler beim Speichern: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Netzwerk-Fehler beim Speichern der Inhalte');
    } finally {
      setUploading(false);
    }
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf')) {
      alert('Bitte nur PDF-Dateien hochladen');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await fetch('/api/home/upload-pdf', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setContent(prev => ({ ...prev, pdfFile: result.filename }));
        alert('PDF erfolgreich hochgeladen!');
      } else {
        const error = await response.json();
        alert(error.error || 'Fehler beim Hochladen');
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      alert('Fehler beim Hochladen der PDF');
    } finally {
      setUploading(false);
      if (pdfInputRef.current) {
        pdfInputRef.current.value = '';
      }
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setUploading(true);
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        formData.append('images', file);
      }
    }

    try {
      const response = await fetch('/api/home/upload-images', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setContent(prev => ({ 
          ...prev, 
          images: [...prev.images, ...result.filenames] 
        }));
        alert(`${result.filenames.length} Bild(er) erfolgreich hochgeladen!`);
      } else {
        const error = await response.json();
        alert(error.error || 'Fehler beim Hochladen');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Fehler beim Hochladen der Bilder');
    } finally {
      setUploading(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const removeImage = async (imageFilename: string) => {
    if (!confirm('Möchten Sie dieses Bild wirklich löschen?')) return;

    setUploading(true);
    try {
      console.log('Deleting image:', imageFilename);
      
      const response = await fetch(`/api/home/images/${imageFilename}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const responseText = await response.text();
      console.log('Delete response:', response.status, responseText);

      if (response.ok) {
        setContent(prev => ({
          ...prev,
          images: prev.images.filter(img => img !== imageFilename)
        }));
        alert('Bild erfolgreich gelöscht!');
      } else {
        let errorMessage;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || 'Unbekannter Fehler';
        } catch {
          errorMessage = `Server-Fehler: ${response.status}`;
        }
        alert(`Fehler beim Löschen: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Netzwerk-Fehler beim Löschen des Bildes');
    } finally {
      setUploading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Zugriff verweigert</h2>
          <p className="text-gray-600 mb-6">Sie benötigen Admin-Rechte für diese Funktion.</p>
          <button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
            Schließen
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Inhalte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-secondary">Startseiten-Inhalte verwalten</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Titel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Titel</label>
              <input
                type="text"
                value={content.title}
                onChange={(e) => setContent(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Titel der Startseite"
              />
            </div>

            {/* Beschreibung */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung</label>
              <textarea
                value={content.description}
                onChange={(e) => setContent(prev => ({ ...prev, description: e.target.value }))}
                rows={6}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Beschreibungstext für die Startseite (Absätze durch Zeilenumbruch trennen)"
              />
            </div>

            {/* PDF Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PDF-Dokument</label>
              <div className="flex items-center space-x-4">
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  className="hidden"
                />
                <button
                  onClick={() => pdfInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
                >
                  PDF hochladen
                </button>
                {content.pdfFile && (
                  <span className="text-green-600 font-medium">✓ {content.pdfFile}</span>
                )}
              </div>
            </div>

            {/* Bilder Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bilder</label>
              <div className="mb-4">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
                >
                  Bilder hochladen
                </button>
              </div>

              {/* Vorhandene Bilder */}
              {content.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {content.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={`/api/home/images/${image}`}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(image)}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
            <button
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={uploading}
              className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50"
            >
              {uploading ? 'Speichere...' : 'Speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};