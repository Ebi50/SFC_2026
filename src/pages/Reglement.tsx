import { useEffect, useState } from "react";

export default function Reglement() {
  const [html, setHtml] = useState<string>("Lade …");

  useEffect(() => {
    fetch("/reglement.html").then(r => r.text()).then(setHtml);
  }, []);

  return (
    <div className="prose max-w-none p-4">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
