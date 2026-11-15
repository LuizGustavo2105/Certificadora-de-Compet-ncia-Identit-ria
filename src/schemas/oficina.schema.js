// Regras de validação (zod) de oficinas e participações.
const { z } = require('zod');

const camposOficina = {
  tema: z.string().trim().min(3, 'Tema muito curto'),
  descricao: z.string().trim().max(1000).optional(),
  data: z.coerce.date({ errorMap: () => ({ message: 'Data inválida' }) }), // ex.: "2026-11-20T14:00:00"
  local: z.string().trim().min(2, 'Informe o local'),
  cargaHoraria: z.number().positive('A carga horária deve ser maior que zero').max(24),
};

const criarOficinaSchema = z.object(camposOficina);

// O status não muda por aqui: usa a rota própria.
const atualizarOficinaSchema = z
  .object(camposOficina)
  .partial()
  .refine((d) => Object.keys(d).length > 0, 'Envie ao menos um campo');

const mudarStatusOficinaSchema = z.object({
  para: z.enum(['PLANEJADA', 'REALIZADA', 'CANCELADA']),
});

const filtrosOficinaSchema = z.object({
  busca: z.string().trim().optional(), // parte do tema ou do local
  status: z.enum(['PLANEJADA', 'REALIZADA', 'CANCELADA']).optional(),
  de: z.coerce.date().optional(), // oficinas a partir desta data
  ate: z.coerce.date().optional(), // oficinas até esta data
  ordem: z.enum(['asc', 'desc']).default('desc'),
});

// Vínculo voluntário x oficina. Se horasValidas não vier, usa a carga horária da oficina.
const criarParticipacaoSchema = z.object({
  voluntarioId: z.string().uuid('voluntarioId inválido'),
  papel: z.enum(['MINISTRANTE', 'APOIO']).default('MINISTRANTE'),
  horasValidas: z.number().min(0).optional(),
});

const atualizarParticipacaoSchema = z
  .object({
    papel: z.enum(['MINISTRANTE', 'APOIO']),
    horasValidas: z.number().min(0),
  })
  .partial()
  .refine((d) => Object.keys(d).length > 0, 'Envie ao menos um campo');

module.exports = {
  criarOficinaSchema,
  atualizarOficinaSchema,
  mudarStatusOficinaSchema,
  filtrosOficinaSchema,
  criarParticipacaoSchema,
  atualizarParticipacaoSchema,
};
