# SGV-ELLP

Sistema de Gestão de Voluntários do Projeto de Extensão ELLP
UTFPR Cornélio Procópio · Certificadora da Competência Identitária (TADS)

## Sobre

Sistema web para controlar e automatizar os processos administrativos dos voluntários do projeto ELLP: pré-cadastro, aprovação, vínculo com oficinas, histórico de atuação e emissão do Termo de Voluntariado em PDF.

## Equipe

- Luiz Gustavo Garbelini Ramos (representante)
- Thalles Guilherme Barboza Garbelotti
- Gabriel Takao Ito da Rocha
- Paulo Felipe Zanatta dos Santos

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Front-end | React, Vite, Tailwind CSS, React Router |
| Back-end | Node.js, Express, JWT, bcrypt, zod |
| PDF | PDFKit |
| ORM | Prisma 6 |
| Banco de dados | PostgreSQL 16 |
| Testes | node:test (unitários e de integração) |
| Ambiente | Docker, Git/GitHub |

## Status

| Item | Situação |
|---|---|
| Modelagem do banco (schema Prisma, 7 modelos) | Pronta |
| API: login JWT, usuários, voluntários, oficinas, vínculos, termos e dashboard | Pronta |
| Máquina de estados, filtros e PDF com hash | Pronta |
| Front-end React (todas as telas, integrado à API) | Pronto |
| Testes unitários e de integração | Prontos |
| Deploy (Supabase, Render e Vercel) | Guia em [docs/DEPLOY.md](docs/DEPLOY.md) |

## Pré-requisitos

- Node.js 18 ou superior
- Docker Desktop
- Git

## Como rodar

1. Clone o repositório e instale as dependências:

   ```bash
   git clone <URL-DO-REPOSITORIO>
   cd <PASTA-DO-REPOSITORIO>
   npm install
   ```

2. Crie o arquivo de ambiente a partir do modelo:

   ```bash
   cp .env.example .env
   ```

   No Windows (PowerShell): `Copy-Item .env.example .env`

3. Suba o PostgreSQL (porta 5433):

   ```bash
   docker compose up -d
   ```

4. Aplique as migrations e gere o Prisma Client:

   ```bash
   npx prisma migrate dev
   ```

5. Crie o primeiro coordenador ADMIN (usa `SEED_ADMIN_EMAIL` e `SEED_ADMIN_SENHA` do `.env`):

   ```bash
   npm run seed
   ```

6. Inicie a API (reinicia sozinha ao salvar arquivos) e teste em http://localhost:3000/health:

   ```bash
   npm run dev
   ```

7. (Opcional) Carregue dados **fictícios** de demonstração (8 voluntários e 7 oficinas):

   ```bash
   npm run seed:demo
   ```

8. (Opcional) Abra o Prisma Studio para ver as tabelas em http://localhost:5555:

   ```bash
   npx prisma studio
   ```

## Testes

```bash
npm test                  # unitários: máquina de estados, horas e hash (não usa banco)
npm run test:integracao   # API completa contra um banco separado (sgv_ellp_teste)
```

Os testes de integração precisam do Docker ligado. Eles criam e limpam sozinhos o banco `sgv_ellp_teste` no mesmo servidor, sem tocar nos dados de desenvolvimento.

## Rotas da API

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/health` | Público | Verifica se a API está no ar |
| POST | `/auth/login` | Público | Recebe `email` e `senha`, devolve o token JWT |
| GET | `/auth/me` | Logado | Dados do usuário do token |
| GET | `/usuarios` | ADMIN | Lista os usuários |
| GET | `/usuarios/:id` | ADMIN | Busca um usuário |
| POST | `/usuarios` | ADMIN | Cria um usuário (`nome`, `email`, `senha`, `perfil`) |
| PATCH | `/usuarios/:id` | ADMIN | Altera dados, senha, perfil ou `ativo` |
| DELETE | `/usuarios/:id` | ADMIN | Desativa o usuário (não apaga) |
| POST | `/voluntarios/pre-cadastro` | Público | Pré-cadastro com consentimento LGPD (entra como PENDENTE) |
| GET | `/voluntarios` | Logado | Lista com filtros: `busca`, `status`, `interesse`, `diaSemana`, `ordenar` (nome, criadoEm, horas), `ordem` (asc, desc) |
| GET | `/voluntarios/:id` | Logado | Detalhes, disponibilidades, participações, histórico e total de horas |
| PATCH | `/voluntarios/:id` | Logado | Edita dados e disponibilidades (o status não muda por aqui) |
| PATCH | `/voluntarios/:id/status` | Logado | Muda o status (`para`, `observacao`) seguindo a máquina de estados |
| GET | `/oficinas` | Logado | Lista com filtros: `busca` (tema ou local), `status`, `de`, `ate`, `ordem` |
| GET | `/oficinas/:id` | Logado | Detalhes da oficina com os voluntários vinculados |
| POST | `/oficinas` | Logado | Cria oficina (`tema`, `descricao`, `data`, `local`, `cargaHoraria`) |
| PATCH | `/oficinas/:id` | Logado | Edita dados da oficina (não a cancelada) |
| PATCH | `/oficinas/:id/status` | Logado | PLANEJADA → REALIZADA ou CANCELADA |
| POST | `/oficinas/:id/participacoes` | Logado | Vincula voluntário ATIVO (`voluntarioId`, `papel`, `horasValidas`) |
| PATCH | `/oficinas/:id/participacoes/:participacaoId` | Logado | Ajusta papel ou horas válidas |
| DELETE | `/oficinas/:id/participacoes/:participacaoId` | Logado | Remove o vínculo (só em oficina PLANEJADA) |
| POST | `/termos` | Logado | Emite o termo de um voluntário (`voluntarioId`) com hash SHA-256 |
| GET | `/termos` | Logado | Lista os termos emitidos (filtro opcional `voluntarioId`) |
| GET | `/termos/:id` | Logado | Dados de um termo |
| GET | `/termos/:id/pdf` | Logado | PDF do termo |
| GET | `/termos/validar/:hash` | Público | Confere se o termo é autêntico (nome, horas e data de emissão) |
| GET | `/dashboard` | Logado | Números da visão geral: status, horas por mês, inscrições e próximas oficinas |

Rotas protegidas exigem o cabeçalho `Authorization: Bearer <token>`.

## Front-end (pasta `web/`)

React + Vite + Tailwind CSS, com o visual do protótipo feito no Lovable. Com a API rodando (`npm run dev` na raiz), em outro terminal:

```bash
cd web
npm install
npm run dev
```

Abra http://localhost:5173. Em desenvolvimento, o Vite repassa as chamadas `/api/...` para a API em http://localhost:3000, então não é preciso configurar nada. No deploy, defina `VITE_API_URL` com o endereço da API (veja `web/.env.example`).

| Tela | Acesso | O que faz |
|---|---|---|
| `/participar` | Público | Pré-cadastro com consentimento LGPD |
| `/validar` e `/validar/:hash` | Público | Confere a autenticidade de um Termo de Voluntariado |
| `/login` | Público | Login da coordenação (JWT) |
| `/` | Logado | Números do projeto, gráfico de horas, inscrições e próximas oficinas |
| `/voluntarios` | Logado | Lista com busca e filtros; detalhes, edição, histórico e mudança de status |
| `/inscricoes` | Logado | Inscrições pendentes para aprovar ou rejeitar |
| `/oficinas` | Logado | Agenda, criação e edição, vínculo de voluntários, ajuste de horas e conclusão/cancelamento |
| `/termos` | Logado | Emissão do termo em PDF e lista de termos emitidos |
| `/usuarios` | ADMIN | Cadastro, edição e desativação de coordenadores |

Os botões de status mostram só as transições permitidas pela máquina de estados, mas quem valida de verdade é a API.

## Estrutura

```
src/
  server.js         ponto de entrada (abre a porta)
  app.js            monta o Express, rotas e tratamento de erros
  lib/              Prisma Client, erros e utilitários
  middlewares/      autenticação, perfil e erros
  routes/           definição das URLs
  controllers/      recebem a requisição e validam os dados
  services/         regras de negócio
  schemas/          validações com zod
prisma/
  schema.prisma     modelagem do banco
  migrations/       histórico versionado do banco
  seed.js           cria o primeiro ADMIN
  seed-demo.js      dados fictícios de demonstração
test/
  *.test.js         testes unitários
  integracao/       testes de integração da API
web/                front-end React
  src/pages/        uma tela por arquivo
  src/components/   menu lateral, tabelas, janelas e peças reutilizadas
  src/lib/          cliente da API e formatações
docs/
  ER.md             diagrama entidade-relacionamento
  regras-de-negocio.md  RN01 a RN09 e onde estão no código
  DEPLOY.md         passo a passo do deploy
docker-compose.yml  PostgreSQL local
.env.example        modelo de variáveis de ambiente
```

## Modelo de dados

Veja o diagrama em [docs/ER.md](docs/ER.md). Resumo:

- **Usuario**: coordenadores com login (ADMIN ou COORDENADOR).
- **Voluntario**: dados pessoais, status da máquina de estados e consentimento LGPD.
- **Disponibilidade**: dia da semana e faixa de horário do voluntário.
- **Oficina**: tema, data, local, carga horária e status.
- **Participacao**: vínculo M:N entre voluntário e oficina, com papel e horas válidas.
- **StatusHistorico**: registro de cada mudança de status (somente inserção).
- **TermoVoluntariado**: termo emitido, com total de horas e hash SHA-256 único.

Ciclo de vida do voluntário: PENDENTE → APROVADO → ATIVO → DESLIGADO (uma inscrição pendente também pode ser rejeitada, indo direto para DESLIGADO).

As regras de negócio (RN01 a RN09) estão em [docs/regras-de-negocio.md](docs/regras-de-negocio.md).

## Fluxo de trabalho

- A branch `main` só recebe código revisado.
- Cada tarefa é feita em uma branch própria (por exemplo `feat/servidor-express`).
- Toda integração passa por Pull Request com Code Review.
- Sprints de aproximadamente duas semanas, com quadro Kanban.

## Segurança e LGPD

- O arquivo `.env` nunca é versionado.
- Use apenas dados fictícios em seeds e exemplos.
- O consentimento do voluntário é registrado no cadastro.
