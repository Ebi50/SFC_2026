# SkinfitCup – Verwaltungs- & Wertungsapp

Registrierungs- und Verwaltungsplattform für das SkinfitCup-Vereinstraining des RSV Stuttgart-Vaihingen.

**Live:** <https://www.sfc-rsv.de/>

## Features

- Teilnehmerverwaltung mit Leistungsklassen (A–D), RSV-Mitgliedschaft und Excel-Import
- Events (EZF, BZF, MZF, Handicap) mit Ergebniserfassung, DNF und Mannschaftswertung
- Automatische Punkteberechnung und saisonübergreifende Gesamtwertung
- GPX-Strecken, Reglement, Trainingsplan „Mobilitätsübungen“
- Benutzerkonten mit Login; Admin-Rechte über `ADMIN_EMAILS`
- E-Mail-Versand über Brevo

## Tech-Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express 5, SQLite (better-sqlite3)
- **Hosting:** Railway.app (EU West), persistentes Volume unter `/data`

## Lokale Entwicklung

Voraussetzungen: Node.js 20+, npm

```bash
npm install
cp .env.example .env   # Werte anpassen

# Terminal 1: Backend (Port 3001)
npm run server

# Terminal 2: Frontend (Port 5000)
npm run dev
```

App: <http://localhost:5000>

## Tests

```bash
npm test          # Unit-Tests (Vitest)
npm run test:e2e  # Playwright-E2E
npm run check     # Unit-Tests + Build + E2E – vor jedem Push grün
```

## Deployment

Railway deployt automatisch bei jedem Push auf `master` (GitHub-Integration).
Konfiguration: [railway.toml](./railway.toml), [nixpacks.toml](./nixpacks.toml).

- Nur `/data/` überlebt Redeploys: SQLite-Datenbank (`/data/database.sqlite3`), GPX- und Reglement-Uploads
- Umgebungsvariablen werden im Railway-Dashboard gesetzt, siehe [.env.example](./.env.example)
- Tägliches Datenbank-Backup per GitHub Action in ein privates Repo ([backup.yml](./.github/workflows/backup.yml))

Logs: Railway-Dashboard oder `railway logs`

## Lizenz

Dieses Projekt ist privat und nicht zur öffentlichen Verwendung lizenziert.
