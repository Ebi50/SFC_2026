# SFC Website – Vollständiger Code-Audit

## Auftrag

Führe einen vollständigen Code-Audit der SkinfitCup-Website durch. Prüfe Code-Qualität, Sicherheit, Railway-Konfiguration, DSGVO-Konformität und SEO.

## Projektpfad

```
C:\Users\eberh\SFC_2026
```

---

## Audit-Bereiche

### 1. Railway & Deployment

| Prüfpunkt | Erwartung |
|-----------|-----------|
| `railway.toml` vorhanden | Volume-Mount `/data`, Health-Check, NIXPACKS |
| Region | EU West (Amsterdam) – DSGVO-Pflicht |
| Persistenter Speicher | Alle Uploads unter `/data/` |
| Plattform-Erkennung | `!!process.env.RAILWAY_ENVIRONMENT` |
| Datenbankpfad | Production: `/data/database.sqlite3` |

**Befehle:**
```bash
cat railway.toml
grep -rn "RAILWAY_ENVIRONMENT\|/data/" server/ --include="*.ts"
grep -rn "isRailway" server/ --include="*.ts"
```

### 2. Sicherheit

| Prüfpunkt | Erwartung |
|-----------|-----------|
| Admin-Routen geschützt | `req.session?.isAdmin` Prüfung |
| SQL-Injection | Nur Prepared Statements |
| Session-Secret | Aus Environment Variable |
| CORS | Nur erlaubte Origins |
| Upload-Validierung | Dateityp + Größenlimit |
| Passwort-Hashing | bcryptjs verwendet |

**Befehle:**
```bash
grep -rn "session?.isAdmin\|isAdmin" server/routes/ --include="*.ts"
grep -rn "db\.prepare\|db\.exec" server/ --include="*.ts"
grep -rn "SESSION_SECRET\|session.*secret" server/ --include="*.ts"
grep -rn "multer\|fileFilter\|limits" server/routes/ --include="*.ts"
grep -rn "bcrypt\|hash\|compare" server/ --include="*.ts"
```

### 3. Datei-Persistenz (HÄUFIGSTE FEHLERQUELLE)

| Prüfpunkt | Erwartung |
|-----------|-----------|
| GPX-Speicherpfad | Railway: `/data/gpx/`, Lokal: `public/gpx/` |
| Reglement-Speicherpfad | Railway: `/data/reglement/`, Lokal: `public/reglement/` |
| Statische Dateien in public/ | impressum.html, teilnahmeerklaerung.html, robots.txt, sitemap.xml |
| .gitignore | Prüfe ob wichtige Dateien ausgeschlossen sind |

**Befehle:**
```bash
grep -rn "GPX_DIR\|REGLEMENT_DIR\|UPLOAD_DIR" server/ --include="*.ts"
ls -la public/
cat .gitignore
find public/ -name "*.html" -o -name "*.xml" -o -name "*.txt" -o -name "*.json"
```

### 4. Express Static File Serving

| Prüfpunkt | Erwartung |
|-----------|-----------|
| Reihenfolge | Static → API-Routen → SPA-Fallback |
| SPA-Fallback | Am Ende, NACH static middleware |
| API 404 | `/api/*` gibt JSON-Error zurück, NICHT index.html |

**Befehle:**
```bash
grep -n "express.static\|sendFile\|app.use\|app.get" server/index.ts
```

### 5. SEO & Domain

| Prüfpunkt | Erwartung |
|-----------|-----------|
| Alle URLs mit www | `https://www.sfc-rsv.de/` überall |
| Canonical-Tag | `<link rel="canonical" href="https://www.sfc-rsv.de/">` |
| Sitemap | Alle Seiten enthalten, korrekte URLs |
| robots.txt | Erlaubt Crawling, Sitemap-Referenz |
| Meta-Tags | Title, Description, Open Graph |

**Befehle:**
```bash
grep -rn "sfc-rsv" public/ index.html --include="*.html" --include="*.xml" --include="*.txt"
# Prüfe ob überall www steht:
grep -rn "sfc-rsv" public/ index.html | grep -v "www\."
```

### 6. Code-Qualität

| Prüfpunkt | Erwartung |
|-----------|-----------|
| Dateigröße | Keine Datei > 450 Zeilen |
| Dead Code | Keine ungenutzten Imports/Variablen |
| Error Handling | try/catch in allen Route-Handlern |
| TypeScript | Keine `any` ohne Begründung |

**Befehle:**
```bash
find components server src -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -n | tail -20
```

---

## Ausgabeformat

```markdown
## SFC Code-Audit Report

### Zusammenfassung
- ✅ Bestanden: X
- ⚠️ Warnungen: Y  
- ❌ Kritisch: Z

### Findings

#### 🔴 KRITISCH
1. [Beschreibung + Datei + Zeile + Lösung]

#### 🟠 HOCH  
1. [...]

#### 🟡 MITTEL
1. [...]

#### 🟢 NIEDRIG
1. [...]

### Empfohlene Aktionen (priorisiert)
1. [Aktion] – Aufwand: [gering/mittel/hoch]
2. [...]
```

---

*Erstellt: März 2026 – SkinfitCup*
