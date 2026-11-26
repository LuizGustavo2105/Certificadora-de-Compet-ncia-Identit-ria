// Junta todas as rotas da API.
const { Router } = require('express');

const router = Router();

router.use('/auth', require('./auth.routes'));
router.use('/usuarios', require('./usuarios.routes'));
router.use('/voluntarios', require('./voluntarios.routes'));
router.use('/oficinas', require('./oficinas.routes'));
router.use('/termos', require('./termos.routes'));
router.use('/dashboard', require('./dashboard.routes'));

module.exports = router;
