// Recebe as requisições de termos, valida e chama o service.
const { z } = require('zod');
const service = require('../services/termos.service');

const emitirSchema = z.object({ voluntarioId: z.string().uuid('voluntarioId inválido') });
const filtrosSchema = z.object({ voluntarioId: z.string().uuid().optional() });
const hashSchema = z.string().regex(/^[a-f0-9]{64}$/, 'Código de validação inválido');

async function emitir(req, res) {
  const { voluntarioId } = emitirSchema.parse(req.body);
  res.status(201).json(await service.emitir(voluntarioId, req.usuario.id));
}

async function listar(req, res) {
  res.json(await service.listar(filtrosSchema.parse(req.query)));
}

async function buscar(req, res) {
  res.json(await service.buscarPorId(req.params.id));
}

async function pdf(req, res) {
  const arquivo = await service.gerarPdf(req.params.id);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `inline; filename="termo-${req.params.id}.pdf"`,
  });
  res.send(arquivo);
}

async function validar(req, res) {
  const hash = hashSchema.parse(req.params.hash.toLowerCase());
  res.json(await service.validar(hash));
}

module.exports = { emitir, listar, buscar, pdf, validar };
