// Middlewares de segurança do painel administrativo.
const jwt = require('jsonwebtoken');

// Exige o cabeçalho "Authorization: Bearer <token>" com um JWT válido.
function autenticar(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ erro: 'Token não informado' });
  }
  try {
    const dados = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: dados.sub, perfil: dados.perfil };
    return next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

// Libera a rota só para os perfis informados. Ex.: exigirPerfil('ADMIN')
function exigirPerfil(...perfis) {
  return (req, res, next) => {
    if (!req.usuario || !perfis.includes(req.usuario.perfil)) {
      return res.status(403).json({ erro: 'Acesso negado para este perfil' });
    }
    return next();
  };
}

module.exports = { autenticar, exigirPerfil };
