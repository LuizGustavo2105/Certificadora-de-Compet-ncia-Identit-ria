// Números da tela "Visão geral" calculados no banco, numa única chamada.
const prisma = require('../lib/prisma');

const FUSO = 'America/Sao_Paulo';
// "2026-11" no fuso de Brasília (o servidor do deploy roda em UTC).
const chaveMes = (data) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit' }).format(data);

// Lista os últimos 6 meses, do mais antigo para o atual: ["2026-06", ..., "2026-11"].
function ultimosMeses(qtd = 6, hoje = new Date()) {
  const [ano, mes] = chaveMes(hoje).split('-').map(Number);
  return Array.from({ length: qtd }, (_, i) => {
    const d = new Date(Date.UTC(ano, mes - 1 - (qtd - 1 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  });
}

// Transforma o resultado do groupBy em { PENDENTE: 3, ATIVO: 5, ... }.
const contarPorStatus = (grupos, todos) =>
  Object.fromEntries(todos.map((s) => [s, grupos.find((g) => g.status === s)?._count._all || 0]));

async function resumo() {
  const agora = new Date();
  const meses = ultimosMeses();
  // Um dia de folga antes do 1º mês cobre a diferença de fuso; o filtro por chave acerta o resto.
  const inicio = new Date(`${meses[0]}-01T00:00:00Z`);
  inicio.setUTCDate(inicio.getUTCDate() - 1);

  const [statusVol, statusOf, horas, participacoesPeriodo, ativos, pendentes, proximas, termosEmitidos] =
    await Promise.all([
      prisma.voluntario.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.oficina.groupBy({ by: ['status'], _count: { _all: true } }),
      // RN05: horas só de oficinas realizadas
      prisma.participacao.aggregate({ _sum: { horasValidas: true }, where: { oficina: { status: 'REALIZADA' } } }),
      prisma.participacao.findMany({
        where: { oficina: { status: 'REALIZADA', data: { gte: inicio } } },
        select: { horasValidas: true, oficina: { select: { data: true } } },
      }),
      prisma.voluntario.findMany({ where: { status: 'ATIVO' }, select: { id: true, nome: true }, orderBy: { nome: 'asc' }, take: 5 }),
      prisma.voluntario.findMany({
        where: { status: 'PENDENTE' },
        select: { id: true, nome: true, email: true, curso: true, status: true, criadoEm: true },
        orderBy: { criadoEm: 'desc' },
        take: 5,
      }),
      prisma.oficina.findMany({
        where: { status: 'PLANEJADA', data: { gte: agora } },
        orderBy: { data: 'asc' },
        take: 3,
        include: { _count: { select: { participacoes: true } } },
      }),
      prisma.termoVoluntariado.count(),
    ]);

  const horasPorMes = meses.map((mes) => ({ mes, horas: 0 }));
  participacoesPeriodo.forEach((p) => {
    const item = horasPorMes.find((m) => m.mes === chaveMes(p.oficina.data));
    if (item) item.horas += p.horasValidas;
  });

  const porStatusVol = contarPorStatus(statusVol, ['PENDENTE', 'APROVADO', 'ATIVO', 'DESLIGADO']);
  return {
    voluntarios: {
      total: Object.values(porStatusVol).reduce((a, b) => a + b, 0),
      porStatus: porStatusVol,
      ativos, // até 5, para os avatares
    },
    oficinas: { porStatus: contarPorStatus(statusOf, ['PLANEJADA', 'REALIZADA', 'CANCELADA']) },
    horasTotais: horas._sum.horasValidas || 0,
    horasPorMes,
    inscricoesRecentes: pendentes,
    proximasOficinas: proximas.map(({ _count, ...o }) => ({ ...o, totalParticipantes: _count.participacoes })),
    termosEmitidos,
  };
}

module.exports = { resumo, ultimosMeses };
