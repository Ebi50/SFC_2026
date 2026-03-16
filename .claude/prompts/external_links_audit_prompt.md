# SFC Website – Externe Links Prüfung

## Auftrag

Prüfe ALLE externen Links (URLs) in sämtlichen Dateien der SFC-Website auf Erreichbarkeit. Aktualisiere nicht mehr funktionierende Links. Erstelle einen Bericht.

## Projektpfad

```
C:\Users\eberh\SFC_2026
```

---

## Scope der Analyse

### Zu durchsuchende Dateien

| Dateityp | Verzeichnisse | Priorität |
|----------|---------------|-----------|
| `.html` | `public/`, Root | Hoch |
| `.tsx` | `components/`, `src/` | Hoch |
| `.ts` | `server/`, Root | Mittel |
| `.md` | Root, `.claude/` | Mittel |
| `.xml` | `public/` | Mittel |
| `.json` | Root, `public/` | Niedrig |

### NICHT durchsuchen
- `node_modules/`, `.git/`, `dist/`

---

## Vorgehen

### Phase 1: Link-Extraktion

```bash
# Alle URLs in relevanten Dateien finden
grep -rn "https\?://[^ \"'<>)\]]*" \
  components/ src/ server/ public/ *.html *.md *.json \
  --include="*.ts" --include="*.tsx" --include="*.html" \
  --include="*.md" --include="*.xml" --include="*.json" \
  | grep -v "node_modules" | grep -v "localhost" | sort -u
```

### Phase 2: Kategorisierung

| Kategorie | Beispiele | Prüfmethode |
|-----------|-----------|-------------|
| Eigene Domain | www.sfc-rsv.de | Browser-Test |
| RSV-Verein | rsv-vaihingen.de | HTTP-Check |
| CDN/Fonts | fonts.googleapis.com | HTTP-Check |
| Externe Dienste | railway.app, github.com | HTTP-Check |

### Phase 3: Link-Test

Für jeden gefundenen Link:
1. HTTP GET Request
2. Status-Code prüfen (200 = OK, 301/302 = Redirect, 404 = Broken)
3. Bei Redirect: Ziel prüfen

### Phase 4: Besondere Prüfungen für SFC

| Prüfpunkt | Was |
|-----------|-----|
| RSV-Vaihingen Links | rsv-vaihingen.de (Verein) noch erreichbar? |
| Google Fonts | Werden die Fonts geladen? |
| Impressum-Links | Alle Kontakt-Links korrekt? |
| Teilnahmeerklärung | Links zum Verein korrekt? |
| Sitemap-URLs | Alle URLs in sitemap.xml erreichbar? |

---

## Ausgabeformat

```markdown
## External Links Report – SFC

### Zusammenfassung
- ✅ Funktionierende Links: X
- ⚠️ Redirects: Y
- ❌ Defekte Links: Z

### Defekte Links
| Datei | Zeile | URL | Status | Empfehlung |
|-------|-------|-----|--------|------------|
| public/impressum.html | 42 | https://... | 404 | Aktualisieren auf ... |

### Redirects
| Datei | URL | Redirect zu | Empfehlung |
|-------|-----|-------------|------------|

### Alle Links (vollständig)
[Tabellarische Auflistung aller gefundenen Links mit Status]
```

---

*Erstellt: März 2026 – SkinfitCup*
