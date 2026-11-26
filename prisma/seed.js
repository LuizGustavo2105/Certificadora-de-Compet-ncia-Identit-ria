// Cria o primeiro coordenador ADMIN. Rode com: npm run seed
// Os dados vêm do .env (SEED_ADMIN_EMAIL e SEED_ADMIN_SENHA) para não deixar senha no código.
require('dotenv').config({ quiet: true });
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const senha = process.env.SEED_ADMIN_SENHA;
  if (!email || !senha) {
    throw new Error('Defina SEED_ADMIN_EMAIL e SEED_ADMIN_SENHA no .env');
  }

  // upsert: se o admin já existir, não duplica.
  const admin = await prisma.usuario.upsert({
    where: { email: email.toLowerCase() },
    update: {},
    create: {
      nome: 'Administrador',
      email: email.toLowerCase(),
      senhaHash: await bcrypt.hash(senha, 10),
      perfil: 'ADMIN',
    },
  });
  console.log(`ADMIN pronto: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
