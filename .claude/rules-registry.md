# SFC Rules Registry – Zentrale Regelübersicht

**Stand:** März 2026  
**Projekt:** SkinfitCup (www.sfc-rsv.de)

---

## Regel-Quellen

| Quelle | Pfad | Beschreibung |
|--------|------|--------------|
| CLAUDE.md | Root | Hauptregeln |
| rules-guardian | .claude/skills/rules-guardian/ | Code-Qualität, Railway, DSGVO |
| settings-validator | .claude/skills/settings-validator/ | Konfigurationsprüfung |
| architecture-optimizer | .claude/skills/architecture-optimizer/ | Dateigrößen-Limits |

---

## Kritische Regeln (IMMER beachten)

### R1: Persistenter Speicher auf Railway
**Regel:** Alle Uploads und Datenbankdateien MÜSSEN unter `/data/` liegen.  
**Grund:** Railway löscht alles außer dem Volume bei jedem Deploy.  
**Pattern:**
```typescript
const DIR = isRailway ? '/data/[unterordner]' : path.join(__dirname, '../../public/[unterordner]');
```

### R2: Domain mit www
**Regel:** IMMER `https://www.sfc-rsv.de/` verwenden.  
**Betrifft:** Sitemap, Canonical, OG-Tags, robots.txt, CORS, Google Search Console.

### R3: Admin-Routen absichern
**Regel:** Jede schreibende Admin-Route MUSS `req.session?.isAdmin` prüfen.  
**Pattern:**
```typescript
if (!req.session?.isAdmin) {
  return res.status(403).json({ error: 'Keine Berechtigung' });
}
```

### R4: SQL-Injection vermeiden
**Regel:** NUR Prepared Statements verwenden. Niemals String-Konkatenation in SQL.  
**Pattern:** `db.prepare('SELECT * FROM x WHERE id = ?').get(id)`

### R5: DSGVO – EU-Region
**Regel:** Railway-Region MUSS EU West (Amsterdam) sein.  
**Prüfung:** Railway Dashboard → Service → Settings → Deploy → Region

### R6: Static File Serving Reihenfolge
**Regel:** In `server/index.ts` MUSS die Reihenfolge sein:
1. Spezifische Static-Pfade (`/gpx`, `/reglement`)
2. API-Routen (`/api/*`)
3. Generisches Static Serving (`dist/`)
4. SPA-Fallback (ganz am Ende)

### R7: .gitignore beachten
**Regel:** `*.png`, `*.pdf`, `*.gpx`, `*.jpg` sind ausgeschlossen.  
**Konsequenz:** Neue statische Dateien mit `git add -f` erzwingen.

---

## Code-Qualitäts-Regeln

| Regel | Schwellenwert | Aktion |
|-------|---------------|--------|
| Dateigröße | < 300 OK, 300-449 Warnung, ≥ 450 Refactoring | architecture-optimizer |
| Dead Code | 0 Toleranz | rules-guardian |
| DRY | Max 3 Zeilen Duplikation | rules-guardian |
| Error Handling | try/catch in jedem Handler | rules-guardian |
| TypeScript | Kein `any` ohne Begründung | rules-guardian |
| Route-Handler | Max 30 Zeilen | rules-guardian |
