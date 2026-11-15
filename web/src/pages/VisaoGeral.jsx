// Tela inicial do painel (/): números do projeto, gráfico de horas e atalhos.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ClipboardList, Clock3, GraduationCap, MapPin, Users } from 'lucide-react';
import fotoOficina from '../assets/oficina.jpg';
import { api } from '../lib/api';
import { formatarData, formatarHora, formatarHoras, semestreAtual } from '../lib/formatos';
import { Alerta, Avatar, Cabecalho, Pessoa, Selo, Vazio } from '../components/ui';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Soma as horas válidas das oficinas realizadas em cada um dos últimos 6 meses.
async function horasPorMes() {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(inicio.getFullYear(), inicio.getMonth() + i, 1);
    return { chave: `${d.getFullYear()}-${d.getMonth()}`, rotulo: MESES[d.getMonth()], horas: 0 };
  });

  const realizadas = await api.listarOficinas({ status: 'REALIZADA', de: inicio.toISOString() });
  // A listagem não traz as horas de cada participação, então buscamos os detalhes.
  const detalhes = await Promise.all(realizadas.map((o) => api.buscarOficina(o.id)));
  detalhes.forEach((o) => {
    const d = new Date(o.data);
    const mes = meses.find((m) => m.chave === `${d.getFullYear()}-${d.getMonth()}`);
    if (mes) mes.horas += o.participacoes.reduce((s, p) => s + p.horasValidas, 0);
  });
  return meses;
}

function Metrica({ icone: Icone, cor, rotulo, valor, detalhe }) {
  return (
    <div className="cartao p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{rotulo}</p>
        <span className={`grid size-9 place-items-center rounded-lg ${cor}`}><Icone className="size-[18px]" /></span>
      </div>
      <p className="mt-3 font-display text-3xl font-extrabold">{valor}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p>
    </div>
  );
}

function Grafico({ meses }) {
  const maximo = Math.max(10, ...meses.map((m) => m.horas));
  return (
    <div className="flex h-52 items-end gap-3 pt-6">
      {meses.map((m) => (
        <div key={m.chave} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-xs font-semibold">{m.horas > 0 ? formatarHoras(m.horas) : ''}</span>
          <div className="flex h-36 w-full items-end rounded-md bg-muted">
            <div
              className="w-full rounded-md bg-primary transition-all"
              style={{ height: `${(m.horas / maximo) * 100}%` }}
              title={`${m.rotulo}: ${formatarHoras(m.horas)}`}
            />
          </div>
          <span className="text-xs text-muted-foreground">{m.rotulo}</span>
        </div>
      ))}
    </div>
  );
}

export default function VisaoGeral() {
  const [voluntarios, setVoluntarios] = useState([]);
  const [oficinas, setOficinas] = useState([]);
  const [meses, setMeses] = useState([]);
  const [erro, setErro] = useState('');

  useEffect(() => {
    Promise.all([api.listarVoluntarios({ ordenar: 'criadoEm', ordem: 'desc' }), api.listarOficinas({ ordem: 'asc' }), horasPorMes()])
      .then(([v, o, m]) => {
        setVoluntarios(v);
        setOficinas(o);
        setMeses(m);
      })
      .catch((e) => setErro(e.message));
  }, []);

  const numeros = useMemo(() => {
    const agora = new Date();
    const ativos = voluntarios.filter((v) => v.status === 'ATIVO');
    const pendentes = voluntarios.filter((v) => v.status === 'PENDENTE');
    const proximas = oficinas.filter((o) => o.status === 'PLANEJADA' && new Date(o.data) >= agora);
    return {
      ativos,
      pendentes,
      proximas,
      realizadas: oficinas.filter((o) => o.status === 'REALIZADA').length,
      horas: voluntarios.reduce((s, v) => s + v.totalHoras, 0),
    };
  }, [voluntarios, oficinas]);

  return (
    <>
      <Cabecalho titulo="Visão geral" subtitulo="Um olhar sobre quem faz o ELLP acontecer.">
        <span className="rounded-md bg-muted px-3 py-2 text-sm font-medium text-muted-foreground">{semestreAtual()}</span>
      </Cabecalho>

      <Alerta>{erro}</Alerta>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metrica icone={Users} cor="bg-accent text-primary" rotulo="Voluntários ativos" valor={numeros.ativos.length} detalhe={`${voluntarios.length} cadastrados no total`} />
        <Metrica icone={ClipboardList} cor="bg-warning-soft text-warning" rotulo="Inscrições pendentes" valor={numeros.pendentes.length} detalhe="aguardando sua análise" />
        <Metrica icone={GraduationCap} cor="bg-blue-soft text-blue" rotulo="Oficinas realizadas" valor={numeros.realizadas} detalhe={`${numeros.proximas.length} próximas oficinas`} />
        <Metrica icone={Clock3} cor="bg-violet-soft text-violet" rotulo="Horas de voluntariado" valor={formatarHoras(numeros.horas)} detalhe="de dedicação ao projeto" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="cartao p-6">
          <h2 className="text-lg font-bold">Participação que cresce</h2>
          <p className="text-sm text-muted-foreground">Horas dedicadas ao projeto nos últimos 6 meses</p>
          <Grafico meses={meses} />
          <p className="mt-4 text-xs text-muted-foreground">Cada hora conta para construir novas possibilidades.</p>
        </section>

        <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-hero p-7 text-white">
          <img src={fotoOficina} alt="Voluntários ajudando crianças em uma oficina de robótica" className="absolute inset-0 size-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,oklch(23%_0.035_160/0.95)_10%,transparent_100%)]" />
          <div className="relative flex h-full flex-col justify-end">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-hero-muted">Nosso impacto</p>
            <h2 className="mt-2 text-2xl font-bold">Juntos, o conhecimento<br />vai mais longe.</h2>
            <p className="mt-2 text-sm text-hero-muted">
              Uma comunidade de voluntários que aproxima crianças e adolescentes de novos futuros.
            </p>
            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="flex -space-x-2">
                {numeros.ativos.slice(0, 4).map((v) => (
                  <span key={v.id} className="rounded-full ring-2 ring-hero"><Avatar nome={v.nome} /></span>
                ))}
                {numeros.ativos.length > 4 && (
                  <span className="grid size-9 place-items-center rounded-full bg-white/20 text-xs font-semibold ring-2 ring-hero">
                    +{numeros.ativos.length - 4}
                  </span>
                )}
              </div>
              <Link to="/voluntarios" className="btn bg-white text-hero hover:bg-white/90">Conheça a equipe</Link>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="cartao overflow-hidden">
          <div className="flex items-start justify-between p-6 pb-3">
            <div>
              <h2 className="text-lg font-bold">Novas inscrições</h2>
              <p className="text-sm text-muted-foreground">Pessoas prontas para fazer a diferença</p>
            </div>
            <Link to="/inscricoes" className="btn-link">Ver todas</Link>
          </div>
          {numeros.pendentes.length === 0 ? (
            <Vazio>Nenhuma inscrição pendente.</Vazio>
          ) : (
            <ul>
              {numeros.pendentes.slice(0, 5).map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 border-t border-border px-6 py-3">
                  <Pessoa nome={v.nome} detalhe={v.curso || v.email} />
                  <div className="flex items-center gap-4">
                    <span className="hidden text-xs text-muted-foreground sm:inline">{formatarData(v.criadoEm)}</span>
                    <Selo status={v.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="border-t border-border px-6 py-3 text-xs text-muted-foreground">
            {numeros.pendentes.length} inscrições aguardando aprovação
          </p>
        </section>

        <section className="cartao p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold">Próximas oficinas</h2>
              <p className="text-sm text-muted-foreground">Os próximos encontros do ELLP</p>
            </div>
            <Link to="/oficinas" className="btn-link">Ver agenda</Link>
          </div>
          {numeros.proximas.length === 0 ? (
            <Vazio>Nenhuma oficina programada.</Vazio>
          ) : (
            <ul className="space-y-3">
              {numeros.proximas.slice(0, 3).map((o) => {
                const d = new Date(o.data);
                return (
                  <li key={o.id}>
                    <Link to="/oficinas" className="flex gap-4 rounded-lg border border-border p-3 transition hover:border-primary/40">
                      <div className="grid w-12 shrink-0 place-items-center rounded-md bg-accent py-1 text-primary">
                        <span className="font-display text-xl font-extrabold leading-none">{d.getDate()}</span>
                        <span className="text-xs">{MESES[d.getMonth()].toLowerCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{o.tema}</p>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarDays className="size-3.5" /> {formatarHora(o.data)} · {formatarHoras(o.cargaHoraria)}
                        </p>
                        <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                          <MapPin className="size-3.5" /> {o.local}
                        </p>
                        <p className="mt-1 text-xs font-medium">{o.totalParticipantes} voluntários vinculados</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
