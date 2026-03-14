import React from 'react';

export const ImpressumView: React.FC = () => {
  return (
    <div className="h-full">
      <div className="mb-6">
        <h1 className="text-4xl font-display font-bold text-dark-bg flex items-center">
          <svg className="w-8 h-8 mr-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Impressum
        </h1>
        <p className="text-gray-600 mt-2">Angaben gemäß § 5 DDG, Datenschutz & Haftungsausschluss</p>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        <iframe
          src="/impressum.html"
          className="w-full h-full"
          title="Impressum & Datenschutz"
          style={{ border: 'none' }}
        />
      </div>
    </div>
  );
};
