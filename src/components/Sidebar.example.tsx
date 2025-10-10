// Beispiel-Sidebar: Bitte mit deiner bestehenden Sidebar mergen.
import { Link } from "react-router-dom";

export default function SidebarExample() {
  return (
    <aside className="w-60 border-r p-3">
      <nav className="space-y-2">
        {/* Dashboard entfernt – ggf. Redirect auf /reglement */}
        <Section title="Informationen">
          <NavItem to="/reglement" label="Reglement" />
          <NavItem to="/events" label="Events" />
          <NavItem to="/strecken" label="Strecken" />
        </Section>
      </nav>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase opacity-70 mb-1">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="block px-2 py-1 rounded hover:bg-gray-100">
      {label}
    </Link>
  );
}
