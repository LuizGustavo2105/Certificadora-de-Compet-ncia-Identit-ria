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
| Front-end (Sprint 3) | React, Tailwind CSS |
| Back-end | Node.js, Express, JWT |
| ORM | Prisma 6 |
| Banco de dados | PostgreSQL 16 |
| Ambiente | Docker, Git/GitHub |

## Status

| Item | Situação |
|---|---|
| Modelagem do banco (schema Prisma, 7 modelos) | Pronta |
| Migration inicial aplicada | Pronta |
| Servidor Express e API (usuários e JWT) | Em andamento (Sprint 2) |
| Front-end React | Sprint 3 |
| Máquina de estados, filtros e PDF com hash | Sprint 4 |

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

7. (Opcional) Abra o Prisma Studio para ver as tabelas em http://localhost:5555:

   ```bash
   npx prisma studio
   ```

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

Rotas protegidas exigem o cabeçalho `Authorization: Bearer <token>`.

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
docs/
  ER.md             diagrama entidade-relacionamento
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

## Fluxo de trabalho

- A branch `main` só recebe código revisado.
- Cada tarefa é feita em uma branch própria (por exemplo `feat/servidor-express`).
- Toda integração passa por Pull Request com Code Review.
- Sprints de aproximadamente duas semanas, com quadro Kanban.

## Segurança e LGPD

- O arquivo `.env` nunca é versionado.
- Use apenas dados fictícios em seeds e exemplos.
- O consentimento do voluntário é registrado no cadastro.
