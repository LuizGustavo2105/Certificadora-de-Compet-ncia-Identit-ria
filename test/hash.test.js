// Testes unitários do conteúdo e do hash do termo (RN05 e RN06).
const test = require('node:test');
const assert = require('node:assert/strict');
const { atividadesDoTermo, conteudoDoTermo, hashDoConteudo } = require('../src/services/hash');

const emitidoEm = new Date('2026-11-20T12:00:00Z');
const oficina = (id, data, status = 'REALIZADA') => ({ id, tema: `Oficina ${id}`, data: new Date(data), status });
const participacoes = [
  { papel: 'APOIO', horasValidas: 2, oficina: oficina('b', '2026-11-10T14:00:00Z') },
  { papel: 'MINISTRANTE', horasValidas: 4, oficina: oficina('a', '2026-11-05T14:00:00Z') },
  { papel: 'APOIO', horasValidas: 3, oficina: oficina('c', '2026-11-12T14:00:00Z', 'PLANEJADA') },
  { papel: 'APOIO', horasValidas: 5, oficina: oficina('d', '2026-11-25T14:00:00Z') }, // depois da emissão
];

test('Só entram oficinas realizadas até a emissão, em ordem de data', () => {
  const atividades = atividadesDoTermo(participacoes, emitidoEm);
  assert.deepEqual(atividades.map((p) => p.oficina.id), ['a', 'b']);
});

test('RN05: total de horas do conteúdo', () => {
  const conteudo = conteudoDoTermo('vol-1', atividadesDoTermo(participacoes, emitidoEm), emitidoEm);
  assert.equal(conteudo.totalHoras, 6);
  assert.equal(conteudo.emitidoEm, '2026-11-20T12:00:00.000Z');
});

test('RN06: hash SHA-256 é estável e muda se o conteúdo mudar', () => {
  const montar = (lista) => conteudoDoTermo('vol-1', atividadesDoTermo(lista, emitidoEm), emitidoEm);
  const hash = hashDoConteudo(montar(participacoes));
  assert.match(hash, /^[a-f0-9]{64}$/);
  // Mesma entrada em outra ordem gera o mesmo hash
  assert.equal(hashDoConteudo(montar([...participacoes].reverse())), hash);
  // Alterar as horas muda o hash
  const alterada = participacoes.map((p, i) => (i === 0 ? { ...p, horasValidas: 1 } : p));
  assert.notEqual(hashDoConteudo(montar(alterada)), hash);
});
