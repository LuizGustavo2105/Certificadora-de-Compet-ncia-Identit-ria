// Middleware central de erros: todas as rotas caem aqui quando algo falha.
const { ZodError } = require('zod');
const { Prisma } = require('@prisma/client');
const { ErroApp } = require('../lib/erros');

function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: 'Rota não encontrada' });
}

// eslint-disable-next-line no-unused-vars
function tratarErros(err, req, res, next) {
  // Dados inválidos enviados pelo cliente (validação zod)
  if (err instanceof ZodError) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: err.errors.map((e) => ({ campo: e.path.join('.'), mensagem: e.message })),
    });
  }

  // Erros conhecidos do banco
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ erro: 'Registro duplicado', campos: err.meta?.target });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ erro: 'Registro não encontrado' });
    }
  }

  // JSON malformado no corpo da requisição
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido' });
  }

  if (err instanceof ErroApp) {
    return res.status(err.status).json({ erro: err.message });
  }

  console.error(err);
  return res.status(500).json({ erro: 'Erro interno do servidor' });
}

module.exports = { rotaNaoEncontrada, tratarErros };
