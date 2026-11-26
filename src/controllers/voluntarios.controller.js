// Recebe as requisições de voluntários, valida os dados e chama o service.
const service = require('../services/voluntarios.service');
const {
  preCadastroSchema,
  atualizarVoluntarioSchema,
  mudarStatusSchema,
  filtrosSchema,
} = require('../schemas/voluntario.schema');

async function preCadastro(req, res) {
  const dados = preCadastroSchema.parse(req.body);
  res.status(201).json(await service.preCadastro(dados));
}

async function listar(req, res) {
  const filtros = filtrosSchema.parse(req.query);
  res.json(await service.listar(filtros));
}

async function buscar(req, res) {
  res.json(await service.buscarPorId(req.params.id));
}

async function atualizar(req, res) {
  const dados = atualizarVoluntarioSchema.parse(req.body);
  res.json(await service.atualizar(req.params.id, dados));
}

async function mudarStatus(req, res) {
  const dados = mudarStatusSchema.parse(req.body);
  res.json(await service.mudarStatus(req.params.id, dados, req.usuario.id));
}

module.exports = { preCadastro, listar, buscar, atualizar, mudarStatus };
