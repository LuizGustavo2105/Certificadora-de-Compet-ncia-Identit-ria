// Prepara o ambiente dos testes de integração: banco SEPARADO (sgv_ellp_teste),
// tabelas criadas pelas migrations e funções de apoio.
// Este arquivo precisa ser carregado ANTES do app, porque troca a DATABASE_URL.
require('dotenv').config({ quiet: true });
const { execSync } = require('child_process');
const path = require('path');

const original = process.env.DATABASE_URL || '';
// Mesmo servidor, banco com sufixo "_teste": .../sgv_ellp?schema=public -> .../sgv_ellp_teste?schema=public
const urlTeste = process.env.DATABASE_URL_TESTE || original.replace(/\/([^/?]+)(\?|$)/, '/$1_teste$2');

// Trava de segurança: os testes apagam tabelas, então só rodam num banco com "teste" no nome.
if (!/teste/.test(urlTeste)) {
  throw new Error('Os testes de integração só rodam em um banco com "teste" no nome (DATABASE_URL_TESTE).');
}

process.env.DATABASE_URL = urlTeste;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'segredo-usado-so-nos-testes';
process.env.FRONT_URL = 'http://localhost:5173';

// Cria o banco de teste (se não existir) e aplica as migrations.
execSync('npx prisma migrate deploy', {
  cwd: path.join(__dirname, '..', '..'),
  env: process.env,
  stdio: 'ignore',
});

const bcrypt = require('bcrypt');
const app = require('../../src/app');
const prisma = require('../../src/lib/prisma');

// Apaga tudo, na ordem das chaves estrangeiras (só no banco de teste).
async function limparBanco() {
  await prisma.termoVoluntariado.deleteMany();
  await prisma.participacao.deleteMany();
  await prisma.statusHistorico.deleteMany();
  await prisma.disponibilidade.deleteMany();
  await prisma.voluntario.deleteMany();
  await prisma.oficina.deleteMany();
  await prisma.usuario.deleteMany();
}

async function criarUsuario(dados) {
  return prisma.usuario.create({
    data: { nome: dados.nome, email: dados.email, perfil: dados.perfil, ativo: dados.ativo ?? true, senhaHash: await bcrypt.hash(dados.senha, 4) },
  });
}

// Sobe a API numa porta livre e devolve uma função para fazer requisições.
function iniciarServidor() {
  return new Promise((resolve) => {
    const servidor = app.listen(0, () => {
      const base = `http://localhost:${servidor.address().port}`;
      async function req(metodo, caminho, { corpo, token } = {}) {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        const r = await fetch(base + caminho, { method: metodo, headers, body: corpo && JSON.stringify(corpo) });
        const tipo = r.headers.get('content-type') || '';
        let dados = null;
        if (tipo.includes('application/json')) dados = await r.json();
        else if (r.status !== 204) dados = Buffer.from(await r.arrayBuffer());
        return { status: r.status, dados, tipo };
      }
      resolve({ servidor, req });
    });
  });
}

module.exports = { prisma, limparBanco, criarUsuario, iniciarServidor };
