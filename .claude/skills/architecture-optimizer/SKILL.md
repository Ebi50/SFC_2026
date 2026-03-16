---
name: architecture-optimizer
description: Überwacht Dateigrößen und führt automatisches Refactoring durch
---

# Architecture Optimizer (Architektur-Optimierer)

## Beschreibung

Der Architecture Optimizer überwacht die SFC-Codebase auf strukturelle Probleme, insbesondere zu große Dateien, und schlägt gezieltes Refactoring vor.

## Schwellenwerte

| Status | Zeilenanzahl | Aktion |
|--------|--------------|--------|
| OK | < 300 | Keine Aktion |
| Warnung | 300-449 | Beobachten, bei nächster Änderung prüfen |
| Aktion | 450-599 | Refactoring vorschlagen |
| Kritisch | ≥ 600 | Sofortiges Refactoring empfehlen |

## Anweisungen

### 1. Datei-Scan durchführen

Scanne alle TypeScript/JavaScript Dateien:
```bash
# Frontend-Komponenten nach Zeilenzahl sortiert
find components src -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -n

# Server-Dateien
find server -name "*.ts" | xargs wc -l | sort -n
```

### 2. Refactoring-Strategien

Bei Überschreitung wende diese Strategien an:

**Für React-Komponenten (`components/*.tsx`):**
- Extrahiere Subkomponenten in separate Dateien
- Verschiebe wiederverwendbare UI-Elemente nach `components/ui/`
- Trenne Logik von Darstellung (Custom Hooks extrahieren)

**Für Server-Routen (`server/routes/*.ts`):**
- Trenne Validierungslogik in eigene Middleware
- Extrahiere Business-Logik in `server/services/`
- Halte Route-Handler schlank (max. 30 Zeilen pro Handler)

**Für den Express-Server (`server/index.ts`):**
- Middleware in separate Datei auslagern
- Route-Registrierung kompakt halten
- Session- und CORS-Konfiguration in eigene Module

### 3. Refactoring-Plan erstellen

Für jede zu große Datei:
1. Analysiere die Struktur und identifiziere logische Blöcke
2. Bestimme welche Blöcke extrahiert werden können
3. Plane Imports/Exports für die neuen Dateien
4. Stelle sicher, dass die App weiterhin funktioniert

### 4. Refactoring durchführen

Nach User-Bestätigung:
1. Erstelle neue Dateien mit extrahiertem Code
2. Aktualisiere Imports in der Originaldatei
3. Aktualisiere Imports in abhängigen Dateien
4. Teste: Server starten + Frontend aufrufen

## Projekt-Architektur

```
SFC_2026/
├── components/          # React-Komponenten (Frontend)
│   ├── Dashboard.tsx    # Admin-Dashboard
│   ├── EventsList.tsx   # Event-Verwaltung
│   ├── StreckenView.tsx # Strecken/GPX-Verwaltung
│   ├── ReglementView.tsx # Reglement-Anzeige
│   └── ...
├── server/              # Express-Backend
│   ├── index.ts         # Server-Hauptdatei
│   ├── database.ts      # SQLite-Initialisierung
│   ├── routes/          # API-Routen
│   └── services/        # Business-Logik
├── src/pages/           # Seiten-Komponenten
├── public/              # Statische Dateien (Vite kopiert nach dist/)
└── index.html           # Vite Entry Point
```

## Workflow

1. **Scan**: Dateigrößen-Analyse durchführen
2. **Identifiziere**: Dateien über Schwellenwert
3. **Plane**: Refactoring-Strategie für jede Datei
4. **Präsentiere**: User mit Begründung informieren
5. **Bestätigung**: User-Zustimmung einholen
6. **Refactoring**: Änderungen durchführen
7. **Verifiziere**: Server starten und Frontend testen
