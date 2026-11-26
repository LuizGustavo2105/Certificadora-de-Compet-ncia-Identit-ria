// Textos, opções e formatações usados em várias telas.

// Espelho da máquina de estados da API (src/services/fsm.js, RN01).
// Serve só para mostrar os botões certos: quem decide de verdade é a API.
export const TRANSICOES = {
  PENDENTE: ['APROVADO', 'DESLIGADO'],
  APROVADO: ['ATIVO'],
  ATIVO: ['DESLIGADO'],
  DESLIGADO: [],
};

export const STATUS_VOLUNTARIO = {
  PENDENTE: { rotulo: 'Pendente', classe: 'bg-warning-soft text-warning' },
  APROVADO: { rotulo: 'Aprovado', classe: 'bg-blue-soft text-blue' },
  ATIVO: { rotulo: 'Ativo', classe: 'bg-success-soft text-success' },
  DESLIGADO: { rotulo: 'Desligado', classe: 'bg-muted text-muted-foreground' },
};

// Texto do botão de cada transição (o "PENDENTE → DESLIGADO" é a rejeição da inscrição).
export function rotuloAcao(de, para) {
  if (para === 'APROVADO') return 'Aprovar';
  if (para === 'ATIVO') return 'Ativar';
  if (para === 'DESLIGADO') return de === 'PENDENTE' ? 'Rejeitar' : 'Desligar';
  return para;
}

export const STATUS_OFICINA = {
  PLANEJADA: { rotulo: 'Programada', classe: 'bg-blue-soft text-blue' },
  REALIZADA: { rotulo: 'Concluída', classe: 'bg-success-soft text-success' },
  CANCELADA: { rotulo: 'Cancelada', classe: 'bg-rose-soft text-rose' },
};

export const PAPEIS = { MINISTRANTE: 'Ministrante', APOIO: 'Apoio' };

export const CURSOS = [
  'Análise e Desenvolvimento de Sistemas',
  'Engenharia de Computação',
  'Engenharia Elétrica',
  'Outro',
];

export const AREAS = ['Robótica', 'Programação', 'Matemática'];

// Os períodos do formulário viram registros de Disponibilidade (diaSemana 0 = domingo).
export const PERIODOS = [
  { chave: 'ter-tarde', rotulo: 'Terça-feira à tarde', diaSemana: 2, horaInicio: '14:00', horaFim: '18:00' },
  { chave: 'qui-tarde', rotulo: 'Quinta-feira à tarde', diaSemana: 4, horaInicio: '14:00', horaFim: '18:00' },
  { chave: 'sab-manha', rotulo: 'Sábado de manhã', diaSemana: 6, horaInicio: '08:00', horaFim: '12:00' },
];

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function descreverDisponibilidade(d) {
  return `${DIAS[d.diaSemana]} · ${d.horaInicio}–${d.horaFim}`;
}

export function iniciais(nome = '') {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] || '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

const fmtData = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtHora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

export const formatarData = (iso) => (iso ? fmtData.format(new Date(iso)).replace('.', '') : '—');
export const formatarHora = (iso) => fmtHora.format(new Date(iso));
export const formatarDataHora = (iso) => `${formatarData(iso)} · ${formatarHora(iso)}`;

export function formatarHoras(h) {
  const n = Number(h) || 0;
  return `${Number.isInteger(n) ? n : n.toFixed(1).replace('.', ',')} h`;
}

// Semestre atual, ex.: "2026.2"
export function semestreAtual(data = new Date()) {
  return `${data.getFullYear()}.${data.getMonth() < 6 ? 1 : 2}`;
}
