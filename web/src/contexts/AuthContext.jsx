// Guarda quem está logado e oferece entrar/sair para todas as telas.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, definirAoExpirar, token } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const sair = useCallback(() => {
    token.apagar();
    setUsuario(null);
  }, []);

  // Ao abrir o site, se já houver token salvo, pergunta à API quem é o usuário.
  useEffect(() => {
    definirAoExpirar(sair);
    if (!token.ler()) {
      setCarregando(false);
      return;
    }
    api
      .eu()
      .then(setUsuario)
      .catch(sair)
      .finally(() => setCarregando(false));
  }, [sair]);

  async function entrar(email, senha) {
    const resposta = await api.login(email, senha);
    token.salvar(resposta.token);
    setUsuario(resposta.usuario);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, entrar, sair }}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
