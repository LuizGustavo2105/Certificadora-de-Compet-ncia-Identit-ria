// Login da coordenação. Chama POST /auth/login e guarda o token JWT.
// (O protótipo do Lovable não tinha esta tela; segue o mesmo visual.)
import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { HeartHandshake } from 'lucide-react';
import fotoOficina from '../assets/oficina.jpg';
import { useAuth } from '../contexts/AuthContext';
import { Alerta } from '../components/ui';

export default function Login() {
  const { usuario, entrar } = useAuth();
  const navegar = useNavigate();
  const local = useLocation();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    document.title = 'Entrar | SGV-ELLP';
  }, []);

  if (usuario) return <Navigate to="/" replace />;

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await entrar(email, senha);
      navegar(local.state?.de || '/', { replace: true });
    } catch (err) {
      setErro(err.status ? err.message : 'Não foi possível falar com a API. Ela está rodando?');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-hero lg:block">
        <img src={fotoOficina} alt="Voluntários ajudando crianças em uma oficina de robótica" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,oklch(23%_0.035_160/0.9)_0%,oklch(23%_0.035_160/0.2)_70%)]" />
        <div className="absolute bottom-0 p-12 text-white">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-hero-muted">Nosso impacto</p>
          <h2 className="text-3xl font-bold">Juntos, o conhecimento vai mais longe.</h2>
          <p className="mt-2 max-w-sm text-hero-muted">
            Uma comunidade de voluntários que aproxima crianças e adolescentes de novos futuros.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <form onSubmit={enviar} className="w-full max-w-sm space-y-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-[11px] bg-primary text-primary-foreground">
              <HeartHandshake className="size-5" />
            </span>
            <div>
              <p className="font-display text-lg font-extrabold leading-none">
                ELLP<span className="text-primary">.</span>
              </p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Gestão de voluntários
              </p>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold">Área da coordenação</h1>
            <p className="mt-1 text-sm text-muted-foreground">Entre com seu e-mail e senha de coordenador.</p>
          </div>

          <div>
            <label className="rotulo" htmlFor="email">E-mail</label>
            <input id="email" type="email" className="campo" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="rotulo" htmlFor="senha">Senha</label>
            <input id="senha" type="password" className="campo" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
          </div>

          <Alerta>{erro}</Alerta>

          <button type="submit" className="btn-primario h-11 w-full" disabled={enviando || !email || !senha}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Quer ser voluntário?{' '}
            <Link to="/participar" className="font-medium text-primary hover:underline">
              Faça sua inscrição
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
