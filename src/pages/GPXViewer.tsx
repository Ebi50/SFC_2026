import { useEffect, useRef } from "react";

type Props = { fileUrl: string };

export default function GPXViewer({ fileUrl }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: any;
    let gpxLayer: any;

    (async () => {
      // Dynamic imports to keep bundle small
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      const GPX: any = (await import("leaflet-gpx")).default;

      // Create map
      map = (L as any).map(ref.current!).setView([47.5, 11.0], 10);
      (L as any).tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      // Load GPX
      gpxLayer = new GPX(fileUrl, { async: true })
        .on("loaded", (e: any) => {
          map.fitBounds(e.target.getBounds());
        })
        .addTo(map);
    })();

    return () => {
      if (map) map.remove();
    };
  }, [fileUrl]);

  return <div ref={ref} style={{ height: 420, width: "100%" }} className="leaflet-container" />;
}
