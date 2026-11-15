// Tabela de voluntários com busca e filtros (usa GET /voluntarios?...).
// É usada em /voluntarios (todos) e em /inscricoes (só PENDENTE).
import { useCallback, useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Search, UserPlus } from 'lucide-react';
import { api } from '../lib/api';
import { AREAS, PERIODOS, STATUS_VOLUNTARIO, formatarHoras } from '../lib/formatos';
import { Alerta, Paginacao, Pessoa, Selo, TagArea, Vazio, usePaginacao } from './ui';
import VoluntarioDetalhe from './VoluntarioDetalhe';

const ORDENS = {
  recentes: { rotulo: 'Mais recentes', ordenar: 'criadoEm', ordem: 'desc' },
  nome: { rotulo: 'Nome A–Z', ordenar: 'nome', ordem: 'asc' },
  horas: { rotulo: 'Maior carga horária', ordenar: 'horas', ordem: 'desc' },
};

export default function ListaVoluntarios({ statusFixo, rotuloAcao = 'Ver', textoContagem }) {
  const { atualizarPendentes } = useOutletContext();
  const [filtros, setFiltros] = useState({ busca: '', status: statusFixo || '', interesse: '', diaSemana: '', ordem: 'recentes' });
  const [buscaDigitada, setBuscaDigitada] = useState('');
  const [lista, setLista] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [aberto, setAberto] = useState(null);
  const paginacao = usePaginacao(lista);

  // Espera o usuário parar de digitar (300 ms) antes de buscar.
  useEffect(() => {
    const t = setTimeout(() => setFiltros((f) => ({ ...f, busca: buscaDigitada })), 300);
    return () => clearTimeout(t);
  }, [buscaDigitada]);

  const carregar = useCallback(() => {
    const { ordem, ...resto } = filtros;
    setCarregando(true);
    api
      .listarVoluntarios({ ...resto, ordenar: ORDENS[ordem].ordenar, ordem: ORDENS[ordem].ordem })
      .then((dados) => {
        setLista(dados);
        setErro('');
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [filtros]);

  useEffect(carregar, [carregar]);

  const mudar = (campo) => (e) => setFiltros({ ...filtros, [campo]: e.target.value });

  return (
    <>
      <div className="cartao overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="campo pl-9"
              placeholder="Buscar por nome ou e-mail"
              value={buscaDigitada}
              onChange={(e) => setBuscaDigitada(e.target.value)}
            />
          </div>

          {!statusFixo && (
            <div className="flex flex-wrap gap-1 rounded-md bg-muted p-1">
              {[['', 'Todos'], ...Object.entries(STATUS_VOLUNTARIO).map(([k, v]) => [k, v.rotulo])].map(([valor, rotulo]) => (
                <button
                  key={valor}
                  onClick={() => setFiltros({ ...filtros, status: valor })}
                  className={`btn h-8 px-3 ${filtros.status === valor ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}
                >
                  {rotulo}
                </button>
              ))}
            </div>
          )}

          <select className="campo w-auto" value={filtros.interesse} onChange={mudar('interesse')} aria-label="Área">
            <option value="">Todas as áreas</option>
            {AREAS.map((a) => <option key={a}>{a}</option>)}
          </select>
          <select className="campo w-auto" value={filtros.diaSemana} onChange={mudar('diaSemana')} aria-label="Disponibilidade">
            <option value="">Qualquer disponibilidade</option>
            {PERIODOS.map((p) => <option key={p.chave} value={p.diaSemana}>{p.rotulo}</option>)}
          </select>
          <select className="campo w-auto" value={filtros.ordem} onChange={mudar('ordem')} aria-label="Ordenar">
            {Object.entries(ORDENS).map(([k, o]) => <option key={k} value={k}>{o.rotulo}</option>)}
          </select>
        </div>

        <p className="px-5 pt-4 text-sm font-medium text-muted-foreground">
          {lista.length} {textoContagem || (lista.length === 1 ? 'voluntário' : 'voluntários')}
        </p>

        {erro && <div className="p-5"><Alerta>{erro}</Alerta></div>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Voluntário</th>
                <th className="px-5 py-3 font-semibold">Interesse</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Horas</th>
                <th className="px-5 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginacao.visiveis.map((v) => (
                <tr key={v.id} className="border-t border-border hover:bg-muted/60">
                  <td className="px-5 py-3"><Pessoa nome={v.nome} detalhe={v.curso || v.email} /></td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">{v.interesses.map((i) => <TagArea key={i}>{i}</TagArea>)}</div>
                  </td>
                  <td className="px-5 py-3"><Selo status={v.status} /></td>
                  <td className="px-5 py-3">{formatarHoras(v.totalHoras)}</td>
                  <td className="px-5 py-3 text-right">
                    <button className="btn-link" onClick={() => setAberto(v.id)}>{rotuloAcao}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!carregando && lista.length === 0 && !erro && (
          <Vazio>
            Nenhum voluntário encontrado com esses filtros.{' '}
            <Link to="/participar" className="text-primary hover:underline">Abrir formulário de inscrição</Link>
          </Vazio>
        )}

        <Paginacao {...paginacao} />
      </div>

      <VoluntarioDetalhe
        id={aberto}
        aoFechar={() => setAberto(null)}
        aoAlterar={() => {
          carregar();
          atualizarPendentes();
        }}
      />
    </>
  );
}

// Botão "Novo voluntário": o cadastro passa pelo formulário público,
// porque é a própria pessoa quem precisa dar o consentimento LGPD.
export function BotaoNovoVoluntario() {
  return (
    <a href="/participar" target="_blank" rel="noreferrer" className="btn-primario">
      <UserPlus /> Novo voluntário
    </a>
  );
}
