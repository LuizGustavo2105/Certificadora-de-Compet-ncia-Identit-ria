const { Router } = require('express');
const async = require('../lib/async');
const { autenticar, exigirPerfil } = require('../middlewares/auth');
const ctrl = require('../controllers/usuarios.controller');

const router = Router();

// Todas as rotas de usuários exigem login de ADMIN.
router.use(autenticar, exigirPerfil('ADMIN'));

router.get('/', async(ctrl.listar));
router.get('/:id', async(ctrl.buscar));
router.post('/', async(ctrl.criar));
router.patch('/:id', async(ctrl.atualizar));
router.delete('/:id', async(ctrl.desativar));

module.exports = router;
