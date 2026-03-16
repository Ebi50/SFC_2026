# Audit → Implementierungsplan Transformation

## Auftrag

Transformiere die Ergebnisse eines Code-Audits in einen priorisierten, ausführbaren Implementierungsplan für die SFC-Website.

## Projektpfad

```
C:\Users\eberh\SFC_2026
```

---

## Input

### Audit-Ergebnisse einfügen

```
[HIER AUDIT-ERGEBNISSE EINFÜGEN]

Entweder:
- Vollständiger Audit-Bericht als Text
- Pfad zu Audit-Datei (z.B. .claude/prompts/code_audit_prompt.md ausführen)
```

---

## Schritt 1: Kategorisierung

| Kategorie | Kriterien | Typische Maßnahmen |
|-----------|-----------|-------------------|
| 🔴 **KRITISCH** | Datenverlust, Security, DSGVO-Verstoß | Sofort beheben |
| 🟠 **HOCH** | Fehlende Persistenz, Admin-Auth-Lücken | Sprint-Priorität |
| 🟡 **MITTEL** | Code-Qualität, fehlende Validierung | Geplante Iteration |
| 🟢 **NIEDRIG** | Best Practices, SEO, Dokumentation | Backlog |

## Schritt 2: Abhängigkeitsanalyse

Für jedes Finding:
- Welche anderen Findings sind Voraussetzung?
- Welche Dateien sind betroffen?
- Kann es parallel bearbeitet werden?

## Schritt 3: Aufwandsschätzung

| Größe | Aufwand | Beispiel |
|-------|---------|---------|
| XS | < 15 Min | .gitignore anpassen, URL korrigieren |
| S | 15-60 Min | Route absichern, Validierung hinzufügen |
| M | 1-3 Std | Neue Komponente, Service-Extraktion |
| L | 3-8 Std | Upload-System umbauen, neue Feature |
| XL | > 1 Tag | Architektur-Refactoring |

---

## Ausgabeformat

```markdown
## Implementierungsplan – SFC

### Übersicht
| Priorität | Anzahl | Geschätzter Aufwand |
|-----------|--------|---------------------|
| 🔴 Kritisch | X | ... |
| 🟠 Hoch | Y | ... |
| 🟡 Mittel | Z | ... |
| 🟢 Niedrig | W | ... |

### Phase 1: Kritische Fixes (sofort)
| # | Finding | Datei(en) | Aufwand | Abhängig von |
|---|---------|-----------|---------|--------------|
| 1 | [Beschreibung] | server/routes/X.ts | S | - |

### Phase 2: Hohe Priorität
| # | Finding | Datei(en) | Aufwand | Abhängig von |
|---|---------|-----------|---------|--------------|

### Phase 3: Mittlere Priorität
[...]

### Phase 4: Backlog
[...]

### Soll ich mit Phase 1 beginnen?
```

---

*Erstellt: März 2026 – SkinfitCup*
