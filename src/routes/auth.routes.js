const { Router } = require('express');
const async = require('../lib/async');
const { autenticar } = require('../middlewares/auth');
const ctrl = require('../controllers/auth.controller');

const router = Router();

router.post('/login', async(ctrl.login));
router.get('/me', autenticar, async(ctrl.eu));

module.exports = router;
