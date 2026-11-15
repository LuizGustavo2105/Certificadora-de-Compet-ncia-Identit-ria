// Regras de login: confere e-mail e senha e gera o token JWT.
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { ErroApp } = require('../lib/erros');
const { semSenha } = require('./usuarios.service');

async function login({ email, senha }) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  // Mesma mensagem para e-mail inexistente e senha errada: não revela quais e-mails existem.
  const senhaConfere = usuario && (await bcrypt.compare(senha, usuario.senhaHash));
  if (!senhaConfere) throw new ErroApp(401, 'E-mail ou senha incorretos');
  if (!usuario.ativo) throw new ErroApp(403, 'Usuário desativado');

  const token = jwt.sign({ perfil: usuario.perfil }, process.env.JWT_SECRET, {
    subject: usuario.id,
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

  return { token, usuario: semSenha(usuario) };
}

module.exports = { login };
