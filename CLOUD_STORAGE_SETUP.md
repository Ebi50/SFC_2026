# Cloud Storage Bucket Setup für SkinFit Cup

## Quick Setup Commands

```powershell
# 1. Variablen setzen
$PROJECT_ID = "DEINE-PROJECT-ID"  # ← Hier deine Project ID eintragen
$BUCKET_NAME = "skinfit-cup-database"
$REGION = "europe-west1"

# 2. Projekt aktivieren
gcloud config set project $PROJECT_ID

# 3. Bucket erstellen (falls noch nicht vorhanden)
gcloud storage buckets create gs://$BUCKET_NAME --location=$REGION

# 4. Service Account Berechtigungen setzen
$SERVICE_ACCOUNT = "${PROJECT_ID}@appspot.gserviceaccount.com"
gsutil iam ch serviceAccount:${SERVICE_ACCOUNT}:roles/storage.objectAdmin gs://$BUCKET_NAME

# 5. (Optional) Initiale Datenbank hochladen
gsutil cp database.sqlite3 gs://$BUCKET_NAME/database.sqlite3

# 6. Bucket-Inhalt überprüfen
gsutil ls -lh gs://$BUCKET_NAME/
```

## Bucket-Inhalt verwalten

### Datenbank herunterladen
```powershell
gsutil cp gs://$BUCKET_NAME/database.sqlite3 ./database-backup.sqlite3
```

### Datenbank hochladen
```powershell
gsutil cp ./database.sqlite3 gs://$BUCKET_NAME/database.sqlite3
```

### Backups anzeigen
```powershell
gsutil ls gs://$BUCKET_NAME/backups/
```

### Backup wiederherstellen
```powershell
# Backup herunterladen
gsutil cp gs://$BUCKET_NAME/backups/database-2025-10-12T20-00-00-000Z.sqlite3 ./database.sqlite3

# Als aktive DB hochladen
gsutil cp ./database.sqlite3 gs://$BUCKET_NAME/database.sqlite3
```

## Troubleshooting

### Permission Denied Fehler

```powershell
# Cloud Run Service Account anzeigen
gcloud run services describe skinfit-cup --region europe-west1 --format 'value(spec.template.spec.serviceAccountName)'

# Berechtigungen überprüfen
gsutil iam get gs://$BUCKET_NAME

# Berechtigungen neu setzen
gsutil iam ch serviceAccount:${SERVICE_ACCOUNT}:roles/storage.admin gs://$BUCKET_NAME
```

### Bucket existiert nicht

```powershell
# Alle Buckets auflisten
gsutil ls

# Bucket Details anzeigen
gsutil ls -L -b gs://$BUCKET_NAME
```

### Bucket Zugriffsrechte testen

```powershell
# Test-Datei hochladen
echo "test" > test.txt
gsutil cp test.txt gs://$BUCKET_NAME/test.txt

# Test-Datei herunterladen
gsutil cp gs://$BUCKET_NAME/test.txt ./test-downloaded.txt

# Aufräumen
gsutil rm gs://$BUCKET_NAME/test.txt
rm test.txt test-downloaded.txt
```

## Bucket-Kosten optimieren

### Lifecycle-Regel für alte Backups

```powershell
# Lifecycle-Config erstellen
@"
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 30,
          "matchesPrefix": ["backups/"]
        }
      }
    ]
  }
}
"@ | Out-File -Encoding utf8 lifecycle.json

# Lifecycle auf Bucket anwenden
gsutil lifecycle set lifecycle.json gs://$BUCKET_NAME

# Lifecycle überprüfen
gsutil lifecycle get gs://$BUCKET_NAME
```

### Storage-Klasse optimieren

```powershell
# Für aktive Datenbank: Standard Storage (schnell)
gsutil setmeta -h "x-goog-storage-class:STANDARD" gs://$BUCKET_NAME/database.sqlite3

# Für Backups: Nearline Storage (günstiger)
gsutil -m setmeta -r -h "x-goog-storage-class:NEARLINE" gs://$BUCKET_NAME/backups/
```

## Monitoring

### Bucket-Größe überwachen

```powershell
# Gesamtgröße
gsutil du -sh gs://$BUCKET_NAME

# Detaillierte Aufschlüsselung
gsutil du -h gs://$BUCKET_NAME/*
```

### Zugriffs-Logs

```powershell
# Zugriffs-Logs aktivieren
gsutil logging set on -b gs://$BUCKET_NAME-logs gs://$BUCKET_NAME

# Logs anschauen
gsutil ls gs://$BUCKET_NAME-logs
```
