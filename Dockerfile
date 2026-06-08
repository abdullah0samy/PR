FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
RUN npm install --omit=dev --ignore-scripts --legacy-peer-deps
EXPOSE 3000
ENV NODE_ENV=production
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/server.cjs"]