# SFC Website – Dokumentations-Audit & Erstellung

## Auftrag

Scanne die gesamte SFC-Codebase. Prüfe bestehende Dokumentation auf Aktualität. Erstelle fehlende Dokumentation. Ziel: Vollständige, aktuelle Projektdokumentation.

## Projektpfad

```
C:\Users\eberh\APPS\SFC_APP
```

---

## Phase 1: Bestandsaufnahme

### Alle Dokumentationsdateien finden

```bash
find . -name "*.md" -not -path "./node_modules/*" -not -path "./.git/*"
find . -name "*.html" -path "./public/*"
```

### Relevanz-Bewertung

Für jedes gefundene Dokument:

| Status | Bedeutung | Aktion |
|--------|-----------|--------|
| ✅ Aktuell | Inhalt stimmt mit Code überein | Keine |
| ⚠️ Veraltet | Teile stimmen nicht mehr | Aktualisieren |
| ❌ Fehlt | Kein Dokument vorhanden | Erstellen |
| 🗑️ Obsolet | Nicht mehr relevant | Löschen/Archivieren |

---

## Phase 2: Dokumentation erstellen/aktualisieren

### Benötigte Dokumente

| Dokument | Pfad | Priorität | Inhalt |
|----------|------|-----------|--------|
| README.md | Root | Hoch | Projekt-Übersicht, Setup, Deployment |
| API-Doku | docs/API.md | Hoch | Alle Express-Endpunkte |
| DB-Schema | docs/DATABASE_SCHEMA.md | Hoch | SQLite-Tabellen |
| Deployment | docs/DEPLOYMENT.md | Mittel | Railway, Volume, Region |
| Architektur | docs/ARCHITECTURE.md | Mittel | Frontend + Backend Aufbau |

### API-Dokumentation erstellen

Für jeden Router in `server/routes/`:
```bash
grep -n "router\.\(get\|post\|put\|delete\|patch\)" server/routes/*.ts
```

Template pro Endpunkt:
```markdown
### [METHOD] /api/[path]
**Auth:** Admin / User / Öffentlich
**Body:** { ... }
**Response:** { ... }
**Fehler:** 400/403/404/500
```

### Datenbank-Schema dokumentieren

```bash
grep -A 20 "CREATE TABLE" server/database.ts
```

### Komponenten-Übersicht

```bash
ls components/*.tsx | while read f; do echo "### $(basename $f)"; head -5 "$f"; echo; done
```

---

## Phase 3: Qualitätsprüfung

| Prüfpunkt | Beschreibung |
|-----------|--------------|
| Code ↔ Docs | Stimmen API-Endpunkte in Docs mit Code überein? |
| Impressum | Adresse, Kontakt, Datenschutz aktuell? |
| Teilnahmeerklärung | Rechtliche Texte aktuell? |
| README | Setup-Anleitung funktioniert? |

---

## Ausgabeformat

```markdown
## Dokumentations-Audit Report

### Zusammenfassung
- 📄 Vorhandene Docs: X
- ✅ Aktuell: Y
- ⚠️ Veraltet: Z
- ❌ Fehlend: W

### Status pro Dokument
| Dokument | Status | Aktion |
|----------|--------|--------|
| README.md | ⚠️ Veraltet | Setup-Anleitung aktualisieren |
| docs/API.md | ❌ Fehlt | Erstellen |

### Empfohlene Aktionen (priorisiert)
1. [Aktion]
2. [Aktion]

### Soll ich die fehlende Dokumentation erstellen?
```

---

*Erstellt: März 2026 – SkinfitCup*
