---
name: frontend-backend-decision
description: Analysiert Funktionen und empfiehlt Frontend- oder Backend-Implementierung
---

# Frontend/Backend Decision (Frontend/Backend-Entscheider)

## Beschreibung

Der Frontend/Backend Decision Skill analysiert neue Funktionen und empfiehlt, ob diese im Frontend (React/Vite) oder Backend (Express/SQLite) implementiert werden sollten.

## Projekt-Kontext

### Frontend (Vite + React 19)
- **Location**: `components/`, `src/`, `App.tsx`, `index.tsx`
- **Runtime**: Browser (Client-Side)
- **Stärken**: Schnelle UI-Reaktion, SPA-Navigation, Formular-Interaktion

### Backend (Express + SQLite)
- **Location**: `server/`, `server/routes/`, `server/services/`
- **Runtime**: Node.js auf Railway
- **Stärken**: Datenpersistenz, Datei-Uploads, Admin-Authentifizierung, API

## Anweisungen

### Analysiere jede neue Funktion anhand dieser Kriterien:

#### Backend (Express) bevorzugen wenn:
| Kriterium | Grund | Beispiel |
|-----------|-------|---------|
| Datenpersistenz | SQLite-Zugriff nötig | Teilnehmer speichern/laden |
| Datei-Uploads | Multer + Dateisystem | GPX-Dateien, Reglement-PDFs |
| Admin-Operationen | Session-basierte Auth | Events erstellen/bearbeiten |
| Daten-Aggregation | SQL-Queries über Tabellen | Gesamtwertung berechnen |
| Sensible Logik | Nicht im Browser sichtbar | Punkte-Berechnung |
| E-Mail-Versand | Server-seitig | Benachrichtigungen |
| Daten-Export | PDF/CSV-Generierung | Ergebnis-Export |

#### Frontend (React) bevorzugen wenn:
| Kriterium | Grund | Beispiel |
|-----------|-------|---------|
| Schnelle Interaktion | Sofortiges UI-Feedback | Filter, Sortierung, Suche |
| Formular-Validierung | UX vor Submit | E-Mail-Format, Pflichtfelder |
| UI-State | Lokaler Zustand | Tabs, Modals, Toggles |
| Darstellungslogik | Reine Anzeige | Formatierung, Farben, Icons |
| Navigation | SPA-Routing | Seiten-Wechsel ohne Reload |
| Offline-Anzeige | Cached Daten | Letzte bekannte Ergebnisse |

#### Beides (Hybrid) wenn:
| Kriterium | Grund | Beispiel |
|-----------|-------|---------|
| Validierung + Sicherheit | Frontend für UX, Backend zur Absicherung | Registrierung |
| Suche/Filter | Frontend für schnelle UX, Backend für große Datenmengen | Teilnehmer-Liste |
| Datei-Preview | Frontend zeigt Vorschau, Backend speichert | GPX-Upload |

## Entscheidungs-Template

```markdown
## Funktionsanalyse: [Funktionsname]

### Beschreibung
[Was macht die Funktion]

### Anforderungen
- [ ] Datenbankzugriff nötig?
- [ ] Datei-Upload/Download?
- [ ] Admin-Berechtigung erforderlich?
- [ ] Sofortiges UI-Feedback nötig?
- [ ] Formular-Validierung?

### Empfehlung: [BACKEND / FRONTEND / HYBRID]

### Begründung
1. [Hauptgrund]
2. [Weiterer Grund]

### Implementierungshinweise
**Location**: `[Pfad zur Datei]`

### Deine Entscheidung?
Soll ich mit der [Backend/Frontend/Hybrid]-Implementierung fortfahren?
```

## Beispiele

### Beispiel 1: Teilnehmer-Registrierung → HYBRID

**Frontend** (`components/UserRegister.tsx`):
- Formular mit Validierung (Pflichtfelder, E-Mail-Format)
- Sofortiges Feedback bei Eingabefehlern
- Submit an API

**Backend** (`server/routes/userAuth.ts`):
- Daten in SQLite speichern
- Duplikat-Prüfung (E-Mail bereits registriert?)
- Passwort hashen (bcryptjs)

### Beispiel 2: Ergebnis-Tabelle sortieren → FRONTEND

**Frontend** (`components/Standings.tsx`):
- Sortierung nach Spalten (Name, Punkte, Platzierung)
- Filter nach Leistungsklasse
- Keine Datenbank-Interaktion nötig (Daten bereits geladen)

### Beispiel 3: GPX-Datei hochladen → BACKEND

**Backend** (`server/routes/strecken.ts`):
- Admin-Prüfung erforderlich
- Datei auf persistentem Volume speichern (`/data/gpx/`)
- Multer für Upload-Handling

### Beispiel 4: Event-Ergebnis PDF exportieren → BACKEND

**Backend** (`server/routes/events.ts`):
- SQL-Query für alle Ergebnisse eines Events
- PDF-Generierung mit jsPDF
- Download als Response
