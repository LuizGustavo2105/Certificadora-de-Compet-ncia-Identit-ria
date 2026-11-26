// Tela /termos: emissão do Termo de Voluntariado em PDF (RN04 a RN06) e termos já emitidos.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, ExternalLink, FileText, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { abrirArquivo, api, mensagemDeErro } from '../lib/api';
import { formatarDataHora, formatarHoras, semestreAtual } from '../lib/formatos';
import { Alerta, Cabecalho, Pessoa, Selo, Vazio } from '../components/ui';

export default function Termos() {
  const [voluntarios, setVoluntarios] = useState([]);
  const [termos, setTermos] = useState([]);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(null); // id do voluntário/termo em processamento

  const carregar = useCallback(() => {
    Promise.all([api.listarVoluntarios({ ordenar: 'horas', ordem: 'desc' }), api.listarTermos()])
      .then(([v, t]) => {
        setVoluntarios(v);
        setTermos(t);
      })
      .catch((e) => setErro(e.message));
  }, []);

  useEffect(carregar, [carregar]);

  // RN04: só quem tem participações pode receber termo.
  const elegiveis = useMemo(() => voluntarios.filter((v) => v.totalOficinas > 0), [voluntarios]);

  async function emitir(v) {
    setErro('');
    setAviso('');
    setOcupado(v.id);
    try {
      const termo = await api.emitirTermo(v.id);
      abrirArquivo(await api.baixarPdfTermo(termo.id));
      setAviso(`Termo de ${v.nome} emitido com ${formatarHoras(termo.totalHoras)}.`);
      carregar();
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setOcupado(null);
    }
  }

  async function abrir(termo) {
    setErro('');
    setOcupado(termo.id);
    try {
      abrirArquivo(await api.baixarPdfTermo(termo.id));
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setOcupado(null);
    }
  }

  return (
    <>
      <Cabecalho
        eyebrow="Cada contribuição merece reconhecimento"
        titulo="Termos e relatórios"
        subtitulo="Consulte a dedicação dos voluntários e emita seus documentos."
      >
        <Link to="/validar" target="_blank" className="btn-contorno">
          <ShieldCheck /> Validar um termo
        </Link>
      </Cabecalho>

      <div className="mb-4 space-y-2">
        <Alerta>{erro}</Alerta>
        <Alerta tipo="sucesso">{aviso}</Alerta>
      </div>

      <div className="cartao overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-5">
          <div className="flex items-center gap-4">
            <span className="grid size-11 place-items-center rounded-lg bg-accent text-primary">
              <FileText className="size-5" />
            </span>
            <div>
              <h2 className="font-bold">Termo de Voluntariado</h2>
              <p className="text-sm text-muted-foreground">
                Atividades concluídas, carga horária total e código de validação (SHA-256).
              </p>
            </div>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {elegiveis.length} voluntários com participações
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Voluntário</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Atividades</th>
                <th className="px-5 py-3 font-semibold">Carga horária</th>
                <th className="px-5 py-3 text-right font-semibold">Documento</th>
              </tr>
            </thead>
            <tbody>
              {elegiveis.map((v) => (
                <tr key={v.id} className="border-t border-border">
                  <td className="px-5 py-3"><Pessoa nome={v.nome} detalhe={v.ra ? `RA ${v.ra}` : v.email} /></td>
                  <td className="px-5 py-3"><Selo status={v.status} /></td>
                  <td className="px-5 py-3">{v.totalOficinas} {v.totalOficinas === 1 ? 'oficina' : 'oficinas'}</td>
                  <td className="px-5 py-3 font-medium">{formatarHoras(v.totalHoras)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      className="btn-contorno h-8"
                      disabled={ocupado !== null}
                      onClick={() => emitir(v)}
                      title="Gera um novo termo com as horas atuais"
                    >
                      <Download /> {ocupado === v.id ? 'Emitindo…' : 'Emitir PDF'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {elegiveis.length === 0 && !erro && <Vazio>Nenhum voluntário com participações em oficinas ainda.</Vazio>}

        <div className="flex flex-wrap justify-between gap-2 border-t border-border px-5 py-3 text-xs text-muted-foreground">
          <span>Somente oficinas realizadas são contabilizadas na carga horária.</span>
          <span>Semestre {semestreAtual()}</span>
        </div>
      </div>

      <div className="cartao mt-6 overflow-hidden">
        <div className="border-b border-border p-5">
          <h2 className="font-bold">Termos emitidos</h2>
          <p className="text-sm text-muted-foreground">Cada emissão fica registrada com seu código de validação.</p>
        </div>
        {termos.length === 0 ? (
          <Vazio>Nenhum termo emitido ainda.</Vazio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Voluntário</th>
                  <th className="px-5 py-3 font-semibold">Horas</th>
                  <th className="px-5 py-3 font-semibold">Emitido em</th>
                  <th className="px-5 py-3 font-semibold">Código</th>
                  <th className="px-5 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {termos.map((t) => (
                  <tr key={t.id} className="border-t border-border">
                    <td className="px-5 py-3"><Pessoa nome={t.voluntario.nome} detalhe={`por ${t.geradoPor.nome}`} /></td>
                    <td className="px-5 py-3 font-medium">{formatarHoras(t.totalHoras)}</td>
                    <td className="px-5 py-3">{formatarDataHora(t.geradoEm)}</td>
                    <td className="px-5 py-3 font-mono text-xs" title={t.hashValidacao}>{t.hashValidacao.slice(0, 12)}…</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <Link to={`/validar/${t.hashValidacao}`} target="_blank" className="btn h-8 px-2 text-muted-foreground hover:bg-muted" title="Página pública de validação">
                          <ExternalLink />
                        </Link>
                        <button className="btn-contorno h-8" disabled={ocupado !== null} onClick={() => abrir(t)}>
                          <Download /> {ocupado === t.id ? 'Abrindo…' : 'PDF'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
