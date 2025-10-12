# Quick Deployment Script für Google Cloud Run
# Einfach dieses Skript ausführen: .\deploy.ps1

param(
    [string]$ProjectId = "",
    [string]$Region = "europe-west1",
    [string]$ServiceName = "skinfit-cup"
)

Write-Host "🚀 SkinFit Cup - Cloud Run Deployment" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if gcloud is installed
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Google Cloud CLI nicht gefunden!" -ForegroundColor Red
    Write-Host "Bitte installiere gcloud: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Get or set project ID
if ($ProjectId -eq "") {
    $CurrentProject = gcloud config get-value project 2>$null
    if ($CurrentProject) {
        Write-Host "📋 Verwende aktuelles Projekt: $CurrentProject" -ForegroundColor Green
        $ProjectId = $CurrentProject
    } else {
        Write-Host "❌ Kein Projekt gesetzt!" -ForegroundColor Red
        Write-Host "Bitte führe aus: gcloud config set project YOUR_PROJECT_ID" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "⚙️  Konfiguration:" -ForegroundColor Yellow
Write-Host "   Projekt: $ProjectId"
Write-Host "   Region:  $Region"
Write-Host "   Service: $ServiceName"
Write-Host ""

# Confirm deployment
$Confirm = Read-Host "Deployment starten? (y/n)"
if ($Confirm -ne "y") {
    Write-Host "❌ Abgebrochen" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🔨 Starte Deployment..." -ForegroundColor Cyan

# Use existing bucket
$BucketName = "skinfitcup"
Write-Host "   Verwende Cloud Storage Bucket: $BucketName" -ForegroundColor Green

Write-Host ""
Write-Host "🪣  Cloud Storage Bucket: $BucketName" -ForegroundColor Cyan
Write-Host ""

# Deploy to Cloud Run
gcloud run deploy $ServiceName `
    --source . `
    --platform managed `
    --region $Region `
    --allow-unauthenticated `
    --memory 512Mi `
    --cpu 1 `
    --max-instances 10 `
    --set-env-vars "NODE_ENV=production,PORT=8080,GCS_BUCKET_NAME=$BucketName"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment erfolgreich!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 URL abrufen:" -ForegroundColor Cyan
    $ServiceUrl = gcloud run services describe $ServiceName --region $Region --format 'value(status.url)' 2>$null
    if ($ServiceUrl) {
        Write-Host "   $ServiceUrl" -ForegroundColor Green
        Write-Host ""
        Write-Host "🔍 API Health Check:" -ForegroundColor Cyan
        Write-Host "   $ServiceUrl/api/health" -ForegroundColor Green
    }
} else {
    Write-Host ""
    Write-Host "❌ Deployment fehlgeschlagen!" -ForegroundColor Red
    Write-Host "Logs anschauen mit:" -ForegroundColor Yellow
    Write-Host "   gcloud run services logs read $ServiceName --region $Region" -ForegroundColor Gray
    exit 1
}
