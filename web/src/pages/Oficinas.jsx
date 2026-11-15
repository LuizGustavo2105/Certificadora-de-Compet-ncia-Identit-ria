// Tela /oficinas: agenda de oficinas, criação e vínculo de voluntários (M:N).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, MapPin, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { api, mensagemDeErro } from '../lib/api';
import { PAPEIS, formatarData, formatarDataHora, formatarHoras } from '../lib/formatos';
import { Alerta, Cabecalho, Modal, Pessoa, Selo, Vazio } from '../components/ui';

const ABAS = [
  { chave: 'proximas', rotulo: 'Próximas', filtro: (o) => o.status === 'PLANEJADA' },
  { chave: 'concluidas', rotulo: 'Concluídas', filtro: (o) => o.status === 'REALIZADA' },
  { chave: 'todas', rotulo: 'Todas', filtro: () => true },
];

export default function Oficinas() {
  const [oficinas, setOficinas] = useState([]);
  const [aba, setAba] = useState('proximas');
  const [erro, setErro] = useState('');
  const [criando, setCriando] = useState(false);
  const [aberta, setAberta] = useState(null);

  const carregar = useCallback(() => {
    api
      .listarOficinas({ ordem: 'asc' })
      .then(setOficinas)
      .catch((e) => setErro(e.message));
  }, []);

  useEffect(carregar, [carregar]);

  const visiveis = useMemo(() => oficinas.filter(ABAS.find((a) => a.chave === aba).filtro), [oficinas, aba]);

  return (
    <>
      <Cabecalho
        eyebrow="Encontros que abrem possibilidades"
        titulo="Oficinas"
        subtitulo="Organize a agenda e conecte voluntários às atividades do projeto."
      >
        <button className="btn-primario" onClick={() => setCriando(true)}>
          <Plus /> Nova oficina
        </button>
      </Cabecalho>

      <div className="mb-5 inline-flex gap-1 rounded-md bg-muted p-1">
        {ABAS.map((a) => (
          <button
            key={a.chave}
            onClick={() => setAba(a.chave)}
            className={`btn h-8 px-3 ${aba === a.chave ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}
          >
            {a.rotulo}
            <span className="rounded bg-muted px-1.5 text-xs">{oficinas.filter(a.filtro).length}</span>
          </button>
        ))}
      </div>

      <Alerta>{erro}</Alerta>

      {visiveis.length === 0 ? (
        <div className="cartao"><Vazio>Nenhuma oficina nesta aba.</Vazio></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visiveis.map((o) => (
            <button key={o.id} onClick={() => setAberta(o.id)} className="cartao p-5 text-left transition hover:border-primary/40 hover:shadow-md">
              <div className="mb-3"><Selo status={o.status} tipo="oficina" /></div>
              <h2 className="text-lg font-bold">{o.tema}</h2>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><CalendarDays className="size-4" /> {formatarDataHora(o.data)}</li>
                <li className="flex items-center gap-2"><MapPin className="size-4" /> {o.local}</li>
                <li className="flex items-center gap-2"><Clock3 className="size-4" /> {formatarHoras(o.cargaHoraria)} de atividade</li>
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="text-muted-foreground">Voluntários vinculados</span>
                <span className="flex items-center gap-1.5 font-semibold"><Users className="size-4" /> {o.totalParticipantes}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <FormOficina aberto={criando} aoFechar={() => setCriando(false)} aoSalvar={carregar} />
      <OficinaDetalhe id={aberta} aoFechar={() => setAberta(null)} aoAlterar={carregar} />
    </>
  );
}

// ISO (UTC) -> "2026-11-20T14:00" no horário do navegador, formato do campo datetime-local.
function paraCampoData(iso) {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

// Cria (sem "oficina") ou edita (com "oficina") uma oficina.
function FormOficina({ aberto, aoFechar, aoSalvar, oficina }) {
  const vazio = { tema: '', descricao: '', data: '', local: '', cargaHoraria: '' };
  const [form, setForm] = useState(vazio);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const alterar = (c) => (e) => setForm({ ...form, [c]: e.target.value });

  useEffect(() => {
    if (!aberto) return;
    setErro('');
    setForm(
      oficina
        ? {
            tema: oficina.tema,
            descricao: oficina.descricao || '',
            data: paraCampoData(oficina.data),
            local: oficina.local,
            cargaHoraria: String(oficina.cargaHoraria),
          }
        : vazio,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, oficina]);

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      const dados = {
        tema: form.tema,
        descricao: form.descricao || undefined,
        // O campo datetime-local está no horário do navegador; enviamos em ISO (UTC).
        data: new Date(form.data).toISOString(),
        local: form.local,
        cargaHoraria: Number(form.cargaHoraria),
      };
      if (oficina) await api.atualizarOficina(oficina.id, dados);
      else await api.criarOficina(dados);
      aoFechar();
      aoSalvar();
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo={oficina ? 'Editar oficina' : 'Nova oficina'}
      subtitulo={oficina ? 'O status muda pelos botões da oficina.' : 'Ela começa como Programada.'}
      aberto={aberto}
      aoFechar={aoFechar}
    >
      <form onSubmit={salvar} className="space-y-4">
        <div>
          <label className="rotulo" htmlFor="tema">Tema *</label>
          <input id="tema" className="campo" value={form.tema} onChange={alterar('tema')} placeholder="Ex.: Primeiros passos na robótica" />
        </div>
        <div>
          <label className="rotulo" htmlFor="descricao">Descrição</label>
          <textarea id="descricao" className="campo h-20 py-2" value={form.descricao} onChange={alterar('descricao')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="rotulo" htmlFor="data">Data e horário *</label>
            <input id="data" type="datetime-local" className="campo" value={form.data} onChange={alterar('data')} />
          </div>
          <div>
            <label className="rotulo" htmlFor="carga">Carga horária (h) *</label>
            <input id="carga" type="number" min="0.5" max="24" step="0.5" className="campo" value={form.cargaHoraria} onChange={alterar('cargaHoraria')} />
          </div>
        </div>
        <div>
          <label className="rotulo" htmlFor="local">Local *</label>
          <input id="local" className="campo" value={form.local} onChange={alterar('local')} placeholder="Ex.: Laboratório de Robótica · UTFPR" />
        </div>
        <Alerta>{erro}</Alerta>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-contorno" onClick={aoFechar}>Cancelar</button>
          <button className="btn-primario" disabled={salvando || !form.tema || !form.data || !form.local || !form.cargaHoraria}>
            {salvando ? 'Salvando…' : oficina ? 'Salvar alterações' : 'Criar oficina'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function OficinaDetalhe({ id, aoFechar, aoAlterar }) {
  const [oficina, setOficina] = useState(null);
  const [ativos, setAtivos] = useState([]);
  const [vinculo, setVinculo] = useState({ voluntarioId: '', papel: 'MINISTRANTE' });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [editando, setEditando] = useState(false);

  const carregar = useCallback(() => {
    api.buscarOficina(id).then(setOficina).catch((e) => setErro(e.message));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setOficina(null);
    setErro('');
    carregar();
    // Só voluntários ATIVOS podem ser vinculados (regra da API).
    api.listarVoluntarios({ status: 'ATIVO' }).then(setAtivos).catch(() => {});
  }, [id, carregar]);

  // Executa uma ação e recarrega a oficina e a lista de cards.
  async function executar(acao) {
    setErro('');
    setSalvando(true);
    try {
      await acao();
      carregar();
      aoAlterar();
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setSalvando(false);
    }
  }

  const jaVinculados = new Set(oficina?.participacoes.map((p) => p.voluntarioId));
  const disponiveis = ativos.filter((v) => !jaVinculados.has(v.id));
  const cancelada = oficina?.status === 'CANCELADA';
  const planejada = oficina?.status === 'PLANEJADA';

  return (
    <Modal titulo={oficina?.tema || 'Oficina'} aberto={Boolean(id)} aoFechar={aoFechar} largura="max-w-2xl">
      {!oficina && !erro && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {oficina && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <Selo status={oficina.status} tipo="oficina" />
            <span className="flex items-center gap-1.5"><CalendarDays className="size-4" /> {formatarDataHora(oficina.data)}</span>
            <span className="flex items-center gap-1.5"><MapPin className="size-4" /> {oficina.local}</span>
            <span className="flex items-center gap-1.5"><Clock3 className="size-4" /> {formatarHoras(oficina.cargaHoraria)}</span>
            {!cancelada && (
              <button className="btn-contorno ml-auto h-8" onClick={() => setEditando(true)}>
                <Pencil /> Editar
              </button>
            )}
          </div>
          {oficina.descricao && <p className="text-sm">{oficina.descricao}</p>}

          <div>
            <p className="mb-2 text-sm font-semibold">Participantes ({oficina.participacoes.length})</p>
            {oficina.participacoes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum voluntário vinculado ainda.</p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {oficina.participacoes.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <Pessoa nome={p.voluntario.nome} detalhe={PAPEIS[p.papel]} />
                    <div className="ml-auto">
                      {cancelada ? (
                        <span className="text-sm text-muted-foreground">{formatarHoras(p.horasValidas)}</span>
                      ) : (
                        <HorasEditaveis
                          valor={p.horasValidas}
                          maximo={oficina.cargaHoraria}
                          desabilitado={salvando}
                          aoSalvar={(horasValidas) => executar(() => api.atualizarParticipacao(oficina.id, p.id, { horasValidas }))}
                        />
                      )}
                    </div>
                    {planejada && (
                      <button
                        className="btn h-8 px-2 text-muted-foreground hover:text-destructive"
                        title="Remover vínculo"
                        disabled={salvando}
                        onClick={() => executar(() => api.desvincular(oficina.id, p.id))}
                      >
                        <Trash2 />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {!cancelada && (
            <form
              className="flex flex-wrap items-end gap-2 rounded-lg bg-muted p-4"
              onSubmit={(e) => {
                e.preventDefault();
                executar(async () => {
                  await api.vincular(oficina.id, vinculo);
                  setVinculo({ ...vinculo, voluntarioId: '' });
                });
              }}
            >
              <div className="min-w-48 flex-1">
                <label className="rotulo" htmlFor="vol">Vincular voluntário ativo</label>
                <select id="vol" className="campo" value={vinculo.voluntarioId} onChange={(e) => setVinculo({ ...vinculo, voluntarioId: e.target.value })}>
                  <option value="">{disponiveis.length ? 'Selecione' : 'Nenhum voluntário ativo disponível'}</option>
                  {disponiveis.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="rotulo" htmlFor="papel">Papel</label>
                <select id="papel" className="campo" value={vinculo.papel} onChange={(e) => setVinculo({ ...vinculo, papel: e.target.value })}>
                  {Object.entries(PAPEIS).map(([k, r]) => <option key={k} value={k}>{r}</option>)}
                </select>
              </div>
              <button className="btn-primario h-10" disabled={salvando || !vinculo.voluntarioId}>Vincular</button>
            </form>
          )}

          {planejada && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                As horas só contam para o termo depois que a oficina for marcada como realizada.
              </p>
              <div className="flex gap-2">
                <button
                  className="btn-perigo"
                  disabled={salvando}
                  onClick={() => window.confirm('Cancelar esta oficina? Não dá para desfazer.') && executar(() => api.mudarStatusOficina(oficina.id, 'CANCELADA'))}
                >
                  Cancelar oficina
                </button>
                <button
                  className="btn-primario"
                  disabled={salvando}
                  onClick={() => window.confirm('Marcar como realizada? Depois disso os vínculos não podem ser removidos.') && executar(() => api.mudarStatusOficina(oficina.id, 'REALIZADA'))}
                >
                  Marcar como realizada
                </button>
              </div>
            </div>
          )}
          {!planejada && (
            <p className="text-xs text-muted-foreground">
              Oficina {oficina.status === 'REALIZADA' ? 'realizada' : 'cancelada'} em {formatarData(oficina.data)}: o status é final.
            </p>
          )}
        </div>
      )}
      <div className="mt-4"><Alerta>{erro}</Alerta></div>
      {editando && (
        <FormOficina
          aberto
          oficina={oficina}
          aoFechar={() => setEditando(false)}
          aoSalvar={() => {
            carregar();
            aoAlterar();
          }}
        />
      )}
    </Modal>
  );
}

// Campo de horas válidas de um participante: salva ao sair do campo ou apertar Enter.
// Ex.: o voluntário saiu mais cedo e deve receber menos horas (nunca mais que a carga da oficina).
function HorasEditaveis({ valor, maximo, desabilitado, aoSalvar }) {
  const [texto, setTexto] = useState(String(valor));
  useEffect(() => setTexto(String(valor)), [valor]);

  function confirmar() {
    const n = Number(texto.replace(',', '.'));
    if (texto === '' || Number.isNaN(n) || n === valor) {
      setTexto(String(valor));
      return;
    }
    aoSalvar(n);
  }

  return (
    <label className="flex items-center gap-1.5 text-sm text-muted-foreground" title={`Horas válidas (máximo ${maximo} h)`}>
      <input
        type="number"
        min="0"
        max={maximo}
        step="0.5"
        className="campo h-8 w-20 text-right"
        value={texto}
        disabled={desabilitado}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), e.currentTarget.blur())}
        aria-label="Horas válidas"
      />
      h
    </label>
  );
}
