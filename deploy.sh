#!/bin/bash

# SFC 2026 - Google Cloud Run Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 SFC 2026 - Google Cloud Run Deployment${NC}"
echo "========================================"

# Check if PROJECT_ID is set
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Error: PROJECT_ID environment variable is not set${NC}"
    echo "Please set it with: export PROJECT_ID=your-project-id"
    exit 1
fi

# Check if required environment variables are set
if [ -z "$SESSION_SECRET" ]; then
    echo -e "${YELLOW}⚠️  Warning: SESSION_SECRET not set. Using default (not recommended for production)${NC}"
    export SESSION_SECRET="default-session-secret-change-in-production"
fi

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "Project ID: $PROJECT_ID"
echo "Region: europe-west1"
echo "Service Name: skinfit-cup"
echo ""

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required Google Cloud APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID
gcloud services enable run.googleapis.com --project=$PROJECT_ID
gcloud services enable containerregistry.googleapis.com --project=$PROJECT_ID

# Build and deploy using Cloud Build
echo -e "${YELLOW}🏗️  Building and deploying with Cloud Build...${NC}"
gcloud builds submit --config cloudbuild.yaml --project=$PROJECT_ID

# Get the service URL
echo -e "${YELLOW}🔍 Getting service URL...${NC}"
SERVICE_URL=$(gcloud run services describe skinfit-cup --region europe-west1 --project=$PROJECT_ID --format 'value(status.url)')

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo "========================================"
echo -e "🌐 Service URL: ${GREEN}$SERVICE_URL${NC}"
echo -e "🏥 Health Check: ${GREEN}$SERVICE_URL/api/health${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Test your application: curl $SERVICE_URL/api/health"
echo "2. Configure custom domain (optional)"
echo "3. Set up monitoring and alerts"
echo "4. Update CORS origins to include your domain"
echo ""
echo -e "${GREEN}🎉 Your SFC 2026 application is now live!${NC}"