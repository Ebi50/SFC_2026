# Server Restart Guide

## 🚀 How to Restart Development Servers

### Method 1: Use NPM Script (Recommended)
```bash
npm run restart
```

### Method 2: Use Batch File
```bash
restart-servers.bat
```

### Method 3: Use PowerShell Script
```bash
powershell -ExecutionPolicy Bypass -File restart-servers-simple.ps1
```

### Method 4: Manual Restart
1. **Stop processes:**
   ```bash
   taskkill /f /im node.exe 2>nul || echo "No Node processes"
   taskkill /f /im tsx.exe 2>nul || echo "No TSX processes"
   ```

2. **Start Backend:**
   ```bash
   npm run server
   ```

3. **Start Frontend (in new terminal):**
   ```bash
   npm run dev
   ```

## 📋 Expected Results
- **Backend Server:** http://localhost:3001
- **Frontend Server:** http://localhost:5000 or http://localhost:5001

## 🛠️ Troubleshooting
- If you get "Access Denied" errors, this is normal for system Node processes
- The important thing is that new server instances start successfully
- Wait 3-5 seconds between starting backend and frontend
- If ports are busy, Vite will automatically use the next available port

## ⚡ Quick Fix for Future
**Always restart both servers after configuration changes!**

This prevents connection issues and ensures both frontend and backend are synchronized.