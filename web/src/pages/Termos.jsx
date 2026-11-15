// Tela /termos: voluntários com participações e sua carga horária (RN04 e RN05).
// A emissão do PDF depende da rota de termos da API, que ainda não existe.
import { useEffect, useMemo, useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { api } from '../lib/api';
import { formatarHoras, semestreAtual } from '../lib/formatos';
import { Alerta, Cabecalho, Pessoa, Selo, Vazio } from '../components/ui';

export default function Termos() {
  const [voluntarios, setVoluntarios] = useState([]);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api
      .listarVoluntarios({ ordenar: 'horas', ordem: 'desc' })
      .then(setVoluntarios)
      .catch((e) => setErro(e.message));
  }, []);

  // RN04: só quem tem participações pode receber termo.
  const elegiveis = useMemo(() => voluntarios.filter((v) => v.totalOficinas > 0), [voluntarios]);

  return (
    <>
      <Cabecalho
        eyebrow="Cada contribuição merece reconhecimento"
        titulo="Termos e relatórios"
        subtitulo="Consulte a dedicação dos voluntários e emita seus documentos."
      />

      <div className="cartao overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-5">
          <div className="flex items-center gap-4">
            <span className="grid size-11 place-items-center rounded-lg bg-accent text-primary">
              <FileText className="size-5" />
            </span>
            <div>
              <h2 className="font-bold">Termo de Voluntariado</h2>
              <p className="text-sm text-muted-foreground">
                Atividades concluídas, carga horária total e identificação do voluntário.
              </p>
            </div>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {elegiveis.length} voluntários com participações
          </span>
        </div>

        {erro && <div className="p-5"><Alerta>{erro}</Alerta></div>}

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
                    <button className="btn-contorno h-8" disabled title="Disponível quando a rota de termos da API estiver pronta">
                      <Download /> Emitir PDF
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
    </>
  );
}
