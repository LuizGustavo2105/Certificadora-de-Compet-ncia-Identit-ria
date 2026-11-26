// O Express 4 não captura erros de funções async sozinho.
// Este envelope repassa qualquer erro para o middleware de erros.
const async = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = async;
