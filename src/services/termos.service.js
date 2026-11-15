// Regras do Termo de Voluntariado: emissão (RN04 a RN06), PDF e validação pública.
const prisma = require('../lib/prisma');
const { ErroApp } = require('../lib/erros');
const { atividadesDoTermo, conteudoDoTermo, hashDoConteudo } = require('./hash');
const { gerarPdfTermo } = require('./pdf');

const incluirParticipacoes = { participacoes: { include: { oficina: true } } };

function urlValidacao(hash) {
  const base = (process.env.FRONT_URL || 'http://localhost:5173').replace(/\/$/, '');
  return `${base}/validar/${hash}`;
}

// Emite um termo novo com as horas atuais do voluntário.
async function emitir(voluntarioId, usuarioId) {
  const voluntario = await prisma.voluntario.findUnique({
    where: { id: voluntarioId },
    include: incluirParticipacoes,
  });
  if (!voluntario) throw new ErroApp(404, 'Voluntário não encontrado');

  // Um só instante para o conteúdo e para a data gravada: assim o hash pode ser recalculado depois.
  const emitidoEm = new Date();
  emitidoEm.setMilliseconds(0);
  const atividades = atividadesDoTermo(voluntario.participacoes, emitidoEm);

  // RN04: só recebe termo quem tem participação em oficina realizada.
  if (atividades.length === 0) {
    throw new ErroApp(422, 'O voluntário não tem participações em oficinas realizadas');
  }

  const conteudo = conteudoDoTermo(voluntarioId, atividades, emitidoEm);
  const termo = await prisma.termoVoluntariado.create({
    data: {
      voluntarioId,
      geradoPorId: usuarioId,
      totalHoras: conteudo.totalHoras,
      hashValidacao: hashDoConteudo(conteudo),
      geradoEm: emitidoEm,
    },
  });
  return buscarPorId(termo.id);
}

async function listar({ voluntarioId } = {}) {
  return prisma.termoVoluntariado.findMany({
    where: voluntarioId ? { voluntarioId } : {},
    orderBy: { geradoEm: 'desc' },
    include: {
      voluntario: { select: { id: true, nome: true } },
      geradoPor: { select: { id: true, nome: true } },
    },
  });
}

async function buscarPorId(id) {
  const termo = await prisma.termoVoluntariado.findUnique({
    where: { id },
    include: {
      voluntario: { select: { id: true, nome: true } },
      geradoPor: { select: { id: true, nome: true } },
    },
  });
  if (!termo) throw new ErroApp(404, 'Termo não encontrado');
  return termo;
}

// Carrega o termo e recalcula o conteúdo com os dados atuais do banco.
async function carregarCompleto(where) {
  const termo = await prisma.termoVoluntariado.findUnique({
    where,
    include: {
      voluntario: { include: incluirParticipacoes },
      geradoPor: { select: { nome: true } },
    },
  });
  if (!termo) return null;
  const atividades = atividadesDoTermo(termo.voluntario.participacoes, termo.geradoEm);
  const conteudo = conteudoDoTermo(termo.voluntarioId, atividades, termo.geradoEm);
  // Se alguém alterou horas de oficinas já incluídas no termo, o hash recalculado muda.
  const integro = hashDoConteudo(conteudo) === termo.hashValidacao;
  return { termo, atividades, integro };
}

async function gerarPdf(id) {
  const completo = await carregarCompleto({ id });
  if (!completo) throw new ErroApp(404, 'Termo não encontrado');
  const { termo, atividades } = completo;
  return gerarPdfTermo({
    voluntario: termo.voluntario,
    atividades,
    totalHoras: termo.totalHoras, // vale o total gravado na emissão
    emitidoEm: termo.geradoEm,
    emitidoPor: termo.geradoPor.nome,
    hash: termo.hashValidacao,
    urlValidacao: urlValidacao(termo.hashValidacao),
  });
}

// Consulta pública: devolve só o necessário para conferir o termo (LGPD).
async function validar(hash) {
  const completo = await carregarCompleto({ hashValidacao: hash });
  if (!completo) return { valido: false };
  const { termo, integro } = completo;
  return {
    valido: true,
    integro,
    voluntario: termo.voluntario.nome,
    totalHoras: termo.totalHoras,
    emitidoEm: termo.geradoEm,
  };
}

module.exports = { emitir, listar, buscarPorId, gerarPdf, validar };
