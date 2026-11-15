// Erro de negócio com status HTTP. Lançado nos services e
// convertido em resposta JSON pelo middleware de erros.
class ErroApp extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

module.exports = { ErroApp };
