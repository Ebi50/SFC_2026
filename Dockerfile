# Basis-Image
FROM node:20-alpine

# Arbeitsverzeichnis erstellen
WORKDIR /app

# Build-Dependencies installieren (für better-sqlite3)
RUN apk add --no-cache python3 make g++ gcc

# package.json und package-lock.json kopieren
COPY package*.json ./

# Abhängigkeiten installieren
RUN npm ci --only=production

# tsx separat installieren (wird für start benötigt)
RUN npm install tsx

# Restliche Anwendungsdateien kopieren
COPY . .

# Frontend bauen
RUN npm run build

# Umgebungsvariablen setzen
ENV PORT=8080
ENV NODE_ENV=production

# Expose Port für Cloud Run
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Anwendung starten
CMD ["npm", "start"]