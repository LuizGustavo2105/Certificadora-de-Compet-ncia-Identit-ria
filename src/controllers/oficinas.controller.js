// Recebe as requisições de oficinas e participações, valida e chama o service.
const service = require('../services/oficinas.service');
const s = require('../schemas/oficina.schema');

async function listar(req, res) {
  res.json(await service.listar(s.filtrosOficinaSchema.parse(req.query)));
}

async function buscar(req, res) {
  res.json(await service.buscarPorId(req.params.id));
}

async function criar(req, res) {
  res.status(201).json(await service.criar(s.criarOficinaSchema.parse(req.body)));
}

async function atualizar(req, res) {
  res.json(await service.atualizar(req.params.id, s.atualizarOficinaSchema.parse(req.body)));
}

async function mudarStatus(req, res) {
  res.json(await service.mudarStatus(req.params.id, s.mudarStatusOficinaSchema.parse(req.body)));
}

async function vincular(req, res) {
  const dados = s.criarParticipacaoSchema.parse(req.body);
  res.status(201).json(await service.vincular(req.params.id, dados));
}

async function atualizarParticipacao(req, res) {
  const dados = s.atualizarParticipacaoSchema.parse(req.body);
  res.json(await service.atualizarParticipacao(req.params.id, req.params.participacaoId, dados));
}

async function desvincular(req, res) {
  await service.desvincular(req.params.id, req.params.participacaoId);
  res.status(204).end();
}

module.exports = {
  listar,
  buscar,
  criar,
  atualizar,
  mudarStatus,
  vincular,
  atualizarParticipacao,
  desvincular,
};
