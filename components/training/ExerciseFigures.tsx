import React, { useState } from 'react';
import { TOPVIEW, figSrc } from '../../lib/training/exercises';

interface Props {
  id: string;
  name: string;
  /** im Timer: kleiner, ohne Zoom und Bildunterschrift */
  compact?: boolean;
}

export const ExerciseFigures: React.FC<Props> = ({ id, name, compact }) => {
  const [zoom, setZoom] = useState<0 | 1 | null>(null);
  const alt = (i: 0 | 1) => `${name}, ${i ? 'Endposition' : 'Ausgangsposition'}`;

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-2 w-full">
        {([0, 1] as const).map(i => (
          <img key={i} src={figSrc(id, i)} alt={alt(i)} className="w-full aspect-[4/3] object-contain rounded-lg bg-[#f7f5f0]" style={{ maxHeight: '30vh' }} />
        ))}
      </div>
    );
  }

  return (
    <figure className="m-0 flex flex-col gap-1">
      <div className="grid grid-cols-2 gap-2">
        {([0, 1] as const).map(i => (
          <button key={i} type="button" onClick={() => setZoom(i)} className="cursor-zoom-in rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" aria-label={`${alt(i)} vergrößern`}>
            <img src={figSrc(id, i)} alt={alt(i)} loading="lazy" className="w-full aspect-[4/3] object-contain rounded-lg bg-[#f7f5f0]" />
          </button>
        ))}
      </div>
      <figcaption className="text-xs text-gray-500">
        Skizze · {TOPVIEW.includes(id) ? 'Ansicht von oben · ' : ''}Links Ausgangsposition, rechts Endposition · Bewegung in Orange
      </figcaption>
      {zoom !== null && (
        <button type="button" onClick={() => setZoom(null)} className="fixed inset-0 z-[70] bg-black/85 flex items-center justify-center p-4 cursor-zoom-out" aria-label="Vergrößerung schließen">
          <img src={figSrc(id, zoom)} alt={alt(zoom)} className="max-h-[94vh] max-w-[96vw] object-contain rounded-lg bg-[#f7f5f0]" />
        </button>
      )}
    </figure>
  );
};
