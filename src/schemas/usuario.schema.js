// Regras de validação (zod) dos dados de usuários e login.
const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  senha: z.string().min(1, 'Informe a senha'),
});

const criarUsuarioSchema = z.object({
  nome: z.string().trim().min(3, 'Nome muito curto'),
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  senha: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
  perfil: z.enum(['ADMIN', 'COORDENADOR']).default('COORDENADOR'),
});

const atualizarUsuarioSchema = z
  .object({
    nome: z.string().trim().min(3, 'Nome muito curto'),
    email: z.string().trim().toLowerCase().email('E-mail inválido'),
    senha: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
    perfil: z.enum(['ADMIN', 'COORDENADOR']),
    ativo: z.boolean(),
  })
  .partial()
  .refine((d) => Object.keys(d).length > 0, 'Envie ao menos um campo');

module.exports = { loginSchema, criarUsuarioSchema, atualizarUsuarioSchema };
