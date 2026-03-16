---
name: settings-validator
description: Überprüft Projekteinstellungen gegen Best Practices für Vite+Express+Railway
---

# Settings Validator (Einstellungs-Prüfer)

## Beschreibung

Der Settings Validator scannt alle Konfigurationsdateien des SFC-Projekts und prüft sie gegen aktuelle Best Practices für Vite + Express + Railway Deployments.

## Zu prüfende Konfigurationsdateien

| Datei | Inhalt |
|-------|--------|
| `tsconfig.json` | TypeScript Compiler-Optionen |
| `package.json` | Dependencies und Scripts |
| `vite.config.ts` | Vite Dev-Server und Build |
| `railway.toml` | Railway Deployment-Konfiguration |
| `.env.production` | Production Environment Variables |
| `.gitignore` | Ausgeschlossene Dateien |
| `public/robots.txt` | SEO-Konfiguration |
| `public/sitemap.xml` | Sitemap für Google |
| `index.html` | Meta-Tags, SEO, Open Graph |
| `nixpacks.toml` | Build-Konfiguration (falls vorhanden) |

## Anweisungen

### Prüf-Checkliste

#### TypeScript (`tsconfig.json`)
- [ ] Target mindestens ES2022?
- [ ] `"jsx": "react-jsx"` konfiguriert?
- [ ] Path Aliases korrekt (`@/` → `./*`)?
- [ ] `"skipLibCheck": true` für Performance?

#### Dependencies (`package.json`)
- [ ] Keine veralteten Major-Versionen?
- [ ] `"type": "module"` gesetzt (ESM)?
- [ ] `"engines": { "node": ">=20" }` definiert?
- [ ] Scripts vollständig: dev, build, start, server?
- [ ] Keine unnötigen Dependencies?

#### Vite (`vite.config.ts`)
- [ ] Proxy für `/api` korrekt auf Backend (Port 3001)?
- [ ] React-Plugin aktiviert?
- [ ] Path-Alias `@/` konsistent mit tsconfig?

#### Railway (`railway.toml`)
- [ ] Builder: NIXPACKS?
- [ ] startCommand: `npm start`?
- [ ] healthcheckPath: `/api/health`?
- [ ] Volume Mount: `/data`?
- [ ] Region: EU West (Amsterdam) für DSGVO?

#### SEO / Meta-Tags (`index.html`)
- [ ] Title aussagekräftig?
- [ ] Meta-Description vorhanden?
- [ ] Canonical-Link mit `www.sfc-rsv.de`?
- [ ] Open-Graph-Tags vollständig?
- [ ] Google Search Console Verification Tag?

#### Sitemap / robots.txt
- [ ] Alle URLs mit `https://www.sfc-rsv.de/` (mit www!)?
- [ ] Alle wichtigen Seiten enthalten?
- [ ] `lastmod`-Daten aktuell?
- [ ] robots.txt erlaubt Crawling?
- [ ] Sitemap-Referenz in robots.txt?

#### .gitignore
- [ ] `node_modules/` ausgeschlossen?
- [ ] `dist/` ausgeschlossen?
- [ ] `*.db` / `*.sqlite3` ausgeschlossen?
- [ ] `.env.local` ausgeschlossen?
- [ ] ACHTUNG: `*.png`, `*.pdf`, `*.gpx` sind ausgeschlossen!
  - → Statische Bilder/PDFs in `public/` müssen ggf. mit `git add -f` erzwungen werden
  - → Oder aus `.gitignore` entfernen falls sie im Repo sein sollen

#### Express-Server (`server/index.ts`)
- [ ] CORS korrekt konfiguriert (www + non-www)?
- [ ] Session-Secret aus Environment Variable?
- [ ] Trust Proxy aktiviert (`app.set('trust proxy', 1)`)?
- [ ] Static File Serving für `dist/` in Production?
- [ ] SPA-Fallback nach API-Routen und Static-Middleware?
- [ ] Health-Check Endpoint vorhanden?

### Workflow

1. **Scan**: Alle Konfigurationsdateien einlesen
2. **Prüfen**: Gegen Checkliste validieren
3. **Vergleichen**: Mit Best Practices abgleichen
4. **Dokumentieren**: Abweichungen auflisten
5. **Vorschlagen**: Korrekturvorschläge machen
6. **Bestätigen**: User-Zustimmung einholen

## Prüf-Ausgabe

```markdown
## Settings Validator Report

### Zusammenfassung
- ✅ Geprüfte Dateien: X
- ⚠️ Warnungen: Y
- ❌ Kritische Probleme: Z

### Railway-Konfiguration
| Einstellung | Aktuell | Empfohlen | Status |
|-------------|---------|-----------|--------|
| Region | EU West | EU West | ✅ |
| Volume | /data | /data | ✅ |
| Health Check | /api/health | /api/health | ✅ |

### SEO-Status
| Element | Vorhanden | Korrekt (www) | Status |
|---------|-----------|---------------|--------|
| Canonical | Ja | Ja | ✅ |
| Sitemap | Ja | Ja | ✅ |
| Meta-Desc | Ja | - | ✅ |

### Empfohlene Änderungen
1. [Änderung mit Begründung]

### Soll ich diese Änderungen durchführen?
```

## Automatische Prüfungen

```bash
# Dependency-Check
npm outdated

# TypeScript-Check (falls konfiguriert)
npx tsc --noEmit

# Prüfe ob wichtige Dateien in public/ vorhanden sind
ls -la public/robots.txt public/sitemap.xml public/impressum.html

# Prüfe Railway-Volume (nur auf Railway)
ls -la /data/
```
