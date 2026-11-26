// Tela /usuarios (somente ADMIN): coordenadores com acesso ao painel.
// Usuários não são apagados: são desativados para preservar o histórico.
import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { api, mensagemDeErro } from '../lib/api';
import { formatarData } from '../lib/formatos';
import { useAuth } from '../contexts/AuthContext';
import { Alerta, Cabecalho, Modal, Pessoa, Vazio } from '../components/ui';

const PERFIS = { ADMIN: 'Administrador', COORDENADOR: 'Coordenador' };

export default function Usuarios() {
  const { usuario: eu } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [erro, setErro] = useState('');
  const [editando, setEditando] = useState(null); // null = fechado, {} = novo, objeto = edição

  const carregar = useCallback(() => {
    api.listarUsuarios().then(setUsuarios).catch((e) => setErro(e.message));
  }, []);

  useEffect(carregar, [carregar]);

  async function alternarAtivo(u) {
    const acao = u.ativo ? 'desativar' : 'reativar';
    if (!window.confirm(`Confirmar: ${acao} o acesso de ${u.nome}?`)) return;
    setErro('');
    try {
      await api.atualizarUsuario(u.id, { ativo: !u.ativo });
      carregar();
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  }

  return (
    <>
      <Cabecalho
        eyebrow="Acesso ao painel"
        titulo="Usuários"
        subtitulo="Coordenadores que podem gerenciar voluntários, oficinas e termos."
      >
        <button className="btn-primario" onClick={() => setEditando({})}>
          <Plus /> Novo usuário
        </button>
      </Cabecalho>

      <div className="mb-4"><Alerta>{erro}</Alerta></div>

      <div className="cartao overflow-hidden">
        {usuarios.length === 0 ? (
          <Vazio>Nenhum usuário encontrado.</Vazio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Usuário</th>
                  <th className="px-5 py-3 font-semibold">Perfil</th>
                  <th className="px-5 py-3 font-semibold">Situação</th>
                  <th className="px-5 py-3 font-semibold">Desde</th>
                  <th className="px-5 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id} className={`border-t border-border ${u.ativo ? '' : 'opacity-60'}`}>
                    <td className="px-5 py-3"><Pessoa nome={u.nome} detalhe={u.email} /></td>
                    <td className="px-5 py-3">{PERFIS[u.perfil]}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded px-2 text-xs font-medium leading-6 ${u.ativo ? 'bg-success-soft text-success' : 'bg-muted text-muted-foreground'}`}>
                        {u.ativo ? 'Ativo' : 'Desativado'}
                      </span>
                    </td>
                    <td className="px-5 py-3">{formatarData(u.criadoEm)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button className="btn h-8 px-2 text-muted-foreground hover:bg-muted" title="Editar" onClick={() => setEditando(u)}>
                          <Pencil />
                        </button>
                        {/* A API também impede que o ADMIN desative a si mesmo. */}
                        {u.id !== eu?.id && (
                          <button className={u.ativo ? 'btn-perigo h-8' : 'btn-contorno h-8'} onClick={() => alternarAtivo(u)}>
                            {u.ativo ? 'Desativar' : 'Reativar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FormUsuario
        usuario={editando}
        souEu={editando?.id === eu?.id}
        aoFechar={() => setEditando(null)}
        aoSalvar={carregar}
      />
    </>
  );
}

function FormUsuario({ usuario, souEu, aoFechar, aoSalvar }) {
  const novo = !usuario?.id;
  const [form, setForm] = useState({ nome: '', email: '', senha: '', perfil: 'COORDENADOR' });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    setErro('');
    setForm({ nome: usuario.nome || '', email: usuario.email || '', senha: '', perfil: usuario.perfil || 'COORDENADOR' });
  }, [usuario]);

  const alterar = (c) => (e) => setForm({ ...form, [c]: e.target.value });

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      if (novo) {
        await api.criarUsuario(form);
      } else {
        // Senha em branco = manter a atual
        const { senha, ...resto } = form;
        await api.atualizarUsuario(usuario.id, senha ? form : resto);
      }
      aoFechar();
      aoSalvar();
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo={novo ? 'Novo usuário' : 'Editar usuário'}
      subtitulo={novo ? 'A pessoa entra no painel com este e-mail e senha.' : 'Deixe a senha em branco para manter a atual.'}
      aberto={Boolean(usuario)}
      aoFechar={aoFechar}
    >
      <form onSubmit={salvar} className="space-y-4">
        <div>
          <label className="rotulo" htmlFor="u-nome">Nome *</label>
          <input id="u-nome" className="campo" required value={form.nome} onChange={alterar('nome')} />
        </div>
        <div>
          <label className="rotulo" htmlFor="u-email">E-mail *</label>
          <input id="u-email" type="email" className="campo" required value={form.email} onChange={alterar('email')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="rotulo" htmlFor="u-senha">{novo ? 'Senha *' : 'Nova senha'}</label>
            <input
              id="u-senha"
              type="password"
              className="campo"
              autoComplete="new-password"
              minLength={8}
              required={novo}
              value={form.senha}
              onChange={alterar('senha')}
              placeholder="mínimo 8 caracteres"
            />
          </div>
          <div>
            <label className="rotulo" htmlFor="u-perfil">Perfil</label>
            <select id="u-perfil" className="campo" value={form.perfil} onChange={alterar('perfil')} disabled={souEu}>
              {Object.entries(PERFIS).map(([k, r]) => <option key={k} value={k}>{r}</option>)}
            </select>
          </div>
        </div>
        <Alerta>{erro}</Alerta>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-contorno" onClick={aoFechar}>Cancelar</button>
          <button className="btn-primario" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>
        </div>
      </form>
    </Modal>
  );
}
