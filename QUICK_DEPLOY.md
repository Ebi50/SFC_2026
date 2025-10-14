# 🚀 Quick Deployment Guide for SFC 2026

## What you need to provide:

### 1. Google Cloud Project Information
- **Project ID**: Your Google Cloud project ID (e.g., "sfc-2026-production")
- **Region**: Recommended: `europe-west1` (Frankfurt) or `us-central1`

### 2. Environment Variables (Security)
- **SESSION_SECRET**: A strong random string for session security (generate with: `openssl rand -base64 32`)
- **CORS_ORIGINS**: Your production domain(s) (e.g., "https://skinfit-cup.com,https://www.skinfit-cup.com")

### 3. Optional Configuration
- **Database**: For production, consider Cloud SQL instead of SQLite
- **Custom Domain**: Your own domain name if you want to use it
- **SSL Certificate**: Automatically provided by Google Cloud Run

## 🎯 One-Command Deployment

```powershell
# Set your project ID and secrets
$env:PROJECT_ID = "your-project-id-here"
$env:SESSION_SECRET = "your-super-secret-session-key-here"

# Run deployment
.\deploy.ps1
```

## 📋 Deployment Checklist

Before deployment, make sure you have:
- ✅ Google Cloud account with billing enabled
- ✅ Google Cloud CLI installed and authenticated (`gcloud auth login`)
- ✅ Docker installed (optional, for local testing)
- ✅ Project ID ready
- ✅ Session secret generated
- ✅ Domain name ready (if using custom domain)

## 🔧 Manual Steps (if needed)

1. **Create Google Cloud Project**:
   ```bash
   gcloud projects create YOUR-PROJECT-ID
   gcloud config set project YOUR-PROJECT-ID
   ```

2. **Enable Billing**: Go to Google Cloud Console and enable billing for your project

3. **Set Environment Variables**:
   ```powershell
   $env:PROJECT_ID = "your-project-id"
   $env:SESSION_SECRET = "your-session-secret"
   ```

4. **Deploy**:
   ```powershell
   .\deploy.ps1
   ```

## 💰 Cost Estimation

Google Cloud Run pricing (Pay per use):
- **Free Tier**: 2 million requests per month
- **CPU**: ~$0.024 per vCPU-hour  
- **Memory**: ~$0.0025 per GiB-hour
- **Requests**: ~$0.40 per million requests

**Estimated monthly cost for small to medium usage**: $5-20/month

## 🌐 After Deployment

Your app will be available at:
- **Cloud Run URL**: `https://skinfit-cup-[random-hash]-ew.a.run.app`
- **Health Check**: Add `/api/health` to verify it's running
- **Admin Access**: Use the admin login you configured

## 🆘 Need Help?

If you run into issues:
1. Check the deployment logs: `gcloud run logs read --service skinfit-cup --region europe-west1`
2. Verify your environment variables are set correctly
3. Make sure your Google Cloud project has billing enabled
4. Ensure all required APIs are enabled

**Ready to deploy? Just provide your PROJECT_ID and SESSION_SECRET!** 🚀