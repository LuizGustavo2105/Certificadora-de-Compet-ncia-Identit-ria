# Deploy do SGV-ELLP (planos gratuitos)

| Parte | Serviço | O que roda |
|---|---|---|
| Banco | Supabase | PostgreSQL |
| API | Render (Web Service) | Node.js + Express (pasta raiz) |
| Front-end | Vercel | React + Vite (pasta `web/`) |

A ordem importa: banco → API → front-end → ajustar o CORS da API.

## 1. Banco no Supabase

1. Crie um projeto em https://supabase.com (anote a senha do banco em local seguro).
2. Em **Connect**, copie a string do **Session pooler** (porta 5432). Ela funciona em redes IPv4, como a do Render, e aceita migrations.
3. Acrescente `?schema=public` ao final, se não houver parâmetros. Esse texto será a `DATABASE_URL` de produção.

## 2. API no Render

1. Em https://render.com, **New → Web Service**, conecte o repositório do GitHub.
2. Configuração:
   - **Root Directory:** (vazio, raiz do repositório)
   - **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
3. Variáveis de ambiente (**Environment**):

| Variável | Valor |
|---|---|
| `DATABASE_URL` | string do Supabase (passo 1) |
| `JWT_SECRET` | texto aleatório novo, diferente do local (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
| `JWT_EXPIRES_IN` | `8h` |
| `CORS_ORIGIN` | endereço da Vercel (passo 3), ex.: `https://sgv-ellp.vercel.app` |
| `FRONT_URL` | o mesmo endereço da Vercel (vai impresso no link de validação do termo) |

4. Depois do deploy, teste `https://<sua-api>.onrender.com/health`.

> O plano gratuito do Render "dorme" após 15 minutos sem uso: a primeira requisição pode levar até 1 minuto. Abra o `/health` alguns minutos antes de apresentar.

### Criar o primeiro ADMIN em produção

O plano gratuito não tem terminal no servidor, então o seed roda do seu computador apontando para o banco do Supabase. No PowerShell, na pasta do projeto:

```powershell
$env:DATABASE_URL = "COLE_A_STRING_DO_SUPABASE"
$env:SEED_ADMIN_EMAIL = "email-do-admin"
$env:SEED_ADMIN_SENHA = "senha-forte-do-admin"
npm run seed
Remove-Item Env:DATABASE_URL, Env:SEED_ADMIN_EMAIL, Env:SEED_ADMIN_SENHA
```

`$env:` define variáveis só para esta janela do PowerShell (elas têm prioridade sobre o `.env`); a última linha as apaga. Para a demonstração, `npm run seed:demo` pode ser rodado do mesmo jeito (dados fictícios).

## 3. Front-end na Vercel

1. Em https://vercel.com, **Add New → Project**, importe o repositório.
2. Configuração:
   - **Root Directory:** `web`
   - **Framework Preset:** Vite (detectado sozinho)
3. Variável de ambiente: `VITE_API_URL` = endereço da API no Render (sem barra no final).
4. O arquivo `web/vercel.json` faz as rotas do React (`/participar`, `/validar/...`) funcionarem ao recarregar a página.

## 4. Fechar o circuito

1. Volte ao Render e confira `CORS_ORIGIN` e `FRONT_URL` com o endereço final da Vercel.
2. Teste em produção: `/participar` (inscrição), login, aprovar e ativar um voluntário, vincular a uma oficina, marcar como realizada, emitir o termo e abrir o link de validação impresso no PDF.

## Segurança

- Nenhum segredo vai para o GitHub: as variáveis ficam só nos painéis do Render e da Vercel.
- Use apenas dados fictícios na demonstração (LGPD).
