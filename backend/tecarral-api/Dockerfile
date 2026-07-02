FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Si se tuviera build (TypeScript), aquÃ­ irÃ­a:
# RUN npm run build

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
RUN apk add --no-cache libreoffice fontconfig ttf-dejavu

COPY --from=build /app /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

CMD ["node", "src/server.js"]

