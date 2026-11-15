// Instância única do Prisma Client, compartilhada por toda a aplicação.
// Criar vários clients abre conexões demais com o banco.
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
