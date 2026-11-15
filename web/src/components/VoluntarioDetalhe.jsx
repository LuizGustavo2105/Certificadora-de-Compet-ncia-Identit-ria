// Janela com os dados de um voluntário, o histórico de status e os botões de transição.
// Os botões seguem a máquina de estados (RN01); a API confere de novo e grava o histórico (RN03).
import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { api, mensagemDeErro } from '../lib/api';
import {
  AREAS,
  CURSOS,
  PAPEIS,
  PERIODOS,
  STATUS_VOLUNTARIO,
  TRANSICOES,
  descreverDisponibilidade,
  formatarData,
  formatarHoras,
  rotuloAcao,
} from '../lib/formatos';
import { Alerta, Modal, Pessoa, Selo } from './ui';

const mesmoPeriodo = (p, d) => p.diaSemana === d.diaSemana && p.horaInicio === d.horaInicio && p.horaFim === d.horaFim;

// Formulário de edição dos dados pessoais, interesses e disponibilidade (PATCH /voluntarios/:id).
// O status não muda aqui: só pelos botões da máquina de estados.
function FormVoluntario({ v, aoCancelar, aoSalvar }) {
  const [form, setForm] = useState({
    nome: v.nome,
    email: v.email,
    telefone: v.telefone || '',
    ra: v.ra || '',
    curso: v.curso || '',
    interesses: v.interesses,
    periodos: PERIODOS.filter((p) => v.disponibilidades.some((d) => mesmoPeriodo(p, d))).map((p) => p.chave),
  });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const alterar = (c) => (e) => setForm({ ...form, [c]: e.target.value });
  const alternar = (campo, valor) =>
    setForm({ ...form, [campo]: form[campo].includes(valor) ? form[campo].filter((x) => x !== valor) : [...form[campo], valor] });

  // Disponibilidades fora dos períodos padrão são mantidas como estão.
  const extras = v.disponibilidades.filter((d) => !PERIODOS.some((p) => mesmoPeriodo(p, d)));
  const areas = [...new Set([...AREAS, ...v.interesses])];
  const cursos = form.curso && !CURSOS.includes(form.curso) ? [form.curso, ...CURSOS] : CURSOS;

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      const atualizado = await api.atualizarVoluntario(v.id, {
        nome: form.nome,
        email: form.email,
        telefone: form.telefone,
        ra: form.ra,
        curso: form.curso,
        interesses: form.interesses,
        disponibilidades: [
          ...PERIODOS.filter((p) => form.periodos.includes(p.chave)).map(({ diaSemana, horaInicio, horaFim }) => ({ diaSemana, horaInicio, horaFim })),
          ...extras.map(({ diaSemana, horaInicio, horaFim }) => ({ diaSemana, horaInicio, horaFim })),
        ],
      });
      aoSalvar(atualizado);
    } catch (err) {
      setErro(err.status === 409 ? 'Já existe um voluntário com este e-mail ou RA.' : mensagemDeErro(err));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="rotulo" htmlFor="v-nome">Nome *</label>
          <input id="v-nome" className="campo" required value={form.nome} onChange={alterar('nome')} />
        </div>
        <div>
          <label className="rotulo" htmlFor="v-email">E-mail *</label>
          <input id="v-email" type="email" className="campo" required value={form.email} onChange={alterar('email')} />
        </div>
        <div>
          <label className="rotulo" htmlFor="v-tel">Telefone</label>
          <input id="v-tel" className="campo" maxLength={20} value={form.telefone} onChange={alterar('telefone')} />
        </div>
        <div>
          <label className="rotulo" htmlFor="v-ra">RA</label>
          <input id="v-ra" className="campo" maxLength={20} value={form.ra} onChange={alterar('ra')} />
        </div>
        <div>
          <label className="rotulo" htmlFor="v-curso">Curso</label>
          <select id="v-curso" className="campo" value={form.curso} onChange={alterar('curso')}>
            <option value="">Não informado</option>
            {cursos.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <fieldset>
        <legend className="rotulo">Interesses</legend>
        <div className="flex flex-wrap gap-3 text-sm">
          {areas.map((a) => (
            <label key={a} className="flex items-center gap-2">
              <input type="checkbox" checked={form.interesses.includes(a)} onChange={() => alternar('interesses', a)} /> {a}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="rotulo">Disponibilidade</legend>
        <div className="flex flex-wrap gap-3 text-sm">
          {PERIODOS.map((p) => (
            <label key={p.chave} className="flex items-center gap-2">
              <input type="checkbox" checked={form.periodos.includes(p.chave)} onChange={() => alternar('periodos', p.chave)} /> {p.rotulo}
            </label>
          ))}
          {extras.map((d) => (
            <span key={d.id} className="rounded-md bg-muted px-2.5 py-1 text-xs">{descreverDisponibilidade(d)}</span>
          ))}
        </div>
      </fieldset>
      <Alerta>{erro}</Alerta>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-contorno" onClick={aoCancelar}>Cancelar</button>
        <button className="btn-primario" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar alterações'}</button>
      </div>
    </form>
  );
}

function Linha({ rotulo, children }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{rotulo}</span>
      <span className="text-right font-medium">{children || '—'}</span>
    </div>
  );
}

export default function VoluntarioDetalhe({ id, aoFechar, aoAlterar }) {
  const [v, setV] = useState(null);
  const [erro, setErro] = useState('');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    if (!id) return;
    setV(null);
    setErro('');
    setObservacao('');
    setEditando(false);
    api.buscarVoluntario(id).then(setV).catch((e) => setErro(e.message));
  }, [id]);

  async function mudar(para) {
    const acao = rotuloAcao(v.status, para).toLowerCase();
    if (para === 'DESLIGADO' && !window.confirm(`Confirmar: ${acao} ${v.nome}? Esta ação não pode ser desfeita.`)) return;
    setSalvando(true);
    setErro('');
    try {
      const atualizado = await api.mudarStatusVoluntario(v.id, para, observacao);
      setV(atualizado);
      setObservacao('');
      aoAlterar?.();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  const proximos = v ? TRANSICOES[v.status] : [];

  return (
    <Modal titulo="Detalhes do voluntário" aberto={Boolean(id)} aoFechar={aoFechar} largura="max-w-2xl">
      {!v && !erro && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {v && editando && (
        <FormVoluntario
          v={v}
          aoCancelar={() => setEditando(false)}
          aoSalvar={(atualizado) => {
            setV(atualizado);
            setEditando(false);
            aoAlterar?.();
          }}
        />
      )}
      {v && !editando && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Pessoa nome={v.nome} detalhe={v.email} />
            <div className="flex items-center gap-2">
              <Selo status={v.status} />
              <button className="btn-contorno h-8" onClick={() => setEditando(true)}>
                <Pencil /> Editar
              </button>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Linha rotulo="RA">{v.ra}</Linha>
              <Linha rotulo="Curso">{v.curso}</Linha>
              <Linha rotulo="Telefone">{v.telefone}</Linha>
              <Linha rotulo="Interesses">{v.interesses.join(', ')}</Linha>
            </div>
            <div>
              <Linha rotulo="Inscrito em">{formatarData(v.criadoEm)}</Linha>
              <Linha rotulo="Entrada">{formatarData(v.dataEntrada)}</Linha>
              <Linha rotulo="Saída">{formatarData(v.dataSaida)}</Linha>
              <Linha rotulo="Carga horária">{formatarHoras(v.totalHoras)}</Linha>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">Disponibilidade</p>
            <div className="flex flex-wrap gap-2">
              {v.disponibilidades.length === 0 && <span className="text-sm text-muted-foreground">Não informada</span>}
              {v.disponibilidades.map((d) => (
                <span key={d.id} className="rounded-md bg-muted px-2.5 py-1 text-xs">{descreverDisponibilidade(d)}</span>
              ))}
            </div>
          </div>

          {v.participacoes.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold">Oficinas</p>
              <ul className="space-y-1 text-sm">
                {v.participacoes.map((p) => (
                  <li key={p.id} className="flex justify-between gap-3">
                    <span>{p.oficina.tema} <span className="text-muted-foreground">· {PAPEIS[p.papel]}</span></span>
                    <span className="text-muted-foreground">{formatarData(p.oficina.data)} · {formatarHoras(p.horasValidas)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-semibold">Histórico de status</p>
            {v.historico.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma mudança ainda. Inscrição recebida em {formatarData(v.criadoEm)}.</p>
            ) : (
              <ol className="space-y-2 border-l-2 border-border pl-4 text-sm">
                {v.historico.map((h) => (
                  <li key={h.id}>
                    <span className="font-medium">
                      {STATUS_VOLUNTARIO[h.de]?.rotulo} → {STATUS_VOLUNTARIO[h.para]?.rotulo}
                    </span>
                    <span className="text-muted-foreground"> · {formatarData(h.em)} · por {h.usuario?.nome}</span>
                    {h.observacao && <p className="text-muted-foreground">“{h.observacao}”</p>}
                  </li>
                ))}
              </ol>
            )}
          </div>

          {proximos.length > 0 && (
            <div className="space-y-3 rounded-lg bg-muted p-4">
              <label className="rotulo" htmlFor="obs">Observação (opcional, fica no histórico)</label>
              <input id="obs" className="campo" maxLength={500} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
              <div className="flex flex-wrap justify-end gap-2">
                {proximos.map((para) => (
                  <button
                    key={para}
                    disabled={salvando}
                    onClick={() => mudar(para)}
                    className={para === 'DESLIGADO' ? 'btn-perigo' : 'btn-primario'}
                  >
                    {rotuloAcao(v.status, para)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="mt-4">
        <Alerta>{erro}</Alerta>
      </div>
    </Modal>
  );
}
