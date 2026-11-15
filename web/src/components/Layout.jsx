// Moldura do painel: menu lateral, barra do topo e rodapé.
// As páginas aparecem no lugar do <Outlet />.
import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  ClipboardList,
  ExternalLink,
  FileText,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { semestreAtual } from '../lib/formatos';
import { Avatar } from './ui';

const MENU = [
  { para: '/', rotulo: 'Visão geral', icone: LayoutDashboard },
  { para: '/voluntarios', rotulo: 'Voluntários', icone: Users },
  { para: '/inscricoes', rotulo: 'Inscrições', icone: ClipboardList, contador: true },
  { para: '/oficinas', rotulo: 'Oficinas', icone: CalendarDays },
  { para: '/termos', rotulo: 'Termos e relatórios', icone: FileText },
];

const PERFIS = { ADMIN: 'Administrador', COORDENADOR: 'Coordenador' };

export default function Layout() {
  const { usuario, sair } = useAuth();
  const local = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
  const [pendentes, setPendentes] = useState(0);

  // Número no item "Inscrições" do menu. As páginas chamam isto depois de aprovar/rejeitar.
  const atualizarPendentes = useCallback(() => {
    api
      .listarVoluntarios({ status: 'PENDENTE' })
      .then((lista) => setPendentes(lista.length))
      .catch(() => {});
  }, []);

  useEffect(atualizarPendentes, [atualizarPendentes]);
  useEffect(() => setMenuAberto(false), [local.pathname]);

  const paginaAtual = MENU.find((m) => (m.para === '/' ? local.pathname === '/' : local.pathname.startsWith(m.para)));

  useEffect(() => {
    document.title = `${paginaAtual?.rotulo || 'Painel'} | SGV-ELLP`;
  }, [paginaAtual]);

  return (
    <div className="min-h-dvh">
      {/* Fundo escuro atrás do menu no celular */}
      {menuAberto && <div className="fixed inset-0 z-20 bg-black/30 lg:hidden" onClick={() => setMenuAberto(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-border bg-card px-4 pb-5 pt-7 transition-transform lg:translate-x-0 ${
          menuAberto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <NavLink to="/" className="flex items-center gap-3" aria-label="ELLP início">
            <span className="grid size-10 place-items-center rounded-[11px] bg-primary text-primary-foreground">
              <HeartHandshake className="size-5" />
            </span>
            <span>
              <span className="block font-display text-lg font-extrabold leading-none">
                ELLP<span className="text-primary">.</span>
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Gestão de voluntários
              </span>
            </span>
          </NavLink>
          <button className="btn h-8 px-2 lg:hidden" onClick={() => setMenuAberto(false)} aria-label="Fechar menu">
            <X />
          </button>
        </div>

        <div className="mt-7 rounded-lg bg-muted px-3 py-2.5">
          <p className="text-sm font-semibold">Projeto ELLP</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" /> UTFPR · Cornélio Procópio
          </p>
        </div>

        <p className="mb-2 mt-7 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Espaço de gestão
        </p>
        <nav className="flex flex-col gap-0.5">
          {MENU.map(({ para, rotulo, icone: Icone, contador }) => (
            <NavLink
              key={para}
              to={para}
              end={para === '/'}
              className={({ isActive }) =>
                `flex h-10 items-center gap-3 rounded-md px-3 text-sm transition ${
                  isActive
                    ? 'bg-accent font-semibold text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <Icone className="size-[18px]" />
              <span className="flex-1">{rotulo}</span>
              {contador && pendentes > 0 && (
                <span className="rounded-full bg-primary px-2 text-xs font-semibold leading-5 text-primary-foreground">
                  {pendentes}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-1 pt-8">
          <a
            href="/participar"
            target="_blank"
            rel="noreferrer"
            className="flex h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ExternalLink className="size-[18px]" /> Página de inscrição
          </a>
          <div className="mt-4 border-t border-border px-3 pt-4">
            <p className="text-sm font-semibold">UTFPR</p>
            <p className="text-xs text-muted-foreground">Universidade Tecnológica Federal do Paraná</p>
          </div>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col lg:pl-60">
        <header className="flex h-20 items-center justify-between gap-4 border-b border-border bg-card px-4 sm:px-9">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <button className="btn h-9 px-2 lg:hidden" onClick={() => setMenuAberto(true)} aria-label="Abrir menu">
              <Menu />
            </button>
            <span className="hidden sm:inline">Espaço de gestão /</span>
            <strong className="font-semibold text-foreground">{paginaAtual?.rotulo}</strong>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground md:inline">
              Semestre {semestreAtual()}
            </span>
            <span className="hidden h-6 w-px bg-border md:block" />
            <div className="flex items-center gap-3">
              <Avatar nome={usuario?.nome} />
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-semibold">{usuario?.nome}</p>
                <p className="text-xs text-muted-foreground">{PERFIS[usuario?.perfil] || usuario?.perfil}</p>
              </div>
            </div>
            <button className="btn h-9 px-2 text-muted-foreground hover:bg-muted" onClick={sair} title="Sair">
              <LogOut />
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-9">
          <Outlet context={{ atualizarPendentes }} />
        </main>

        <footer className="flex flex-wrap justify-between gap-2 border-t border-border px-4 py-4 text-xs text-muted-foreground sm:px-9">
          <span>© {new Date().getFullYear()} SGV-ELLP · UTFPR</span>
          <span>Projeto de extensão ELLP</span>
        </footer>
      </div>
    </div>
  );
}
