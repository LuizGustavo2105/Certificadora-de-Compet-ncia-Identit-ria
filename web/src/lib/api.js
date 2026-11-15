// Cliente da API: todas as chamadas ao back-end passam por aqui.
// Ele coloca o token JWT no cabeçalho e transforma erros da API em mensagens legíveis.

const BASE = import.meta.env.VITE_API_URL || '/api';
const CHAVE_TOKEN = 'sgv-ellp-token';

export const token = {
  ler: () => localStorage.getItem(CHAVE_TOKEN),
  salvar: (valor) => localStorage.setItem(CHAVE_TOKEN, valor),
  apagar: () => localStorage.removeItem(CHAVE_TOKEN),
};

// Erro com a mensagem que a API devolveu (campo "erro") e os detalhes do zod, se houver.
export class ErroApi extends Error {
  constructor(status, corpo) {
    super(corpo?.erro || `Erro ${status}`);
    this.status = status;
    this.detalhes = corpo?.detalhes || [];
  }
}

// Chamado quando a API responde 401 (token vencido): o AuthContext manda para o login.
let aoExpirar = () => {};
export function definirAoExpirar(fn) {
  aoExpirar = fn;
}

async function requisitar(metodo, caminho, corpo) {
  const cabecalhos = { 'Content-Type': 'application/json' };
  const t = token.ler();
  if (t) cabecalhos.Authorization = `Bearer ${t}`;

  const resposta = await fetch(BASE + caminho, {
    method: metodo,
    headers: cabecalhos,
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });

  if (resposta.status === 204) return null;
  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    if (resposta.status === 401 && t) aoExpirar();
    throw new ErroApi(resposta.status, dados);
  }
  return dados;
}

// Monta "?status=ATIVO&busca=ana" ignorando filtros vazios.
function consulta(params = {}) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, v);
  });
  const texto = p.toString();
  return texto ? `?${texto}` : '';
}

export const api = {
  // Autenticação
  login: (email, senha) => requisitar('POST', '/auth/login', { email, senha }),
  eu: () => requisitar('GET', '/auth/me'),

  // Voluntários
  preCadastro: (dados) => requisitar('POST', '/voluntarios/pre-cadastro', dados),
  listarVoluntarios: (filtros) => requisitar('GET', `/voluntarios${consulta(filtros)}`),
  buscarVoluntario: (id) => requisitar('GET', `/voluntarios/${id}`),
  mudarStatusVoluntario: (id, para, observacao) =>
    requisitar('PATCH', `/voluntarios/${id}/status`, { para, observacao: observacao || undefined }),

  // Oficinas e vínculos (M:N)
  listarOficinas: (filtros) => requisitar('GET', `/oficinas${consulta(filtros)}`),
  buscarOficina: (id) => requisitar('GET', `/oficinas/${id}`),
  criarOficina: (dados) => requisitar('POST', '/oficinas', dados),
  mudarStatusOficina: (id, para) => requisitar('PATCH', `/oficinas/${id}/status`, { para }),
  vincular: (oficinaId, dados) => requisitar('POST', `/oficinas/${oficinaId}/participacoes`, dados),
  desvincular: (oficinaId, participacaoId) =>
    requisitar('DELETE', `/oficinas/${oficinaId}/participacoes/${participacaoId}`),
};
