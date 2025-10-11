# Basis-Image
FROM node:20-alpine

# Arbeitsverzeichnis erstellen
WORKDIR /app

# Build-Dependencies installieren
RUN apk add --no-cache python3 make g++ gcc

# package.json und package-lock.json kopieren
COPY package*.json ./

# Abhängigkeiten installieren
RUN npm install

# Restliche Anwendungsdateien kopieren
COPY . .

# TypeScript kompilieren
RUN npm run build

# Umgebungsvariablen setzen
ENV PORT=8080
ENV NODE_ENV=production

# Anwendung starten
CMD ["npm", "start"]