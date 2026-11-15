// Testes de integração: chamam a API de verdade (Express + Prisma + PostgreSQL de teste).
// Rode com: npm run test:integracao (precisa do Docker com o banco ligado).
// Os testes rodam em ordem e um aproveita os dados do anterior (fluxo completo do sistema).
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { prisma, limparBanco, criarUsuario, iniciarServidor } = require('./ambiente');

let servidor;
let req;
const tk = {}; // tokens: admin e coordenador
const id = {}; // ids criados ao longo do fluxo

before(async () => {
  await limparBanco();
  await criarUsuario({ nome: 'Admin Teste', email: 'admin@teste.com', senha: 'senha-admin-123', perfil: 'ADMIN' });
  await criarUsuario({ nome: 'Coord Teste', email: 'coord@teste.com', senha: 'senha-coord-123', perfil: 'COORDENADOR' });
  await criarUsuario({ nome: 'Inativo', email: 'inativo@teste.com', senha: 'senha-inat-123', perfil: 'COORDENADOR', ativo: false });
  ({ servidor, req } = await iniciarServidor());
});

after(async () => {
  await limparBanco();
  servidor.close();
  await prisma.$disconnect();
});

// ---------- Autenticação e usuários ----------

test('GET /health responde', async () => {
  const r = await req('GET', '/health');
  assert.equal(r.status, 200);
  assert.equal(r.dados.status, 'ok');
});

test('Login: senha errada, usuário inativo e sucesso', async () => {
  assert.equal((await req('POST', '/auth/login', { corpo: { email: 'admin@teste.com', senha: 'errada' } })).status, 401);
  assert.equal((await req('POST', '/auth/login', { corpo: { email: 'inativo@teste.com', senha: 'senha-inat-123' } })).status, 403);
  assert.equal((await req('POST', '/auth/login', { corpo: { email: 'nao-e-email', senha: 'x' } })).status, 400);

  const admin = await req('POST', '/auth/login', { corpo: { email: 'ADMIN@teste.com', senha: 'senha-admin-123' } });
  assert.equal(admin.status, 200);
  assert.equal(admin.dados.usuario.senhaHash, undefined, 'o hash da senha nunca sai na resposta');
  tk.admin = admin.dados.token;
  tk.coord = (await req('POST', '/auth/login', { corpo: { email: 'coord@teste.com', senha: 'senha-coord-123' } })).dados.token;

  const eu = await req('GET', '/auth/me', { token: tk.admin });
  assert.equal(eu.dados.perfil, 'ADMIN');
  assert.equal((await req('GET', '/auth/me', { token: 'token-falso' })).status, 401);
});

test('Usuários: só ADMIN gerencia; desativar em vez de apagar', async () => {
  assert.equal((await req('GET', '/usuarios', { token: tk.coord })).status, 403);

  const novo = await req('POST', '/usuarios', {
    token: tk.admin,
    corpo: { nome: 'Novo Coord', email: 'novo@teste.com', senha: 'senha-nova-123' },
  });
  assert.equal(novo.status, 201);
  assert.equal(novo.dados.perfil, 'COORDENADOR');
  assert.equal((await req('POST', '/usuarios', { token: tk.admin, corpo: { nome: 'Dup', email: 'novo@teste.com', senha: 'senha-nova-123' } })).status, 409);

  const desativado = await req('DELETE', `/usuarios/${novo.dados.id}`, { token: tk.admin });
  assert.equal(desativado.dados.ativo, false);
  assert.ok(await prisma.usuario.findUnique({ where: { id: novo.dados.id } }), 'o registro continua no banco');

  // O ADMIN não pode desativar a si mesmo
  const eu = await req('GET', '/auth/me', { token: tk.admin });
  assert.equal((await req('DELETE', `/usuarios/${eu.dados.id}`, { token: tk.admin })).status, 400);
});

// ---------- Voluntários ----------

test('Pré-cadastro público exige consentimento LGPD', async () => {
  const dados = {
    nome: 'Ana Fictícia',
    email: 'ana@exemplo.com',
    ra: '',
    interesses: ['Robótica'],
    disponibilidades: [{ diaSemana: 2, horaInicio: '14:00', horaFim: '18:00' }],
  };
  assert.equal((await req('POST', '/voluntarios/pre-cadastro', { corpo: dados })).status, 400);

  const r = await req('POST', '/voluntarios/pre-cadastro', { corpo: { ...dados, consentimentoLgpd: true } });
  assert.equal(r.status, 201);
  assert.deepEqual(Object.keys(r.dados).sort(), ['id', 'status'], 'resposta pública sem dados pessoais');
  id.ana = r.dados.id;

  // RA em branco vira null: um segundo voluntário sem RA não dá conflito
  const bruno = await req('POST', '/voluntarios/pre-cadastro', {
    corpo: { nome: 'Bruno Fictício', email: 'bruno@exemplo.com', ra: '', consentimentoLgpd: true },
  });
  assert.equal(bruno.status, 201);
  id.bruno = bruno.dados.id;

  const salvo = await prisma.voluntario.findUnique({ where: { id: id.ana } });
  assert.equal(salvo.status, 'PENDENTE');
  assert.ok(salvo.consentimentoEm, 'data do consentimento registrada');
  assert.equal(salvo.ra, null);
});

test('RN01 a RN03: máquina de estados com histórico', async () => {
  const mudar = (vid, para) => req('PATCH', `/voluntarios/${vid}/status`, { token: tk.coord, corpo: { para } });

  assert.equal((await mudar(id.ana, 'ATIVO')).status, 422, 'não pode pular de PENDENTE para ATIVO');
  assert.equal((await mudar(id.ana, 'APROVADO')).status, 200);
  const ativo = await mudar(id.ana, 'ATIVO');
  assert.ok(ativo.dados.dataEntrada, 'RN02: dataEntrada preenchida');
  assert.deepEqual(ativo.dados.historico.map((h) => `${h.de}>${h.para}`), ['PENDENTE>APROVADO', 'APROVADO>ATIVO']);

  // Rejeição de inscrição
  const rejeitado = await mudar(id.bruno, 'DESLIGADO');
  assert.ok(rejeitado.dados.dataSaida, 'RN02: dataSaida preenchida');
  assert.equal((await mudar(id.bruno, 'ATIVO')).status, 422, 'DESLIGADO é final');
});

test('Listagem de voluntários com filtros', async () => {
  const lista = (q) => req('GET', `/voluntarios?${q}`, { token: tk.coord }).then((r) => r.dados.map((v) => v.nome));
  assert.deepEqual(await lista('status=ATIVO'), ['Ana Fictícia']);
  assert.deepEqual(await lista('busca=bruno'), ['Bruno Fictício']);
  assert.deepEqual(await lista('interesse=Robótica'), ['Ana Fictícia']);
  assert.deepEqual(await lista('diaSemana=2'), ['Ana Fictícia']);
  assert.equal((await req('GET', '/voluntarios')).status, 401);
});

// ---------- Oficinas e participações ----------

test('RN07 a RN09: vínculo voluntário x oficina', async () => {
  const criar = (tema, data, cargaHoraria) =>
    req('POST', '/oficinas', { token: tk.coord, corpo: { tema, data, local: 'Lab', cargaHoraria } }).then((r) => r.dados.id);
  id.of1 = await criar('Robótica', '2026-10-05T14:00:00Z', 4);
  id.of2 = await criar('Scratch', '2026-10-12T14:00:00Z', 3);

  const vincular = (oficinaId, corpo) => req('POST', `/oficinas/${oficinaId}/participacoes`, { token: tk.coord, corpo });
  assert.equal((await vincular(id.of1, { voluntarioId: id.bruno })).status, 422, 'RN08: só voluntário ATIVO');
  assert.equal((await vincular(id.of1, { voluntarioId: id.ana, horasValidas: 9 })).status, 422, 'horas acima da carga');

  const p1 = await vincular(id.of1, { voluntarioId: id.ana });
  assert.equal(p1.status, 201);
  assert.equal(p1.dados.horasValidas, 4, 'padrão = carga horária da oficina');
  id.p1 = p1.dados.id;
  assert.equal((await vincular(id.of1, { voluntarioId: id.ana })).status, 409, 'RN07: sem duplicidade');

  const p2 = await vincular(id.of2, { voluntarioId: id.ana, papel: 'APOIO', horasValidas: 2.5 });
  id.p2 = p2.dados.id;

  await req('PATCH', `/oficinas/${id.of1}/status`, { token: tk.coord, corpo: { para: 'REALIZADA' } });
  assert.equal((await req('DELETE', `/oficinas/${id.of1}/participacoes/${id.p1}`, { token: tk.coord })).status, 422, 'RN09');
  assert.equal((await req('PATCH', `/oficinas/${id.of1}/status`, { token: tk.coord, corpo: { para: 'CANCELADA' } })).status, 422);
});

test('RN04 a RN06: termo em PDF com hash e validação pública', async () => {
  // Bruno não tem participações: RN04
  assert.equal((await req('POST', '/termos', { token: tk.coord, corpo: { voluntarioId: id.bruno } })).status, 422);

  // Só a oficina 1 está realizada: RN05 conta 4h (a oficina 2 ainda está planejada)
  const termo = await req('POST', '/termos', { token: tk.coord, corpo: { voluntarioId: id.ana } });
  assert.equal(termo.status, 201);
  assert.equal(termo.dados.totalHoras, 4);
  assert.match(termo.dados.hashValidacao, /^[a-f0-9]{64}$/);

  const pdf = await req('GET', `/termos/${termo.dados.id}/pdf`, { token: tk.coord });
  assert.equal(pdf.status, 200);
  assert.ok(pdf.tipo.includes('application/pdf'));
  assert.equal(pdf.dados.subarray(0, 5).toString(), '%PDF-');

  // Validação pública (sem token) e sem dados pessoais além do nome
  const valido = await req('GET', `/termos/validar/${termo.dados.hashValidacao}`);
  assert.deepEqual(
    { valido: valido.dados.valido, integro: valido.dados.integro, voluntario: valido.dados.voluntario, horas: valido.dados.totalHoras },
    { valido: true, integro: true, voluntario: 'Ana Fictícia', horas: 4 },
  );
  assert.equal(valido.dados.email, undefined);
  assert.equal((await req('GET', `/termos/validar/${'0'.repeat(64)}`)).dados.valido, false);
  assert.equal((await req('GET', '/termos/validar/abc')).status, 400);

  // Alterar as horas de uma oficina já incluída no termo é detectado
  await req('PATCH', `/oficinas/${id.of1}/participacoes/${id.p1}`, { token: tk.coord, corpo: { horasValidas: 3 } });
  assert.equal((await req('GET', `/termos/validar/${termo.dados.hashValidacao}`)).dados.integro, false);
});

test('Dashboard resume os números', async () => {
  const r = await req('GET', '/dashboard', { token: tk.coord });
  assert.equal(r.status, 200);
  assert.equal(r.dados.voluntarios.total, 2);
  assert.equal(r.dados.voluntarios.porStatus.ATIVO, 1);
  assert.equal(r.dados.voluntarios.porStatus.DESLIGADO, 1);
  assert.equal(r.dados.oficinas.porStatus.REALIZADA, 1);
  assert.equal(r.dados.horasTotais, 3, 'RN05: só a oficina realizada, já com o ajuste para 3h');
  assert.equal(r.dados.termosEmitidos, 1);
  assert.equal(r.dados.horasPorMes.length, 6);
});
