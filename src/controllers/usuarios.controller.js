// CRUD de usuários do painel (somente ADMIN).
const usuariosService = require('../services/usuarios.service');
const { criarUsuarioSchema, atualizarUsuarioSchema } = require('../schemas/usuario.schema');

async function listar(req, res) {
  res.json(await usuariosService.listar());
}

async function buscar(req, res) {
  res.json(await usuariosService.buscarPorId(req.params.id));
}

async function criar(req, res) {
  const dados = criarUsuarioSchema.parse(req.body);
  res.status(201).json(await usuariosService.criar(dados));
}

async function atualizar(req, res) {
  const dados = atualizarUsuarioSchema.parse(req.body);
  res.json(await usuariosService.atualizar(req.params.id, dados, req.usuario.id));
}

// "Excluir" = desativar, para preservar o histórico.
async function desativar(req, res) {
  res.json(await usuariosService.atualizar(req.params.id, { ativo: false }, req.usuario.id));
}

module.exports = { listar, buscar, criar, atualizar, desativar };
