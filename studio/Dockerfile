# Immagine di produzione di Studio Amico.
FROM node:22-alpine

ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080 TRUST_PROXY=1
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY server ./server
COPY public ./public

USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- "http://127.0.0.1:${PORT}/api/salute" || exit 1
CMD ["node", "server/index.js"]
