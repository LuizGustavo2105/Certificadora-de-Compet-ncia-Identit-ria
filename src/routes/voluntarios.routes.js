const { Router } = require('express');
const async = require('../lib/async');
const { autenticar } = require('../middlewares/auth');
const ctrl = require('../controllers/voluntarios.controller');

const router = Router();

// Pública: formulário /participar
router.post('/pre-cadastro', async(ctrl.preCadastro));

// Daqui para baixo, só coordenadores logados (ADMIN ou COORDENADOR).
router.use(autenticar);

router.get('/', async(ctrl.listar));
router.get('/:id', async(ctrl.buscar));
router.patch('/:id', async(ctrl.atualizar));
router.patch('/:id/status', async(ctrl.mudarStatus));

module.exports = router;
