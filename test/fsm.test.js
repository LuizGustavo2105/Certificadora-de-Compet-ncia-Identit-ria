// Testes unitários da máquina de estados (RN01, RN02) e do cálculo de horas (RN05).
// Rode com: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { podeTransitar, datasDaTransicao, oficinaPodeTransitar } = require('../src/services/fsm');
const { totalHoras } = require('../src/services/horas');

test('RN01: transições permitidas', () => {
  assert.ok(podeTransitar('PENDENTE', 'APROVADO'));
  assert.ok(podeTransitar('APROVADO', 'ATIVO'));
  assert.ok(podeTransitar('ATIVO', 'DESLIGADO'));
  assert.ok(podeTransitar('PENDENTE', 'DESLIGADO')); // rejeição
});

test('RN01: transições proibidas', () => {
  assert.equal(podeTransitar('PENDENTE', 'ATIVO'), false); // pular etapa
  assert.equal(podeTransitar('ATIVO', 'PENDENTE'), false); // voltar
  assert.equal(podeTransitar('APROVADO', 'DESLIGADO'), false);
  assert.equal(podeTransitar('DESLIGADO', 'ATIVO'), false); // estado final
  assert.equal(podeTransitar('ATIVO', 'ATIVO'), false);
  assert.equal(podeTransitar('INEXISTENTE', 'ATIVO'), false);
});

test('RN02: datas preenchidas na transição', () => {
  const agora = new Date('2026-11-15T10:00:00Z');
  assert.deepEqual(datasDaTransicao('ATIVO', agora), { dataEntrada: agora });
  assert.deepEqual(datasDaTransicao('DESLIGADO', agora), { dataSaida: agora });
  assert.deepEqual(datasDaTransicao('APROVADO', agora), {});
});

test('RN05: soma só oficinas realizadas', () => {
  const participacoes = [
    { horasValidas: 4, oficina: { status: 'REALIZADA' } },
    { horasValidas: 2.5, oficina: { status: 'REALIZADA' } },
    { horasValidas: 3, oficina: { status: 'PLANEJADA' } },
    { horasValidas: 5, oficina: { status: 'CANCELADA' } },
  ];
  assert.equal(totalHoras(participacoes), 6.5);
  assert.equal(totalHoras([]), 0);
});

test('Oficina: só sai de PLANEJADA', () => {
  assert.ok(oficinaPodeTransitar('PLANEJADA', 'REALIZADA'));
  assert.ok(oficinaPodeTransitar('PLANEJADA', 'CANCELADA'));
  assert.equal(oficinaPodeTransitar('REALIZADA', 'CANCELADA'), false);
  assert.equal(oficinaPodeTransitar('CANCELADA', 'PLANEJADA'), false);
  assert.equal(oficinaPodeTransitar('PLANEJADA', 'PLANEJADA'), false);
});
