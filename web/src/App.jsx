// Rotas do site. "/participar" e "/login" são públicas; o resto exige login.
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Participar from './pages/Participar';
import Login from './pages/Login';
import VisaoGeral from './pages/VisaoGeral';
import Voluntarios from './pages/Voluntarios';
import Inscricoes from './pages/Inscricoes';
import Oficinas from './pages/Oficinas';
import Termos from './pages/Termos';
import Usuarios from './pages/Usuarios';
import Validar from './pages/Validar';

function RotaProtegida({ children }) {
  const { usuario, carregando } = useAuth();
  const local = useLocation();
  if (carregando) return <p className="p-10 text-sm text-muted-foreground">Carregando…</p>;
  if (!usuario) return <Navigate to="/login" replace state={{ de: local.pathname }} />;
  return children;
}

// Só ADMIN vê a tela de usuários (a API também bloqueia os outros perfis).
function SomenteAdmin({ children }) {
  const { usuario } = useAuth();
  return usuario?.perfil === 'ADMIN' ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/participar" element={<Participar />} />
      <Route path="/login" element={<Login />} />
      <Route path="/validar" element={<Validar />} />
      <Route path="/validar/:hash" element={<Validar />} />
      <Route
        element={
          <RotaProtegida>
            <Layout />
          </RotaProtegida>
        }
      >
        <Route index element={<VisaoGeral />} />
        <Route path="voluntarios" element={<Voluntarios />} />
        <Route path="inscricoes" element={<Inscricoes />} />
        <Route path="oficinas" element={<Oficinas />} />
        <Route path="termos" element={<Termos />} />
        <Route path="usuarios" element={<SomenteAdmin><Usuarios /></SomenteAdmin>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
