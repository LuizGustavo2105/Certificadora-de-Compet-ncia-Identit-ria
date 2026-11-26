const { Router } = require('express');
const async = require('../lib/async');
const { autenticar } = require('../middlewares/auth');
const ctrl = require('../controllers/oficinas.controller');

const router = Router();

// Todas as rotas de oficinas exigem coordenador logado.
router.use(autenticar);

router.get('/', async(ctrl.listar));
router.get('/:id', async(ctrl.buscar));
router.post('/', async(ctrl.criar));
router.patch('/:id', async(ctrl.atualizar));
router.patch('/:id/status', async(ctrl.mudarStatus));

// Vínculo voluntário x oficina (M:N)
router.post('/:id/participacoes', async(ctrl.vincular));
router.patch('/:id/participacoes/:participacaoId', async(ctrl.atualizarParticipacao));
router.delete('/:id/participacoes/:participacaoId', async(ctrl.desvincular));

module.exports = router;
