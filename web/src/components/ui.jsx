// Peças pequenas de interface usadas em várias telas.
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { STATUS_OFICINA, STATUS_VOLUNTARIO, iniciais } from '../lib/formatos';

export function Selo({ status, tipo = 'voluntario' }) {
  const mapa = tipo === 'oficina' ? STATUS_OFICINA : STATUS_VOLUNTARIO;
  const info = mapa[status] || { rotulo: status, classe: 'bg-muted' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded px-2 text-xs font-medium leading-6 ${info.classe}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {info.rotulo}
    </span>
  );
}

export function TagArea({ children }) {
  return <span className="inline-block rounded bg-blue-soft px-1.5 py-0.5 text-xs text-blue">{children}</span>;
}

const CORES_AVATAR = [
  'bg-success-soft text-success',
  'bg-blue-soft text-blue',
  'bg-violet-soft text-violet',
  'bg-rose-soft text-rose',
  'bg-warning-soft text-warning',
];

export function Avatar({ nome, tamanho = 'size-9' }) {
  // A cor depende do nome, então a mesma pessoa tem sempre a mesma cor.
  const indice = [...(nome || '')].reduce((s, c) => s + c.charCodeAt(0), 0) % CORES_AVATAR.length;
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full text-xs font-semibold ${tamanho} ${CORES_AVATAR[indice]}`}
    >
      {iniciais(nome)}
    </span>
  );
}

export function Pessoa({ nome, detalhe }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar nome={nome} />
      <div className="min-w-0">
        <p className="truncate font-medium">{nome}</p>
        {detalhe && <p className="truncate text-xs text-muted-foreground">{detalhe}</p>}
      </div>
    </div>
  );
}

export function Cabecalho({ eyebrow, titulo, subtitulo, children }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-3xl font-bold tracking-tight">{titulo}</h1>
        {subtitulo && <p className="mt-1.5 text-muted-foreground">{subtitulo}</p>}
      </div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  );
}

export function Alerta({ children, tipo = 'erro' }) {
  if (!children) return null;
  const classe = tipo === 'erro' ? 'bg-destructive-soft text-destructive' : 'bg-success-soft text-success';
  return <p className={`rounded-md px-3 py-2 text-sm ${classe}`}>{children}</p>;
}

export function Vazio({ children }) {
  return <p className="px-6 py-12 text-center text-sm text-muted-foreground">{children}</p>;
}

export function Modal({ titulo, subtitulo, aberto, aoFechar, children, largura = 'max-w-lg' }) {
  // Fecha com a tecla Esc
  useEffect(() => {
    if (!aberto) return undefined;
    const tecla = (e) => e.key === 'Escape' && aoFechar();
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [aberto, aoFechar]);

  if (!aberto) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[oklch(17%_0.02_160/0.5)] p-4"
      onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}
    >
      <div role="dialog" aria-modal="true" className={`cartao w-full ${largura} p-6 shadow-xl`}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">{titulo}</h2>
            {subtitulo && <p className="mt-0.5 text-sm text-muted-foreground">{subtitulo}</p>}
          </div>
          <button type="button" onClick={aoFechar} className="btn h-8 px-2" aria-label="Fechar">
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Paginação feita no navegador: a API devolve a lista inteira.
export function usePaginacao(itens, porPagina = 8) {
  const [pagina, setPagina] = useState(1);
  const totalPaginas = Math.max(1, Math.ceil(itens.length / porPagina));
  useEffect(() => setPagina(1), [itens]);
  const inicio = (pagina - 1) * porPagina;
  return {
    visiveis: itens.slice(inicio, inicio + porPagina),
    pagina,
    totalPaginas,
    setPagina,
    descricao: itens.length
      ? `${inicio + 1}–${Math.min(inicio + porPagina, itens.length)} de ${itens.length} registros`
      : '0 registros',
  };
}

export function Paginacao({ pagina, totalPaginas, setPagina, descricao }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 text-sm text-muted-foreground">
      <span>{descricao}</span>
      <div className="flex items-center gap-2">
        <button className="btn-contorno h-8" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>
          Anterior
        </button>
        <span className="px-1">
          {pagina} / {totalPaginas}
        </span>
        <button className="btn-contorno h-8" disabled={pagina >= totalPaginas} onClick={() => setPagina(pagina + 1)}>
          Próxima
        </button>
      </div>
    </div>
  );
}
