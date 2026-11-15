// Regras das oficinas e do vínculo M:N voluntário x oficina (Participacao).
// Oficinas não são apagadas: o fim é o status CANCELADA.
const { Prisma } = require('@prisma/client');
const prisma = require('../lib/prisma');
const { ErroApp } = require('../lib/erros');
const { oficinaPodeTransitar } = require('./fsm');

// ---------- Oficinas ----------

async function listar({ busca, status, de, ate, ordem }) {
  const where = {};
  if (status) where.status = status;
  if (de || ate) where.data = { ...(de && { gte: de }), ...(ate && { lte: ate }) };
  if (busca) {
    where.OR = [
      { tema: { contains: busca, mode: 'insensitive' } },
      { local: { contains: busca, mode: 'insensitive' } },
    ];
  }

  const oficinas = await prisma.oficina.findMany({
    where,
    orderBy: { data: ordem },
    include: { _count: { select: { participacoes: true } } },
  });
  return oficinas.map(({ _count, ...o }) => ({ ...o, totalParticipantes: _count.participacoes }));
}

async function buscarPorId(id) {
  const oficina = await prisma.oficina.findUnique({
    where: { id },
    include: {
      participacoes: {
        orderBy: { criadoEm: 'asc' },
        include: { voluntario: { select: { id: true, nome: true, email: true, status: true } } },
      },
    },
  });
  if (!oficina) throw new ErroApp(404, 'Oficina não encontrada');
  return oficina;
}

async function criar(dados) {
  return prisma.oficina.create({ data: dados });
}

async function atualizar(id, dados) {
  const oficina = await buscarPorId(id);
  if (oficina.status === 'CANCELADA') throw new ErroApp(422, 'Oficina cancelada não pode ser editada');
  return prisma.oficina.update({ where: { id }, data: dados });
}

async function mudarStatus(id, { para }) {
  const oficina = await buscarPorId(id);
  if (!oficinaPodeTransitar(oficina.status, para)) {
    throw new ErroApp(422, `Transição não permitida: ${oficina.status} → ${para}`);
  }
  await prisma.oficina.update({ where: { id }, data: { status: para } });
  return buscarPorId(id);
}

// ---------- Participações (M:N) ----------

async function vincular(oficinaId, { voluntarioId, papel, horasValidas }) {
  // RN08: oficina cancelada não recebe vínculos e só voluntário ATIVO pode ser vinculado.
  const oficina = await buscarPorId(oficinaId);
  if (oficina.status === 'CANCELADA') {
    throw new ErroApp(422, 'Não é possível vincular voluntários a uma oficina cancelada');
  }

  const voluntario = await prisma.voluntario.findUnique({ where: { id: voluntarioId } });
  if (!voluntario) throw new ErroApp(404, 'Voluntário não encontrado');
  if (voluntario.status !== 'ATIVO') {
    throw new ErroApp(422, `Só voluntários ATIVOS podem ser vinculados (status atual: ${voluntario.status})`);
  }

  const horas = horasValidas ?? oficina.cargaHoraria;
  if (horas > oficina.cargaHoraria) {
    throw new ErroApp(422, `As horas válidas não podem passar da carga horária da oficina (${oficina.cargaHoraria}h)`);
  }

  try {
    return await prisma.participacao.create({
      data: { oficinaId, voluntarioId, papel, horasValidas: horas },
      include: { voluntario: { select: { id: true, nome: true } } },
    });
  } catch (err) {
    // RN07: o banco tem índice único (voluntarioId, oficinaId).
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ErroApp(409, 'Este voluntário já está vinculado a esta oficina');
    }
    throw err;
  }
}

async function buscarParticipacao(oficinaId, participacaoId) {
  const participacao = await prisma.participacao.findFirst({
    where: { id: participacaoId, oficinaId },
    include: { oficina: true },
  });
  if (!participacao) throw new ErroApp(404, 'Participação não encontrada nesta oficina');
  return participacao;
}

// Ajuste de papel ou horas (ex.: o voluntário saiu mais cedo).
async function atualizarParticipacao(oficinaId, participacaoId, dados) {
  const { oficina } = await buscarParticipacao(oficinaId, participacaoId);
  if (dados.horasValidas !== undefined && dados.horasValidas > oficina.cargaHoraria) {
    throw new ErroApp(422, `As horas válidas não podem passar da carga horária da oficina (${oficina.cargaHoraria}h)`);
  }
  return prisma.participacao.update({ where: { id: participacaoId }, data: dados });
}

// RN09: só dá para desfazer o vínculo enquanto a oficina está PLANEJADA (correção de engano).
// Depois de realizada, a participação faz parte do histórico e conta para o termo.
async function desvincular(oficinaId, participacaoId) {
  const { oficina } = await buscarParticipacao(oficinaId, participacaoId);
  if (oficina.status !== 'PLANEJADA') {
    throw new ErroApp(422, 'Só é possível remover vínculos de oficinas PLANEJADAS');
  }
  await prisma.participacao.delete({ where: { id: participacaoId } });
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  mudarStatus,
  vincular,
  atualizarParticipacao,
  desvincular,
};
