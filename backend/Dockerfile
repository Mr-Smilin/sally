FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push && node src/index.js"]
