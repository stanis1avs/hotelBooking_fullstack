# --- Сборка ---
FROM node:20-alpine AS build
WORKDIR /app

# Зависимости отдельным слоем: пересобираются только при изменении package*.json
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Рантайм ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Только production-зависимости: образ без @nestjs/cli и TypeScript
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# Не под root: контейнеру не нужны привилегии
USER node

EXPOSE 7000
# start:dev поднимал watch-режим — в контейнере нужен собранный код
CMD ["node", "dist/main"]
