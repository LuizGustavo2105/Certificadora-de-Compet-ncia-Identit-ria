// Máquina de estados do voluntário (RN01).
// Cada status lista para quais status ele pode ir.
const TRANSICOES = {
  PENDENTE: ['APROVADO', 'DESLIGADO'], // DESLIGADO a partir de PENDENTE = inscrição rejeitada
  APROVADO: ['ATIVO'],
  ATIVO: ['DESLIGADO'],
  DESLIGADO: [], // estado final
};

function podeTransitar(de, para) {
  return (TRANSICOES[de] || []).includes(para);
}

// Campos de data que mudam junto com o status (RN02).
function datasDaTransicao(para, agora = new Date()) {
  if (para === 'ATIVO') return { dataEntrada: agora };
  if (para === 'DESLIGADO') return { dataSaida: agora };
  return {};
}

// Ciclo de vida da oficina: só sai de PLANEJADA; REALIZADA e CANCELADA são finais.
const TRANSICOES_OFICINA = {
  PLANEJADA: ['REALIZADA', 'CANCELADA'],
  REALIZADA: [],
  CANCELADA: [],
};

function oficinaPodeTransitar(de, para) {
  return (TRANSICOES_OFICINA[de] || []).includes(para);
}

module.exports = {
  TRANSICOES,
  podeTransitar,
  datasDaTransicao,
  TRANSICOES_OFICINA,
  oficinaPodeTransitar,
};
