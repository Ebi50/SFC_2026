<!-- Skills: .claude/skills/ | Prompts: .claude/prompts/ -->

# SkinfitCup (SFC) – Projektregeln

## Projekt-Übersicht

**Website:** www.sfc-rsv.de (IMMER mit www!)  
**Zweck:** Registrierungs- und Verwaltungsplattform für das SkinfitCup Vereinstraining des RSV Stuttgart-Vaihingen  
**Tech-Stack:** Vite + React 19 (Frontend) · Express 5 + SQLite (Backend) · Railway.app (Hosting)  
**Repo:** `C:\Users\eberh\APPS\SFC_APP`

---

## Railway / Deployment (KRITISCH)

### Persistenter Speicher
- **Nur `/data/` überlebt Redeploys!** Alles andere wird bei jedem Deploy gelöscht.
- SQLite-Datenbank: `/data/database.sqlite3`
- GPX-Uploads: `/data/gpx/`
- Reglement-Uploads: `/data/reglement/`
- Plattform-Erkennung: `const isRailway = !!process.env.RAILWAY_ENVIRONMENT;`

### Pfad-Pattern (in jeder Route mit Dateizugriff)
```typescript
const DIR = isRailway ? '/data/[unterordner]' : path.join(__dirname, '../../public/[unterordner]');
```

### Region & DSGVO
- Region: **EU West (Amsterdam, Netherlands)** – Pflicht für DSGVO
- Personenbezogene Daten nur in SQLite unter `/data/`
- Keine externen Tracking-Dienste ohne Einwilligung

### Volume-Mount
```toml
# railway.toml
[[mounts]]
mountPath = "/data"
```

---

## Domain-Regeln

- **IMMER** `https://www.sfc-rsv.de/` verwenden (mit www!)
- Gilt für: Sitemap, Canonical-Tag, Open-Graph-Tags, robots.txt, Google Search Console
- CORS erlaubt beide Varianten (`sfc-rsv.de` und `www.sfc-rsv.de`)

---

## Code-Qualität

### Dateigrößen-Limits
| Status | Zeilen | Aktion |
|--------|--------|--------|
| OK | < 300 | Keine Aktion |
| Warnung | 300-449 | Beobachten |
| Aktion | 450-599 | Refactoring vorschlagen |
| Kritisch | ≥ 600 | Sofortiges Refactoring |

### Dead Code
Null-Toleranz: keine ungenutzten Imports, Variablen, auskommentierten Code-Blöcke.

### DRY-Prinzip
Wiederholte Logik (> 3 Zeilen) extrahieren:
- `server/services/` für Backend-Business-Logik
- Shared Components für Frontend-Elemente

### TypeScript
- Kein `any` ohne Begründung
- Types in `types.ts` definieren
- Path-Alias: `@/` → Projekt-Root

---

## Express-Server Regeln

### Route-Handler
- Max. 30 Zeilen pro Handler (sonst in Service extrahieren)
- Fehlerbehandlung: try/catch in jedem Handler
- Konsistente Responses: `{ error: string }` oder `{ success: true, data: ... }`

### Admin-Routen
- MÜSSEN `req.session?.isAdmin` prüfen
- Pattern:
```typescript
if (!req.session?.isAdmin) {
  return res.status(403).json({ error: 'Keine Berechtigung' });
}
```

### Static File Serving (Reihenfolge wichtig!)
1. `express.static()` für spezifische Pfade (`/gpx`, `/reglement`)
2. API-Routen (`/api/*`)
3. `express.static(distPath)` für Vite-Build
4. SPA-Fallback (MUSS am Ende stehen, NACH allem anderen)

### Uploads
- Multer für Datei-Uploads
- Speicherpfad: Railway → `/data/...`, Lokal → `public/...`
- Erlaubte Typen einschränken (GPX, PDF, DOCX)

---

## SQLite-Regeln

- Foreign Keys: `db.pragma('foreign_keys = ON');`
- Prepared Statements verwenden (SQL-Injection vermeiden!)
- Datenbankpfad: Production → `/data/database.sqlite3`, Dev → lokal
- Schema-Migrations: `CREATE TABLE IF NOT EXISTS` in `initDatabase()`
- Backup-Strategie: Volume auf Railway ist persistent, aber kein Backup

---

## Statische Dateien

### In `public/` (wird von Vite nach `dist/` kopiert)
- `robots.txt`, `sitemap.xml`, `manifest.json`
- `impressum.html`, `teilnahmeerklaerung.html`
- `logo.jpg`

### ACHTUNG: .gitignore
Die `.gitignore` schließt `*.png`, `*.pdf`, `*.gpx`, `*.jpg` aus!
- Ausnahme: `!public/logo.jpg`
- Neue statische Bilder/PDFs müssen mit `git add -f` erzwungen werden
- Oder die `.gitignore`-Regel anpassen

---

## Projekt-Architektur

```
SFC_APP/
├── components/           # React-Komponenten
│   ├── Dashboard.tsx     # Admin-Dashboard
│   ├── EventsList.tsx    # Event-Verwaltung
│   ├── Standings.tsx     # Gesamtwertung
│   ├── StreckenView.tsx  # GPX-Strecken
│   ├── ReglementView.tsx # Reglement-Anzeige
│   ├── ImpressumView.tsx # Impressum (Iframe)
│   └── ...
├── server/
│   ├── index.ts          # Express-Server (CORS, Session, Static, Routing)
│   ├── database.ts       # SQLite-Init + Schema
│   ├── routes/           # API-Routen
│   │   ├── auth.ts       # Admin-Login
│   │   ├── userAuth.ts   # User-Registrierung/Login
│   │   ├── participants.ts
│   │   ├── events.ts
│   │   ├── strecken.ts   # GPX-Upload/Download
│   │   ├── reglement.ts  # Reglement-Upload/Download
│   │   ├── settings.ts
│   │   ├── seasons.ts
│   │   └── home.ts
│   └── services/         # Business-Logik
├── src/pages/            # Seiten-Komponenten
├── public/               # Statische Dateien → dist/
├── index.html            # Vite Entry Point
├── App.tsx               # React App Root
├── vite.config.ts        # Vite-Konfiguration
├── railway.toml          # Railway Deploy-Config
└── types.ts              # TypeScript-Typen
```

---

## Workflow

1. Änderungen lokal in VS Code bearbeiten
2. `git add . && git commit -m "Beschreibung" && git push`
3. Railway deployed automatisch über GitHub-Integration
4. Prüfe Deploy-Logs im Railway Dashboard bei Problemen
