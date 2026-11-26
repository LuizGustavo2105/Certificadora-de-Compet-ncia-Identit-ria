// Recebe as requisições de login e repassa para o service.
const authService = require('../services/auth.service');
const usuariosService = require('../services/usuarios.service');
const { loginSchema } = require('../schemas/usuario.schema');

async function login(req, res) {
  const dados = loginSchema.parse(req.body);
  res.json(await authService.login(dados));
}

// Devolve o usuário dono do token (o front usa para saber quem está logado).
async function eu(req, res) {
  res.json(await usuariosService.buscarPorId(req.usuario.id));
}

module.exports = { login, eu };
