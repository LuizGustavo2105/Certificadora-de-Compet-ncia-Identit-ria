// Dados FICTÍCIOS para demonstração (seminário e testes manuais). Rode com: npm run seed:demo
// Precisa do ADMIN criado antes (npm run seed). Não roda duas vezes: confere se já existe.
// Os dados seguem as regras de negócio: histórico de status (RN03), datas (RN02),
// só voluntários ATIVOS vinculados (RN08) e horas dentro da carga da oficina.
require('dotenv').config({ quiet: true });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const DOMINIO = '@exemplo.ellp'; // marca os registros fictícios

const diasAtras = (n, hora = 14) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hora, 0, 0, 0);
  return d;
};

const VOLUNTARIOS = [
  { nome: 'Ana Beatriz Souza', curso: 'Análise e Desenvolvimento de Sistemas', interesses: ['Robótica'], status: 'ATIVO', dia: 2 },
  { nome: 'Bruno Henrique Lima', curso: 'Engenharia de Computação', interesses: ['Programação'], status: 'ATIVO', dia: 4 },
  { nome: 'Carla Mendes Rocha', curso: 'Engenharia Elétrica', interesses: ['Robótica', 'Matemática'], status: 'ATIVO', dia: 6 },
  { nome: 'Diego Alves Pereira', curso: 'Análise e Desenvolvimento de Sistemas', interesses: ['Programação'], status: 'ATIVO', dia: 2 },
  { nome: 'Eduarda Martins Costa', curso: 'Engenharia de Computação', interesses: ['Matemática'], status: 'APROVADO', dia: 4 },
  { nome: 'Felipe Ramos Oliveira', curso: 'Análise e Desenvolvimento de Sistemas', interesses: ['Robótica'], status: 'PENDENTE', dia: 6 },
  { nome: 'Gabriela Nunes Ferreira', curso: 'Engenharia Elétrica', interesses: ['Programação'], status: 'PENDENTE', dia: 2 },
  { nome: 'Henrique Barbosa Dias', curso: 'Engenharia de Computação', interesses: ['Robótica'], status: 'DESLIGADO', dia: 4 },
];

const CAMINHO = { PENDENTE: [], APROVADO: ['APROVADO'], ATIVO: ['APROVADO', 'ATIVO'], DESLIGADO: ['APROVADO', 'ATIVO', 'DESLIGADO'] };

const OFICINAS = [
  { tema: 'Primeiros passos na robótica', dias: 120, carga: 4, status: 'REALIZADA', equipe: [0, 2] },
  { tema: 'Lógica de programação com Scratch', dias: 90, carga: 3, status: 'REALIZADA', equipe: [1, 3] },
  { tema: 'Matemática com jogos', dias: 60, carga: 2, status: 'REALIZADA', equipe: [2] },
  { tema: 'Montando um robô seguidor de linha', dias: 30, carga: 4, status: 'REALIZADA', equipe: [0, 1, 3] },
  { tema: 'Introdução ao Arduino', dias: 10, carga: 3, status: 'CANCELADA', equipe: [] },
  { tema: 'Programando jogos simples', dias: -7, carga: 3, status: 'PLANEJADA', equipe: [1, 3] },
  { tema: 'Feira de projetos ELLP', dias: -21, carga: 5, status: 'PLANEJADA', equipe: [0] },
];

async function main() {
  const admin = await prisma.usuario.findFirst({ where: { perfil: 'ADMIN', ativo: true } });
  if (!admin) throw new Error('Crie o ADMIN antes: npm run seed');
  if (await prisma.voluntario.findFirst({ where: { email: { endsWith: DOMINIO } } })) {
    console.log('Os dados de demonstração já existem. Nada foi alterado.');
    return;
  }

  const voluntarios = [];
  for (const [i, v] of VOLUNTARIOS.entries()) {
    const inscricao = diasAtras(150 - i * 5, 10);
    const passos = CAMINHO[v.status];
    const datas = passos.map((_, n) => diasAtras(140 - i * 5 - n * 3, 11)); // uma transição a cada 3 dias
    const criado = await prisma.voluntario.create({
      data: {
        nome: v.nome,
        email: `${v.nome.split(' ')[0].toLowerCase()}${DOMINIO}`,
        ra: `a${2400000 + i}`,
        curso: v.curso,
        interesses: v.interesses,
        status: v.status,
        consentimentoLgpd: true,
        consentimentoEm: inscricao,
        criadoEm: inscricao,
        dataEntrada: passos.includes('ATIVO') ? datas[passos.indexOf('ATIVO')] : null,
        dataSaida: passos.includes('DESLIGADO') ? datas[passos.indexOf('DESLIGADO')] : null,
        disponibilidades: {
          create: [{ diaSemana: v.dia, horaInicio: v.dia === 6 ? '08:00' : '14:00', horaFim: v.dia === 6 ? '12:00' : '18:00' }],
        },
        historico: {
          create: passos.map((para, n) => ({
            de: n === 0 ? 'PENDENTE' : passos[n - 1],
            para,
            usuarioId: admin.id,
            em: datas[n],
          })),
        },
      },
    });
    voluntarios.push(criado);
  }

  for (const o of OFICINAS) {
    await prisma.oficina.create({
      data: {
        tema: o.tema,
        descricao: 'Oficina fictícia criada para demonstração do sistema.',
        data: diasAtras(o.dias),
        local: 'Laboratório de Robótica · UTFPR-CP',
        cargaHoraria: o.carga,
        status: o.status,
        participacoes: {
          create: o.equipe.map((idx, n) => ({
            voluntarioId: voluntarios[idx].id,
            papel: n === 0 ? 'MINISTRANTE' : 'APOIO',
            horasValidas: o.carga,
          })),
        },
      },
    });
  }

  console.log(`Demonstração pronta: ${voluntarios.length} voluntários e ${OFICINAS.length} oficinas fictícias.`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
