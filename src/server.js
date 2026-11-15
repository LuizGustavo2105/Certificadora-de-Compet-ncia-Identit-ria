// Ponto de entrada: carrega o .env, confere variáveis obrigatórias e abre a porta.
require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('Defina JWT_SECRET no arquivo .env antes de iniciar a API.');
  process.exit(1);
}

const app = require('./app');

const PORTA = process.env.PORT || 3000;

app.listen(PORTA, () => {
  console.log(`API do SGV-ELLP rodando em http://localhost:${PORTA}`);
});
