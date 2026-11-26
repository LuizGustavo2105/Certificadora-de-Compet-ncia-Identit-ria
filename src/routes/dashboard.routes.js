const { Router } = require('express');
const async = require('../lib/async');
const { autenticar } = require('../middlewares/auth');
const { resumo } = require('../services/dashboard.service');

const router = Router();

// Números da tela "Visão geral" (somente coordenadores logados).
router.get('/', autenticar, async(async (req, res) => res.json(await resumo())));

module.exports = router;
