// Tela inicial do painel (/): números do projeto, gráfico de horas e atalhos.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ClipboardList, Clock3, GraduationCap, MapPin, Users } from 'lucide-react';
import fotoOficina from '../assets/oficina.jpg';
import { api } from '../lib/api';
import { formatarData, formatarHora, formatarHoras, semestreAtual } from '../lib/formatos';
import { Alerta, Avatar, Cabecalho, Pessoa, Selo, Vazio } from '../components/ui';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Converte [{ mes: "2026-11", horas }] da API no formato do gráfico.
const paraGrafico = (lista) =>
  lista.map((m) => ({ chave: m.mes, rotulo: MESES[Number(m.mes.slice(5)) - 1], horas: m.horas }));

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
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');

  // Todos os números vêm prontos de GET /dashboard, numa chamada só.
  useEffect(() => {
    api.dashboard().then(setDados).catch((e) => setErro(e.message));
  }, []);

  const numeros = useMemo(() => {
    if (!dados) return { ativos: 0, avatares: [], total: 0, pendentes: 0, realizadas: 0, planejadas: 0, horas: 0 };
    return {
      ativos: dados.voluntarios.porStatus.ATIVO,
      avatares: dados.voluntarios.ativos,
      total: dados.voluntarios.total,
      pendentes: dados.voluntarios.porStatus.PENDENTE,
      realizadas: dados.oficinas.porStatus.REALIZADA,
      planejadas: dados.oficinas.porStatus.PLANEJADA,
      horas: dados.horasTotais,
    };
  }, [dados]);
  const meses = dados ? paraGrafico(dados.horasPorMes) : [];
  const inscricoes = dados?.inscricoesRecentes || [];
  const proximas = dados?.proximasOficinas || [];

  return (
    <>
      <Cabecalho titulo="Visão geral" subtitulo="Um olhar sobre quem faz o ELLP acontecer.">
        <span className="rounded-md bg-muted px-3 py-2 text-sm font-medium text-muted-foreground">{semestreAtual()}</span>
      </Cabecalho>

      <Alerta>{erro}</Alerta>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metrica icone={Users} cor="bg-accent text-primary" rotulo="Voluntários ativos" valor={numeros.ativos} detalhe={`${numeros.total} cadastrados no total`} />
        <Metrica icone={ClipboardList} cor="bg-warning-soft text-warning" rotulo="Inscrições pendentes" valor={numeros.pendentes} detalhe="aguardando sua análise" />
        <Metrica icone={GraduationCap} cor="bg-blue-soft text-blue" rotulo="Oficinas realizadas" valor={numeros.realizadas} detalhe={`${numeros.planejadas} programadas`} />
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
                {numeros.avatares.slice(0, 4).map((v) => (
                  <span key={v.id} className="rounded-full ring-2 ring-hero"><Avatar nome={v.nome} /></span>
                ))}
                {numeros.ativos > 4 && (
                  <span className="grid size-9 place-items-center rounded-full bg-white/20 text-xs font-semibold ring-2 ring-hero">
                    +{numeros.ativos - 4}
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
          {inscricoes.length === 0 ? (
            <Vazio>Nenhuma inscrição pendente.</Vazio>
          ) : (
            <ul>
              {inscricoes.map((v) => (
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
            {numeros.pendentes} inscrições aguardando aprovação
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
          {proximas.length === 0 ? (
            <Vazio>Nenhuma oficina programada.</Vazio>
          ) : (
            <ul className="space-y-3">
              {proximas.map((o) => {
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
