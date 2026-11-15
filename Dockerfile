# Imagem da API (Node.js + Express + Prisma), usada pelo "docker compose --profile demo".
FROM node:22-slim

# O Prisma precisa do OpenSSL para falar com o PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instala as dependências primeiro (aproveita o cache do Docker quando só o código muda)
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npx prisma generate

COPY src ./src

ENV NODE_ENV=production
EXPOSE 3000

# Ao iniciar: cria as tabelas, o ADMIN e os dados fictícios (os seeds não duplicam nada) e liga a API.
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node prisma/seed-demo.js && node src/server.js"]
