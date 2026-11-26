// Regras dos voluntários: pré-cadastro, listagem com filtros, edição e mudança de status.
// Voluntários nunca são apagados: o fim do vínculo é o status DESLIGADO.
const prisma = require('../lib/prisma');
const { ErroApp } = require('../lib/erros');
const { podeTransitar, datasDaTransicao } = require('./fsm');
const { totalHoras } = require('./horas');

// Participações com a oficina, necessárias para calcular as horas.
const comParticipacoes = { participacoes: { include: { oficina: true } } };

// Formulário público: sempre entra como PENDENTE e registra quando o consentimento foi dado.
async function preCadastro({ disponibilidades, consentimentoLgpd, ...dados }) {
  const voluntario = await prisma.voluntario.create({
    data: {
      ...dados,
      status: 'PENDENTE',
      consentimentoLgpd: true,
      consentimentoEm: new Date(),
      disponibilidades: { create: disponibilidades },
    },
  });
  // Resposta pública mínima: não devolve dados pessoais.
  return { id: voluntario.id, status: voluntario.status };
}

async function listar({ busca, status, interesse, diaSemana, ordenar, ordem }) {
  const where = {};
  if (status) where.status = status;
  if (interesse) where.interesses = { has: interesse };
  if (diaSemana !== undefined) where.disponibilidades = { some: { diaSemana } };
  if (busca) {
    where.OR = [
      { nome: { contains: busca, mode: 'insensitive' } },
      { email: { contains: busca, mode: 'insensitive' } },
    ];
  }

  const voluntarios = await prisma.voluntario.findMany({
    where,
    include: { disponibilidades: true, ...comParticipacoes },
    orderBy: ordenar === 'horas' ? undefined : { [ordenar]: ordem },
  });

  const resultado = voluntarios.map(({ participacoes, ...v }) => ({
    ...v,
    totalHoras: totalHoras(participacoes),
    totalOficinas: participacoes.length,
  }));

  // As horas são calculadas aqui, então a ordenação por horas também.
  if (ordenar === 'horas') {
    resultado.sort((a, b) => (ordem === 'asc' ? a.totalHoras - b.totalHoras : b.totalHoras - a.totalHoras));
  }
  return resultado;
}

async function buscarPorId(id) {
  const voluntario = await prisma.voluntario.findUnique({
    where: { id },
    include: {
      disponibilidades: true,
      ...comParticipacoes,
      historico: {
        orderBy: { em: 'asc' },
        include: { usuario: { select: { id: true, nome: true } } },
      },
    },
  });
  if (!voluntario) throw new ErroApp(404, 'Voluntário não encontrado');
  return { ...voluntario, totalHoras: totalHoras(voluntario.participacoes) };
}

// Se vierem disponibilidades, substituem as anteriores.
async function atualizar(id, { disponibilidades, ...dados }) {
  await buscarPorId(id);
  await prisma.$transaction(async (tx) => {
    await tx.voluntario.update({ where: { id }, data: dados });
    if (disponibilidades) {
      await tx.disponibilidade.deleteMany({ where: { voluntarioId: id } });
      await tx.disponibilidade.createMany({
        data: disponibilidades.map((d) => ({ ...d, voluntarioId: id })),
      });
    }
  });
  return buscarPorId(id);
}

// Muda o status seguindo a máquina de estados (RN01), preenche as datas (RN02)
// e grava o histórico (RN03). Tudo numa transação: ou faz tudo, ou nada.
async function mudarStatus(id, { para, observacao }, usuarioId) {
  await prisma.$transaction(async (tx) => {
    const atual = await tx.voluntario.findUnique({ where: { id }, select: { status: true } });
    if (!atual) throw new ErroApp(404, 'Voluntário não encontrado');

    const de = atual.status;
    if (!podeTransitar(de, para)) {
      throw new ErroApp(422, `Transição não permitida: ${de} → ${para}`);
    }

    // "where status = de" evita que dois coordenadores mudem o mesmo voluntário ao mesmo tempo.
    const { count } = await tx.voluntario.updateMany({
      where: { id, status: de },
      data: { status: para, ...datasDaTransicao(para) },
    });
    if (count === 0) throw new ErroApp(409, 'O status foi alterado por outra pessoa. Recarregue e tente de novo.');

    await tx.statusHistorico.create({
      data: { voluntarioId: id, de, para, usuarioId, observacao },
    });
  });
  return buscarPorId(id);
}

module.exports = { preCadastro, listar, buscarPorId, atualizar, mudarStatus };
