---
name: documentation-manager
description: Scannt das Projekt und pflegt eine zentrale Dokumentationsstruktur
---

# Documentation Manager (Dokumentations-Manager)

## Beschreibung

Der Documentation Manager scannt das SFC-Projekt, identifiziert undokumentierte Bereiche, erstellt fehlende Dokumentation und hält alle Docs synchron mit dem Code.

## Zentraler Dokumentationsordner

```
SFC_2026/
├── README.md                        # Projekt-Übersicht
├── docs/
│   ├── ARCHITECTURE.md              # System-Architektur (Frontend + Backend + Railway)
│   ├── API.md                       # Express API-Endpunkte (/api/*)
│   ├── SETUP.md                     # Entwickler-Setup (lokal + Railway)
│   ├── DEPLOYMENT.md                # Railway-Deployment, Volume, Region
│   ├── DATABASE_SCHEMA.md           # SQLite-Tabellen und Relationen
│   └── DSGVO.md                     # Datenschutz-Dokumentation
├── .claude/
│   ├── prompts/                     # Wiederverwendbare Prompts
│   └── skills/                      # Claude Code Skills
└── public/
    ├── impressum.html               # Rechtliche Seiten
    ├── teilnahmeerklaerung.html
    ├── robots.txt
    └── sitemap.xml
```

## Anweisungen

### 1. Projekt scannen

```bash
# Alle Markdown-Dateien finden
find . -name "*.md" -not -path "./node_modules/*"

# Alle Komponenten auflisten
ls -la components/

# Alle Server-Routen auflisten
ls -la server/routes/

# Alle API-Endpunkte identifizieren
grep -rn "router\.\(get\|post\|put\|delete\|patch\)" server/routes/
```

### 2. Dokumentationslücken identifizieren

| Bereich | Prüfung | Ziel-Dokument |
|---------|---------|---------------|
| API-Endpunkte | Alle `/api/*` Routen dokumentiert? | `docs/API.md` |
| Datenbank-Tabellen | Schema vollständig? | `docs/DATABASE_SCHEMA.md` |
| Komponenten | Zweck und Props beschrieben? | Inline-JSDoc |
| Railway-Konfiguration | Volume, Region, Deploy? | `docs/DEPLOYMENT.md` |
| Statische Dateien | Welche liegen in `public/`? | `docs/ARCHITECTURE.md` |
| DSGVO/Impressum | Vollständig und aktuell? | `public/impressum.html` |

### 3. Dokumentation erstellen

**API-Endpunkt Dokumentation:**
```markdown
### POST /api/participants
Erstellt einen neuen Teilnehmer.

**Auth:** Nicht erforderlich (öffentliche Registrierung)
**Body:** `{ firstName, lastName, email, birthYear, perfClass, gender }`
**Response:** `{ id, firstName, lastName, ... }`
```

**Datenbank-Schema Dokumentation:**
```markdown
### participants
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | TEXT PK | UUID |
| firstName | TEXT | Vorname |
| ...
```

### 4. Bei Code-Änderungen aktualisieren

- [ ] Neuer API-Endpunkt? → API.md aktualisieren
- [ ] Neue DB-Tabelle/Spalte? → DATABASE_SCHEMA.md aktualisieren
- [ ] Railway-Konfiguration geändert? → DEPLOYMENT.md aktualisieren
- [ ] Neue Komponente? → JSDoc hinzufügen
- [ ] Datenschutz-relevante Änderung? → impressum.html + DSGVO.md prüfen

## Ausgabeformat

```markdown
## Dokumentations-Report

### Zusammenfassung
- 📄 Dokumentierte Bereiche: X/Y
- ⚠️ Fehlende Dokumentation: Z
- 🔄 Veraltete Docs: W

### Dokumentationslücken
| Bereich | Status | Priorität |
|---------|--------|-----------|
| API /api/strecken | ❌ Keine Docs | Hoch |
| SQLite Schema | ⚠️ Unvollständig | Mittel |

### Empfohlene Aktionen
1. [Konkrete Aktion]

### Soll ich die fehlende Dokumentation erstellen?
```
