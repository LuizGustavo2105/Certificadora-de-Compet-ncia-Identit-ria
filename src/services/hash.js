// Conteúdo e hash do Termo de Voluntariado (RN05 e RN06).
// Funções puras (sem banco), para serem testadas isoladamente.
const crypto = require('crypto');
const { totalHoras } = require('./horas');

// Atividades que entram no termo: participações em oficinas REALIZADAS
// com data até o momento da emissão. Ordem fixa (data, depois id) para o hash ser sempre igual.
function atividadesDoTermo(participacoes, emitidoEm) {
  return participacoes
    .filter((p) => p.oficina.status === 'REALIZADA' && p.oficina.data <= emitidoEm)
    .sort((a, b) => a.oficina.data - b.oficina.data || a.oficina.id.localeCompare(b.oficina.id));
}

// Monta o conteúdo do termo sempre com as mesmas chaves na mesma ordem.
function conteudoDoTermo(voluntarioId, atividades, emitidoEm) {
  return {
    voluntarioId,
    totalHoras: totalHoras(atividades),
    atividades: atividades.map((p) => ({
      oficinaId: p.oficina.id,
      tema: p.oficina.tema,
      data: p.oficina.data.toISOString(),
      papel: p.papel,
      horas: p.horasValidas,
    })),
    emitidoEm: emitidoEm.toISOString(),
  };
}

// RN06: SHA-256 do conteúdo, em hexadecimal (64 caracteres).
function hashDoConteudo(conteudo) {
  return crypto.createHash('sha256').update(JSON.stringify(conteudo)).digest('hex');
}

module.exports = { atividadesDoTermo, conteudoDoTermo, hashDoConteudo };
