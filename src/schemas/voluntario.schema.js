// Regras de validação (zod) dos dados de voluntários.
const { z } = require('zod');

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/; // formato "HH:mm"

const disponibilidadeSchema = z
  .object({
    diaSemana: z.number().int().min(0).max(6), // 0 = domingo ... 6 = sábado
    horaInicio: z.string().regex(HORA, 'Use o formato HH:mm'),
    horaFim: z.string().regex(HORA, 'Use o formato HH:mm'),
  })
  // "HH:mm" com dois dígitos pode ser comparado como texto
  .refine((d) => d.horaInicio < d.horaFim, 'A hora de início deve ser antes da hora de fim');

const camposVoluntario = {
  nome: z.string().trim().min(3, 'Nome muito curto'),
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  telefone: z.string().trim().max(20).optional(),
  ra: z.string().trim().max(20).optional(),
  curso: z.string().trim().max(100).optional(),
  periodo: z.number().int().min(1).max(12).optional(),
  interesses: z.array(z.string().trim().min(1)).max(20).default([]),
  disponibilidades: z.array(disponibilidadeSchema).max(21).default([]),
};

// Formulário público: o consentimento LGPD é obrigatório.
const preCadastroSchema = z.object({
  ...camposVoluntario,
  consentimentoLgpd: z.literal(true, {
    errorMap: () => ({ message: 'É preciso aceitar o termo de consentimento (LGPD)' }),
  }),
});

// Edição pelo painel: todos os campos opcionais; o status NÃO muda por aqui.
const atualizarVoluntarioSchema = z
  .object(camposVoluntario)
  .partial()
  .refine((d) => Object.keys(d).length > 0, 'Envie ao menos um campo');

const STATUS = ['PENDENTE', 'APROVADO', 'ATIVO', 'DESLIGADO'];

const mudarStatusSchema = z.object({
  para: z.enum(STATUS),
  observacao: z.string().trim().max(500).optional(),
});

// Filtros da listagem (vêm da URL, por isso tudo chega como texto).
const filtrosSchema = z.object({
  busca: z.string().trim().optional(), // parte do nome ou e-mail
  status: z.enum(STATUS).optional(),
  interesse: z.string().trim().optional(),
  diaSemana: z.coerce.number().int().min(0).max(6).optional(),
  ordenar: z.enum(['nome', 'criadoEm', 'horas']).default('nome'),
  ordem: z.enum(['asc', 'desc']).default('asc'),
});

module.exports = { preCadastroSchema, atualizarVoluntarioSchema, mudarStatusSchema, filtrosSchema };
