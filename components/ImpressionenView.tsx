import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface HomeContent {
  images: string[];
}

export const ImpressionenView: React.FC = () => {
  const { isAdmin } = useAuth();
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const res = await fetch('/api/home/content', { credentials: 'include' });
      const data: HomeContent = await res.json();
      setImages(data.images || []);
    } catch {
      console.error('Error loading images');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
      }

      const uploadRes = await fetch('/api/home/upload-images', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (uploadData.filenames) {
        const newImages = [...images, ...uploadData.filenames];
        setImages(newImages);

        // Save updated images list
        const contentRes = await fetch('/api/home/content', { credentials: 'include' });
        const content = await contentRes.json();
        await fetch('/api/home/content', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...content, images: newImages }),
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm('Bild wirklich loeschen?')) return;

    try {
      await fetch(`/api/home/images/${filename}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const newImages = images.filter(img => img !== filename);
      setImages(newImages);

      // Save updated images list
      const contentRes = await fetch('/api/home/content', { credentials: 'include' });
      const content = await contentRes.json();
      await fetch('/api/home/content', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...content, images: newImages }),
      });

      if (selectedImage === filename) setSelectedImage(null);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Laden...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h1 className="text-3xl font-display font-bold text-dark-bg">Impressionen</h1>
        </div>

        {isAdmin && (
          <label className="gradient-dark text-white font-semibold py-3 px-5 rounded-xl flex items-center space-x-2 btn-hover shadow-card cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>{uploading ? 'Hochladen...' : 'Bilder hochladen'}</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      {images.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-12 text-center">
          <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 text-lg">Noch keine Bilder vorhanden</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img, idx) => (
            <div key={idx} className="relative group bg-white rounded-xl shadow-card overflow-hidden">
              <img
                src={`/api/home/images/${img}`}
                alt={`Impression ${idx + 1}`}
                className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setSelectedImage(img)}
              />
              {isAdmin && (
                <button
                  onClick={() => handleDelete(img)}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 text-4xl"
            onClick={() => setSelectedImage(null)}
          >
            &times;
          </button>
          <img
            src={`/api/home/images/${selectedImage}`}
            alt="Grossansicht"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
