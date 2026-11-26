// Página pública /validar e /validar/:hash: confere a autenticidade de um Termo de Voluntariado.
// Mostra só o necessário (nome, horas e data), sem outros dados pessoais (LGPD).
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CircleAlert, CircleCheck, HeartHandshake, TriangleAlert } from 'lucide-react';
import { api, mensagemDeErro } from '../lib/api';
import { formatarDataHora, formatarHoras } from '../lib/formatos';
import { Alerta } from '../components/ui';

function Resultado({ r }) {
  if (!r.valido) {
    return (
      <div className="flex gap-3 rounded-lg bg-destructive-soft p-4 text-destructive">
        <CircleAlert className="size-5 shrink-0" />
        <div>
          <p className="font-semibold">Termo não encontrado</p>
          <p className="text-sm">Nenhum termo foi emitido com este código. Confira se ele foi digitado corretamente.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex gap-3 rounded-lg bg-success-soft p-4 text-success">
        <CircleCheck className="size-5 shrink-0" />
        <div>
          <p className="font-semibold">Termo autêntico</p>
          <p className="text-sm">Este termo foi emitido pela coordenação do Projeto de Extensão ELLP.</p>
        </div>
      </div>
      <dl className="divide-y divide-border rounded-lg border border-border text-sm">
        {[
          ['Voluntário(a)', r.voluntario],
          ['Carga horária', formatarHoras(r.totalHoras)],
          ['Emitido em', formatarDataHora(r.emitidoEm)],
        ].map(([rotulo, valor]) => (
          <div key={rotulo} className="flex justify-between gap-4 px-4 py-2.5">
            <dt className="text-muted-foreground">{rotulo}</dt>
            <dd className="text-right font-medium">{valor}</dd>
          </div>
        ))}
      </dl>
      {!r.integro && (
        <div className="flex gap-3 rounded-lg bg-warning-soft p-4 text-warning">
          <TriangleAlert className="size-5 shrink-0" />
          <p className="text-sm">
            As horas registradas no sistema mudaram depois da emissão. O termo é autêntico, mas pode estar desatualizado.
          </p>
        </div>
      )}
    </div>
  );
}

export default function Validar() {
  const { hash } = useParams();
  const navegar = useNavigate();
  const [codigo, setCodigo] = useState(hash || '');
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    document.title = 'Validar termo | SGV-ELLP';
  }, []);

  // Sempre que o código da URL muda, consulta a API.
  useEffect(() => {
    setResultado(null);
    setErro('');
    if (!hash) return;
    setCodigo(hash);
    setCarregando(true);
    api
      .validarTermo(hash.trim().toLowerCase())
      .then(setResultado)
      .catch((e) => setErro(mensagemDeErro(e)))
      .finally(() => setCarregando(false));
  }, [hash]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted px-4 py-12">
      <div className="cartao w-full max-w-lg space-y-6 p-7">
        <Link to="/participar" className="flex items-center gap-3" aria-label="ELLP">
          <span className="grid size-10 place-items-center rounded-[11px] bg-primary text-primary-foreground">
            <HeartHandshake className="size-5" />
          </span>
          <span className="font-display text-lg font-extrabold leading-none">
            ELLP<span className="text-primary">.</span>
          </span>
        </Link>

        <div>
          <h1 className="text-2xl font-bold">Validar Termo de Voluntariado</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Digite o código de validação impresso no termo (64 caracteres).
          </p>
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            navegar(`/validar/${codigo.trim().toLowerCase()}`);
          }}
        >
          <input
            className="campo font-mono text-xs"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="ex.: 9cc6522c6a55…"
            aria-label="Código de validação"
          />
          <button className="btn-primario" disabled={!codigo.trim()}>Validar</button>
        </form>

        {carregando && <p className="text-sm text-muted-foreground">Consultando…</p>}
        <Alerta>{erro}</Alerta>
        {resultado && <Resultado r={resultado} />}
      </div>
    </div>
  );
}
