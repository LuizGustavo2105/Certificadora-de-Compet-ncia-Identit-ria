// Regras dos usuários (coordenadores). Usuários nunca são apagados: só desativados.
const bcrypt = require('bcrypt');
const prisma = require('../lib/prisma');
const { ErroApp } = require('../lib/erros');

const RODADAS_BCRYPT = 10;

// Remove o hash da senha antes de devolver o usuário na resposta.
function semSenha(usuario) {
  const { senhaHash, ...resto } = usuario;
  return resto;
}

async function listar() {
  const usuarios = await prisma.usuario.findMany({ orderBy: { nome: 'asc' } });
  return usuarios.map(semSenha);
}

async function buscarPorId(id) {
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) throw new ErroApp(404, 'Usuário não encontrado');
  return semSenha(usuario);
}

async function criar({ senha, ...dados }) {
  const senhaHash = await bcrypt.hash(senha, RODADAS_BCRYPT);
  const usuario = await prisma.usuario.create({ data: { ...dados, senhaHash } });
  return semSenha(usuario);
}

// idQuemPediu: impede que o ADMIN se desative ou se rebaixe e fique sem acesso.
async function atualizar(id, { senha, ...dados }, idQuemPediu) {
  await buscarPorId(id);
  if (id === idQuemPediu && (dados.ativo === false || dados.perfil === 'COORDENADOR')) {
    throw new ErroApp(400, 'Você não pode desativar nem rebaixar o próprio usuário');
  }
  if (senha) dados.senhaHash = await bcrypt.hash(senha, RODADAS_BCRYPT);
  const usuario = await prisma.usuario.update({ where: { id }, data: dados });
  return semSenha(usuario);
}

module.exports = { semSenha, listar, buscarPorId, criar, atualizar };
