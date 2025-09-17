FROM node:20-bullseye AS builder

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y \
  python3 \
  make \
  g++ \
  && apt-get clean

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

FROM node:20-bullseye

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/package.json ./package.json
COPY .env .env

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
