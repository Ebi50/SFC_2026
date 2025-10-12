# SkinFit Cup - Google Cloud Run Deployment

## Voraussetzungen

1. **Google Cloud CLI installiert**: [Installation](https://cloud.google.com/sdk/docs/install)
2. **Docker installiert** (optional, für lokale Tests)
3. **Google Cloud Projekt** mit aktivierter Cloud Run API

## Schnell-Deployment (Manuelle Methode)

### Schritt 1: Google Cloud CLI einrichten

```powershell
# Einloggen
gcloud auth login

# Projekt setzen (ersetze PROJECT_ID mit deiner Projekt-ID)
gcloud config set project PROJECT_ID

# Region setzen
gcloud config set run/region europe-west1

# APIs aktivieren (falls noch nicht geschehen)
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### Schritt 2: App deployen

```powershell
# Einfaches Deployment mit gcloud
gcloud run deploy skinfit-cup \
  --source . \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production,PORT=8080
```

Das war's! Cloud Run baut automatisch den Container und deployed ihn.

### Schritt 3: URL abrufen

```powershell
gcloud run services describe skinfit-cup --region europe-west1 --format 'value(status.url)'
```

## Automatisches Deployment mit Cloud Build (Optional)

Für automatisches Deployment bei jedem Git Push:

### Schritt 1: Repository verbinden

```powershell
# Cloud Build mit GitHub verbinden
gcloud beta builds triggers create github \
  --name="skinfit-cup-deploy" \
  --repo-name="SFC_2026" \
  --repo-owner="Ebi50" \
  --branch-pattern="^master$" \
  --build-config="cloudbuild.yaml"
```

Jetzt wird bei jedem Push auf master automatisch deployed!

## Wichtige Umgebungsvariablen

Setze diese in Cloud Run:

```powershell
gcloud run services update skinfit-cup \
  --region europe-west1 \
  --set-env-vars \
    NODE_ENV=production,\
    PORT=8080,\
    GCS_BUCKET_NAME=skinfit-cup-database,\
    SESSION_SECRET=your-secure-random-string-here
```

**Erforderliche Variablen:**
- `NODE_ENV=production` - Aktiviert Production-Mode
- `PORT=8080` - Cloud Run Standard-Port
- `GCS_BUCKET_NAME` - Name deines Cloud Storage Buckets für DB-Sync
- `SESSION_SECRET` - Sicherer zufälliger String für Sessions

## Secrets für sensible Daten

Für Google Cloud Credentials oder andere Secrets:

```powershell
# Secret erstellen
echo -n "your-secret-value" | gcloud secrets create SESSION_SECRET --data-file=-

# Secret mit Cloud Run verknüpfen
gcloud run services update skinfit-cup \
  --region europe-west1 \
  --update-secrets SESSION_SECRET=SESSION_SECRET:latest
```

## SQLite Datenbank persistieren

✅ **Implementiert**: Die App synchronisiert automatisch die SQLite-Datenbank mit Cloud Storage!

### Cloud Storage Bucket einrichten

**Schritt 1: Bucket erstellen (falls noch nicht vorhanden)**

```powershell
# Bucket erstellen
gsutil mb -l europe-west1 gs://skinfit-cup-database

# Oder mit gcloud
gcloud storage buckets create gs://skinfit-cup-database --location=europe-west1
```

**Schritt 2: Service Account Berechtigungen setzen**

```powershell
# Cloud Run Service Account finden
$PROJECT_ID = gcloud config get-value project
$SERVICE_ACCOUNT = "${PROJECT_ID}@appspot.gserviceaccount.com"

# Storage Admin Rolle zuweisen
gsutil iam ch serviceAccount:${SERVICE_ACCOUNT}:roles/storage.objectAdmin gs://skinfit-cup-database
```

**Schritt 3: Datenbank hochladen (optional - für initiale Daten)**

```powershell
# Lokale Datenbank in Bucket hochladen
gsutil cp database.sqlite3 gs://skinfit-cup-database/database.sqlite3
```

### Wie es funktioniert

1. **Beim Start**: App lädt `database.sqlite3` vom Bucket herunter (falls vorhanden)
2. **Während Betrieb**: Automatisches Upload alle 5 Minuten
3. **Beim Shutdown**: Finaler Upload vor Beendigung
4. **Backups**: Automatische Backup-Funktion verfügbar

Die Umgebungsvariable `GCS_BUCKET_NAME` aktiviert diese Funktionalität automatisch!

### Option B: Cloud SQL (für Production empfohlen)
```powershell
# Cloud SQL Instanz erstellen
gcloud sql instances create skinfit-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=europe-west1
```

### Option C: Firestore oder andere NoSQL DB

## Logs anschauen

```powershell
# Live-Logs
gcloud run services logs read skinfit-cup --region europe-west1 --follow

# Fehler anzeigen
gcloud run services logs read skinfit-cup --region europe-west1 --limit=50
```

## Update/Neu-Deployment

```powershell
# Einfach erneut deployen
gcloud run deploy skinfit-cup --source . --region europe-west1
```

## Kosten optimieren

```powershell
# Minimum instances auf 0 setzen (cold starts in Kauf nehmen)
gcloud run services update skinfit-cup \
  --region europe-west1 \
  --min-instances 0 \
  --max-instances 5

# CPU nur bei Requests allokieren
gcloud run services update skinfit-cup \
  --region europe-west1 \
  --cpu-throttling
```

## Troubleshooting

### Container startet nicht
```powershell
# Build-Logs anschauen
gcloud builds list --limit=5
gcloud builds log <BUILD_ID>
```

### App nicht erreichbar
```powershell
# Service Status prüfen
gcloud run services describe skinfit-cup --region europe-west1

# Health check testen
curl https://YOUR-SERVICE-URL/api/health
```

### Permission Fehler
```powershell
# IAM Rollen zuweisen
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/run.invoker"
```

## Lokaler Docker Test (vor Deployment)

```powershell
# Image bauen
docker build -t skinfit-cup .

# Lokal testen
docker run -p 8080:8080 -e NODE_ENV=production skinfit-cup

# Im Browser öffnen: http://localhost:8080
```

## Nützliche Links

- [Cloud Run Dokumentation](https://cloud.google.com/run/docs)
- [Cloud Run Preise](https://cloud.google.com/run/pricing)
- [Best Practices](https://cloud.google.com/run/docs/best-practices)
