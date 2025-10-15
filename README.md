# SkinFit Cup - Verwaltungs- & Wertungsapp

Eine vollständige Administrations-App zur Verwaltung und Auswertung von Vereinsmeisterschaften im Radsport, mit automatischer Punkteberechnung, Gesamtwertung und Cloud-Deployment.

## 🚀 Features

### Teilnehmerverwaltung
- ✅ Vollständige Teilnehmerdatenbank mit Kontaktdaten
- ✅ Leistungsklassen (A, B, C, D) mit Handicap-System
- ✅ RSV-Mitgliedschaft Tracking
- ✅ Excel-Import für Massen-Teilnehmer-Upload

### Event-Management
- ✅ Verschiedene Event-Typen (EZF, BZF, MZF)
- ✅ Ergebniserfassung mit Zeit und Platzierung
- ✅ Automatische Punkteberechnung
- ✅ DNF (Did Not Finish) Support
- ✅ Team-Events mit Mannschaftswertung

### Wertungssystem
- ✅ Saisonübergreifende Gesamtwertung
- ✅ Handicap-basierte faire Punktevergabe
- ✅ Automatische Ranglisten-Generierung
- ✅ Druckbare Reports (PDF)

### Administration
- ✅ Passwortgeschützter Admin-Bereich
- ✅ Einstellbare Handicaps und Team-Größen
- ✅ Saison-Management
- ✅ Email-Benachrichtigungen

## 🛠️ Tech Stack

### Frontend
- **React 19** mit TypeScript
- **Vite** als Build-Tool
- **Tailwind CSS** für Styling
- **React Context API** für State Management

### Backend
- **Node.js** mit Express
- **TypeScript**
- **SQLite** (better-sqlite3) als Datenbank
- **Google Cloud Storage** für Datenpersistierung

### Deployment
- **Google Cloud Run** (Serverless Container)
- **Docker** für Container-Building
- **Cloud Build** für CI/CD
- **Artifact Registry** für Container Storage

## 📦 Installation & Lokale Entwicklung

### Voraussetzungen
- Node.js 20+
- npm oder yarn
- Git

### Setup

```bash
# Repository klonen
git clone https://github.com/Ebi50/SFC-CloudRun.git
cd SFC-CloudRun

# Dependencies installieren
npm install

# Datenbank initialisieren
cd server
npx tsx initDb.ts

# (Optional) Testdaten erstellen
npx tsx createTestData.ts
cd ..
```

### Entwicklungsserver starten

```bash
# Terminal 1: Backend-Server (Port 3001)
npm run server

# Terminal 2: Frontend-Dev-Server (Port 5000)
npm run dev
```

App öffnet sich auf: **http://localhost:5000**

## ☁️ Cloud Deployment

### Voraussetzungen
- Google Cloud Account
- gcloud CLI installiert und konfiguriert
- Cloud Storage Bucket erstellt

### Quick Deployment

```powershell
# 1. Bucket erstellen (falls noch nicht vorhanden)
gsutil mb -l europe-west1 gs://DEIN-BUCKET-NAME

# 2. Berechtigungen setzen
$PROJECT_ID = gcloud config get-value project
gsutil iam ch serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com:roles/storage.objectAdmin gs://DEIN-BUCKET-NAME

# 3. Deployen
gcloud run deploy skinfit-cup \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars GCS_BUCKET_NAME=DEIN-BUCKET-NAME
```

### PowerShell Deployment-Skript

```powershell
.\deploy.ps1
```

Ausführliche Anleitungen:
- 📖 [DEPLOYMENT.md](./DEPLOYMENT.md) - Vollständige Deployment-Anleitung
- 📖 [CLOUD_STORAGE_SETUP.md](./CLOUD_STORAGE_SETUP.md) - Cloud Storage Konfiguration

## 🗄️ Datenbank

### SQLite mit Cloud Storage Sync

Die App verwendet SQLite als lokale Datenbank mit automatischer Synchronisierung zu Google Cloud Storage:

- **Beim Start**: DB wird von Cloud Storage heruntergeladen
- **Während Betrieb**: Automatisches Backup alle 5 Minuten
- **Beim Shutdown**: Finaler Upload zur Cloud

### Schema

```sql
- participants (Teilnehmer)
- events (Veranstaltungen)
- results (Ergebnisse)
- teams (Mannschaften)
- team_members (Mannschaftsmitglieder)
- seasons (Saisons)
- settings (Einstellungen)
```

### Datenbank-Management

```bash
# Datenbank-Inhalt prüfen
cd server
npx tsx checkDbContent.ts

# Testdaten erstellen
npx tsx createTestData.ts

# Daten von Production-API importieren
npx tsx importProdData.ts
```

## 📁 Projektstruktur

```
SFC-CloudRun/
├── components/          # React-Komponenten
│   ├── Dashboard.tsx
│   ├── ParticipantsList.tsx
│   ├── EventsList.tsx
│   ├── Standings.tsx
│   └── ...
├── server/              # Backend
│   ├── index.ts        # Express Server
│   ├── database.ts     # SQLite Connection
│   ├── dbSync.ts       # Cloud Storage Sync
│   ├── routes/         # API Routes
│   └── services/       # Business Logic
├── services/            # Frontend Services
│   ├── api.ts          # API Client
│   └── scoringService.ts
├── public/              # Static Assets
├── Dockerfile           # Container Config
├── cloudbuild.yaml      # Cloud Build Config
└── deploy.ps1          # Deployment Script
```

## 🔐 Umgebungsvariablen

### Lokal (.env)
```env
PORT=3001
SESSION_SECRET=dein-secret-key
NODE_ENV=development
```

### Production (Cloud Run)
```env
NODE_ENV=production
GCS_BUCKET_NAME=skinfit-cup-database
SESSION_SECRET=secure-random-string
```

## 🚦 API Endpoints

### Participants
- `GET /api/participants` - Alle Teilnehmer
- `POST /api/participants` - Neuer Teilnehmer
- `PUT /api/participants/:id` - Teilnehmer aktualisieren
- `DELETE /api/participants/:id` - Teilnehmer löschen

### Events
- `GET /api/events` - Alle Events
- `POST /api/events` - Neues Event
- `GET /api/events/:id/results` - Event-Ergebnisse
- `POST /api/events/:id/results` - Ergebnis hinzufügen

### Seasons & Settings
- `GET /api/seasons` - Alle Saisons
- `GET /api/settings` - App-Einstellungen
- `PUT /api/settings` - Einstellungen aktualisieren

## 📊 Wertungssystem

### Handicap-System

Zeitausgleich basierend auf Leistungsklasse:
- **Klasse A**: 0 Sekunden (Referenz)
- **Klasse B**: +120 Sekunden
- **Klasse C**: +240 Sekunden
- **Klasse D**: +480 Sekunden

### Punkteberechnung

```javascript
// Basisformel
points = (winnerTime / teilnehmerTime) * 100

// Mit Handicap-Anpassung
adjustedTime = teilnehmerTime - handicap
points = (winnerTime / adjustedTime) * 100
```

## 🧪 Testing

```bash
# Backend-Tests
cd server
npx tsx test.ts

# Datenbank-Checks
npx tsx checkDbContent.ts
```

## 📈 Monitoring & Logs

### Cloud Run Logs

```powershell
# Live-Logs
gcloud run services logs read skinfit-cup --region europe-west1 --follow

# Fehler anzeigen
gcloud run services logs read skinfit-cup --region europe-west1 --limit=50
```

### Health Check

```bash
curl https://YOUR-SERVICE-URL/api/health
```

## 🤝 Contributing

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committe deine Changes (`git commit -m 'Add AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

## 📝 License

Dieses Projekt ist privat und nicht zur öffentlichen Verwendung lizenziert.

## 👤 Author

**Ebi50**
- GitHub: [@Ebi50](https://github.com/Ebi50)

## � Production Deployment

### Live Application
- **Production URL:** https://skinfitcup-238077235347.europe-west1.run.app
- **Custom Domain:** sfc-rsv.de (ready for setup)
- **Google Cloud Project:** skinfit-app-474714

### Deployment Commands
```bash
# Build and deploy latest version
docker build -t gcr.io/skinfit-app-474714/skinfitcup:latest .
docker push gcr.io/skinfit-app-474714/skinfitcup:latest
gcloud run deploy skinfitcup --image gcr.io/skinfit-app-474714/skinfitcup:latest --region europe-west1 --platform managed --allow-unauthenticated --port 8080 --set-env-vars "SESSION_SECRET=mvPbJoYgut/V0nMbE6YAAuBE9DqCDzx5Bc5H4nMYrD0=,NODE_ENV=production"
```

### Data Persistence
- **Cloud Storage:** `gs://skinfit-app-data`
- **Auto-sync:** Every 2 minutes
- **Manual sync:** `/api/sync` endpoint (admin only)
- **Data survives:** Container restarts and deployments

## 🔗 Links

- [Live App](https://skinfitcup-238077235347.europe-west1.run.app)
- [GitHub Repository](https://github.com/Ebi50/SFC_2026)
- [Google Cloud Console](https://console.cloud.google.com/run?project=skinfit-app-474714)

## 📞 Support

Bei Fragen oder Problemen:
1. Erstelle ein [Issue](https://github.com/Ebi50/SFC_2026/issues)
2. Prüfe Cloud Run Logs im Google Cloud Console
3. Manual Database Sync via `/api/sync` (admin login required)

---

**Built with ❤️ for the cycling community**
