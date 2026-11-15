// Janela com os dados de um voluntário, o histórico de status e os botões de transição.
// Os botões seguem a máquina de estados (RN01); a API confere de novo e grava o histórico (RN03).
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import {
  PAPEIS,
  STATUS_VOLUNTARIO,
  TRANSICOES,
  descreverDisponibilidade,
  formatarData,
  formatarHoras,
  rotuloAcao,
} from '../lib/formatos';
import { Alerta, Modal, Pessoa, Selo } from './ui';

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

  useEffect(() => {
    if (!id) return;
    setV(null);
    setErro('');
    setObservacao('');
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
      {v && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Pessoa nome={v.nome} detalhe={v.email} />
            <Selo status={v.status} />
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
