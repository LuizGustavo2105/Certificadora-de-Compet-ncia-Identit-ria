// Monta a aplicação Express (sem abrir porta): facilita os testes.
const express = require('express');
const cors = require('cors');

const rotas = require('./routes');
const { rotaNaoEncontrada, tratarErros } = require('./middlewares/erros');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Verificação rápida de que a API está no ar
app.get('/health', (req, res) => {
  res.json({ status: 'ok', horario: new Date().toISOString() });
});

app.use(rotas);

app.use(rotaNaoEncontrada);
app.use(tratarErros);

module.exports = app;
