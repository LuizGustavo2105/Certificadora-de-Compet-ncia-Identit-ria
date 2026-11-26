const { Router } = require('express');
const async = require('../lib/async');
const { autenticar } = require('../middlewares/auth');
const ctrl = require('../controllers/termos.controller');

const router = Router();

// Pública: qualquer pessoa confere um termo pelo código de validação.
router.get('/validar/:hash', async(ctrl.validar));

// Daqui para baixo, só coordenadores logados.
router.use(autenticar);

router.get('/', async(ctrl.listar));
router.post('/', async(ctrl.emitir));
router.get('/:id', async(ctrl.buscar));
router.get('/:id/pdf', async(ctrl.pdf));

module.exports = router;
