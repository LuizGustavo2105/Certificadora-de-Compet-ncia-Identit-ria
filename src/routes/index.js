// Junta todas as rotas da API.
const { Router } = require('express');

const router = Router();

router.use('/auth', require('./auth.routes'));
router.use('/usuarios', require('./usuarios.routes'));
router.use('/voluntarios', require('./voluntarios.routes'));

module.exports = router;
