# SFC Website – Diagnose: Fehlende Dokumente, Bilder & Strecken

**Datum:** 16. März 2026  
**Problem:** Reglement, Bilder und Strecken-Informationen sind auf www.sfc-rsv.de nicht mehr sichtbar (getestet von verschiedenen Rechnern mit Chrome).  
**Tech-Stack:** Vite + React (Frontend) · Express.js + SQLite (Backend) · Railway.app (Hosting)  
**Repo:** `C:\Users\eberh\SFC_2026`

---

## Übersicht: Mögliche Ursachen (Priorisiert)

| # | Ursache | Wahrscheinlichkeit | Aufwand zur Prüfung |
|---|---------|---------------------|---------------------|
| 1 | Dateien liegen außerhalb des persistenten Volumes | **HOCH** | Mittel |
| 2 | Neues Deploy hat ephemere Dateien gelöscht | **HOCH** | Gering |
| 3 | Express-Server liefert statische Dateien nicht korrekt aus | Mittel | Mittel |
| 4 | React-Routing fängt Pfade ab, bevor sie zum Server kommen | Mittel | Gering |
| 5 | Regionswechsel hat Volume-Migration ausgelöst | Gering | Gering |
| 6 | SQLite-Referenzen zeigen auf nicht mehr existierende Dateien | Mittel | Mittel |
| 7 | Vite-Build schließt bestimmte Dateien nicht ein | Mittel | Gering |

---

## 1. Ephemerer vs. Persistenter Speicher (HÄUFIGSTE URSACHE)

### Das Problem
Railway löscht bei jedem Deploy **alles außerhalb des persistenten Volumes** (`/data/`). Wenn Dateien (PDFs, Bilder, HTML) im Build-Output (`dist/`) oder an einem anderen Ort als `/data/` gespeichert werden, verschwinden sie nach dem nächsten Deploy.

### Was zu prüfen ist

**A) Wo werden hochgeladene Dateien gespeichert?**

Datei prüfen: `server/index.ts` (oder `server/database.ts`)

Suche nach:
- `multer` oder einem anderen Upload-Middleware-Konfiguration
- Pfaden wie `uploads/`, `public/uploads/`, `dist/`, `./data/uploads/`
- Jeder Stelle, an der `req.file` oder `req.files` verarbeitet wird

```
FRAGE: Wird der Upload-Pfad relativ (z.B. ./uploads/) oder absolut (z.B. /data/uploads/) angegeben?
→ Relativ = Dateien landen im App-Verzeichnis = werden bei Redeploy gelöscht!
→ /data/... = Persistentes Volume = überlebt Redeploys ✓
```

**B) Wo werden die statischen Dateien (Reglement-PDF, Strecken-Bilder) referenziert?**

Suche im gesamten Projekt nach:
```bash
# Im Repo-Verzeichnis ausführen:
grep -rn "reglement" src/ server/ public/ --include="*.ts" --include="*.tsx" --include="*.html"
grep -rn "strecken" src/ server/ public/ --include="*.ts" --include="*.tsx" --include="*.html"
grep -rn "upload" server/ --include="*.ts"
grep -rn "multer\|formidable\|busboy" server/ --include="*.ts"
grep -rn "express.static" server/ --include="*.ts"
```

### Lösung (falls dies die Ursache ist)
- Alle nutzergenerierten Dateien (Uploads) müssen unter `/data/` auf Railway gespeichert werden
- Express muss `/data/uploads/` als statisches Verzeichnis einbinden:
  ```ts
  app.use('/uploads', express.static('/data/uploads'));
  ```

---

## 2. Vite-Build und statische Dateien im `public/`-Ordner

### Das Problem
Dateien im `public/`-Ordner werden von Vite 1:1 in den `dist/`-Ordner kopiert. Aber: Wenn Dateien **nach dem Build** manuell in `public/` oder `dist/` auf dem Server abgelegt wurden, überschreibt der nächste Build/Deploy diese.

### Was zu prüfen ist

**A) Liegen Reglement-PDF, Strecken-Bilder etc. im `public/`-Ordner des Repos?**

```bash
# Prüfe den public-Ordner:
ls -la public/
# Gibt es Unterordner für Dokumente/Bilder?
find public/ -name "*.pdf" -o -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.webp"
```

**B) Oder werden diese Dateien dynamisch vom Server generiert/verwaltet?**

Suche in den React-Komponenten:
```bash
grep -rn "StreckenView\|ReglementView\|Strecken\|Reglement" src/ --include="*.tsx" --include="*.ts"
```

**Prüfe, ob die Komponenten Dateien vom Server laden (API-Call) oder statische Pfade verwenden:**
- `/api/strecken` oder `/api/reglement` → Daten kommen vom Backend/Datenbank
- `/reglement.pdf` oder `/images/strecke1.jpg` → Statische Dateien im public/-Ordner nötig

### Lösung
- Alle statischen Dokumente (PDFs, Bilder) ins `public/`-Verzeichnis im Git-Repo legen
- Commit + Push → automatisches Deploy über Railway
- ODER: Dateien in `/data/` auf Railway speichern und per Express-Route ausliefern

---

## 3. Express Static File Serving

### Das Problem
Der Express-Server muss so konfiguriert sein, dass er:
1. Den Vite-Build-Output (`dist/`) als statische Dateien ausliefert
2. Zusätzlich eventuelle Upload-Verzeichnisse (`/data/uploads/`) bedient
3. Für SPA-Routing ein Fallback auf `index.html` hat (aber **nicht** für echte Datei-Pfade)

### Was zu prüfen ist

In `server/index.ts`:
```bash
grep -n "express.static\|sendFile\|res.download\|res.sendFile" server/index.ts
```

Typische korrekte Konfiguration:
```ts
// 1. Statische Dateien aus dem Build-Ordner
app.use(express.static(path.join(__dirname, '../dist')));

// 2. Uploads aus dem persistenten Volume (falls vorhanden)
app.use('/uploads', express.static('/data/uploads'));

// 3. SPA-Fallback (MUSS am Ende stehen, NACH allen API-Routen und Static-Middlewares)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});
```

**ACHTUNG:** Wenn der SPA-Fallback (`app.get('*', ...)`) **vor** dem Static-Middleware steht, werden echte Dateien (PDFs, Bilder) nie ausgeliefert, weil immer `index.html` zurückgegeben wird!

### Schnelltest
Rufe direkt im Browser auf:
- `https://www.sfc-rsv.de/robots.txt` → Sollte den robots.txt-Inhalt zeigen
- `https://www.sfc-rsv.de/sitemap.xml` → Sollte die Sitemap zeigen
- `https://www.sfc-rsv.de/impressum.html` → Sollte das Impressum zeigen

Wenn diese Dateien funktionieren, liegt das Problem nicht am Static-File-Serving generell, sondern spezifisch an den fehlenden Dateien.

---

## 4. React-Routing und Iframe-Einbindung

### Das Problem
Einige Dokumente (z.B. Impressum) werden per `<iframe>` in React-Komponenten eingebunden. Wenn der Pfad im Iframe nicht korrekt aufgelöst wird oder der Server die HTML-Datei nicht findet, bleibt der Iframe leer.

### Was zu prüfen ist

```bash
grep -rn "iframe\|<iframe" src/ --include="*.tsx" --include="*.ts"
```

Prüfe den `src`-Pfad des Iframes:
- `src="/impressum.html"` → Muss in `public/impressum.html` existieren
- `src="/reglement.html"` → Muss in `public/reglement.html` existieren

### Lösung
- Sicherstellen, dass alle referenzierten HTML-Dateien im `public/`-Ordner des Repos liegen
- Diese Dateien im Git-Repo committen (nicht in .gitignore!)

---

## 5. .gitignore prüfen

### Das Problem
Möglicherweise sind Bild- oder PDF-Dateien versehentlich in `.gitignore` aufgenommen. Dann werden sie nicht ins Repo gepusht und fehlen beim Deploy.

### Was zu prüfen ist

```bash
cat .gitignore
```

Achte auf Einträge wie:
- `*.pdf`
- `*.png` / `*.jpg`
- `public/uploads/`
- `public/images/`
- `dist/`

### Lösung
- Benötigte Dateien/Ordner aus `.gitignore` entfernen
- Mit `git add -f datei.pdf` erzwingen, falls nötig

---

## 6. SQLite-Datenbank: Referenzen auf fehlende Dateien

### Das Problem
Wenn Strecken-Daten oder Reglement-Informationen in der SQLite-Datenbank gespeichert sind und diese auf Dateipfade verweisen, die nicht mehr existieren, werden leere oder fehlerhafte Inhalte angezeigt.

### Was zu prüfen ist

```bash
# Datenbankschema anschauen:
grep -rn "CREATE TABLE\|strecken\|route\|image\|file\|document\|pdf" server/ --include="*.ts"
```

Prüfe:
- Welche Tabellen existieren?
- Gibt es Spalten wie `image_path`, `file_url`, `document_path`?
- Zeigen diese Pfade auf existierende Dateien?

### Via Railway CLI oder Dashboard prüfen
Wenn möglich, in die Railway-Shell einloggen und prüfen:
```bash
# Prüfe ob das Volume korrekt gemountet ist
ls -la /data/

# Prüfe ob die SQLite-Datenbank existiert und Daten hat
sqlite3 /data/sfc.db ".tables"
sqlite3 /data/sfc.db "SELECT * FROM strecken LIMIT 5;"  # (Tabellenname anpassen)
```

---

## 7. Regionswechsel / Volume-Migration

### Das Problem
Wenn kürzlich die Railway-Region geändert wurde (z.B. von US-West auf EU-West), muss das Volume migriert werden. Während/nach der Migration könnten Dateien fehlen.

### Was zu prüfen ist
- Im Railway Dashboard: Service → Settings → Deploy → Region → Wurde kürzlich gewechselt?
- Im Railway Dashboard: Service → Volumes → Ist das Volume aktiv und korrekt gemountet?
- Prüfe die Deploy-Logs auf Fehler bezüglich Volume-Migration

---

## Diagnose-Checkliste zum Abhaken

```
[ ] 1. Schnelltest: robots.txt und sitemap.xml im Browser aufrufen
[ ] 2. Schnelltest: impressum.html direkt im Browser aufrufen
[ ] 3. public/-Ordner im Repo prüfen: Welche Dateien sind vorhanden?
[ ] 4. .gitignore prüfen: Werden relevante Dateien ausgeschlossen?
[ ] 5. server/index.ts prüfen: express.static Konfiguration
[ ] 6. server/index.ts prüfen: Reihenfolge von Static-Middleware vs. SPA-Fallback
[ ] 7. React-Komponenten prüfen: Wie laden StreckenView/ReglementView die Daten?
[ ] 8. Upload-Konfiguration prüfen: Wo werden Dateien gespeichert?
[ ] 9. Railway Dashboard: Volume-Status und Mount-Punkt prüfen
[ ] 10. Railway Deploy-Logs auf Fehler prüfen
```

---

## Nächste Schritte

1. **Öffne VS Code** mit dem Repo `C:\Users\eberh\SFC_2026`
2. Gehe die Checkliste oben durch und notiere die Ergebnisse
3. Teile mir die Ergebnisse der `grep`-Befehle und den Inhalt von `server/index.ts` mit
4. Dann kann ich die genaue Ursache identifizieren und eine Lösung erstellen

---

*Erstellt am 16.03.2026 – SkinfitCup Diagnose*
