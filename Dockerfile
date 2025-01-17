# Wähle ein Node.js-Base-Image aus einer offiziellen Quelle
FROM node:18-alpine

# Setze das Arbeitsverzeichnis im Container
WORKDIR /app

# Kopiere nur die package.json und package-lock.json, um den Installations-Cache zu nutzen
COPY package*.json ./

# Installiere Abhängigkeiten
RUN npm install

# Kopiere den Rest des Projektverzeichnisses
COPY . .

# Exponiere den Port, auf dem die App läuft (z. B. 3000)
EXPOSE 3000

# Starte die Anwendung
CMD ["npm", "start"]
