import { useEffect, useState } from "react";
import GPXViewer from "./GPXViewer";

type Strecke = { id: string; name: string; file: string; desc?: string };

export default function Strecken() {
  const [items, setItems] = useState<Strecke[]>([]);
  const [selected, setSelected] = useState<Strecke | null>(null);

  useEffect(() => {
    fetch("/strecken.json").then(r => r.json()).then((data) => {
      setItems(data);
      if (data.length) setSelected(data[0]);
    });
  }, []);

  return (
    <div className="grid md:grid-cols-3 gap-4 p-4">
      <div className="md:col-span-1 space-y-2">
        {items.map(s => (
          <div key={s.id} className="border rounded p-3 flex items-center justify-between gap-2">
            <button onClick={() => setSelected(s)} title="Strecke ansehen" className="text-left flex-1 underline">
              {s.name}
            </button>
            <a href={s.file} download title="GPX herunterladen">⬇️</a>
          </div>
        ))}
      </div>
      <div className="md:col-span-2">
        {selected ? (
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">{selected.name}</h2>
            {selected.desc && <p className="text-sm opacity-80">{selected.desc}</p>}
            <GPXViewer fileUrl={selected.file} />
          </div>
        ) : (
          <p>Bitte eine Strecke auswählen.</p>
        )}
      </div>
    </div>
  );
}
