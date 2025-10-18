import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface HomeContent {
  id: string;
  title: string;
  description: string;
  pdfFile?: string;
  images: string[];
  uploadDate: string;
}

interface HomeViewProps {
  onManageContent: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onManageContent }) => {
  const { isAdmin } = useAuth();
  const [content, setContent] = useState<HomeContent | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {content ? (
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-primary to-primary-dark text-white rounded-3xl shadow-card p-12 text-center">
            <h1 className="text-5xl font-display font-bold mb-6">
              {content.title}
            </h1>
            <div className="prose prose-lg prose-invert mx-auto">
              {content.description.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4 text-lg">{paragraph}</p>
              ))}
            </div>
          </div>

          {/* PDF Download */}
          {content.pdfFile && (
            <div className="bg-white rounded-2xl shadow-card p-8 text-center">
              <h3 className="text-2xl font-display font-bold text-secondary mb-4">
                Weitere Informationen
              </h3>
              <a
                href={`/api/home/pdfs/${content.pdfFile}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg inline-flex items-center space-x-2 transition-transform transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>PDF herunterladen</span>
              </a>
            </div>
          )}

          {/* Images */}
          <div className="bg-white rounded-2xl shadow-card p-8">
            <h3 className="text-2xl font-display font-bold text-secondary mb-6">
              Impressionen
            </h3>
            {content.images && content.images.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {content.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={`/api/home/images/${image}`}
                      alt={`Skinfit Cup Impression ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>Noch keine Bilder verfügbar</p>
              </div>
            )}
          </div>

          {/* Admin Button */}
          {isAdmin && (
            <div className="text-center">
              <button
                onClick={onManageContent}
                className="bg-secondary hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg inline-flex items-center space-x-2 transition-transform transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Inhalte verwalten</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Noch keine Inhalte verfügbar</h3>
          <p className="text-gray-600">
            {isAdmin ? 'Als Administrator können Sie Inhalte über "Inhalte verwalten" hinzufügen.' : 'Der Administrator hat noch keine Inhalte hochgeladen.'}
          </p>
          {isAdmin && (
            <div className="mt-6">
              <button
                onClick={onManageContent}
                className="bg-secondary hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg inline-flex items-center space-x-2 transition-transform transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Inhalte verwalten</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};