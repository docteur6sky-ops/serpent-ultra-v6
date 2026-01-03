FROM node:22-alpine

# Force rebuild - 2026-01-03
ARG CACHE_BUST=1

WORKDIR /app

# Copier uniquement les fichiers serveur nécessaires
COPY package.json package-lock.json ./
COPY server.js ./
COPY SnakeServer.js ./
COPY Logger.js ./
COPY SecurityValidator.js ./

# Installer uniquement les dépendances de production
RUN npm ci --omit=dev --ignore-scripts --legacy-peer-deps

# Exposer le port
EXPOSE 3000

# Démarrer le serveur
CMD ["node", "server.js"]
