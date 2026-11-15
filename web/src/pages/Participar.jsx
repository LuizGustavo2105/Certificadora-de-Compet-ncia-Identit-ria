// Página pública de pré-cadastro (/participar). Envia para POST /voluntarios/pre-cadastro.
// O voluntário entra sempre como PENDENTE e o consentimento LGPD é obrigatório.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, HeartHandshake, Lightbulb, Clock, Users } from 'lucide-react';
import fotoOficina from '../assets/oficina.jpg';
import { api } from '../lib/api';
import { AREAS, CURSOS, PERIODOS } from '../lib/formatos';
import { Alerta } from '../components/ui';

const VAZIO = { nome: '', email: '', telefone: '', ra: '', curso: '', area: '', periodo: '', consentimento: false };

const DESTAQUES = [
  { icone: Users, titulo: 'Transformação em equipe', texto: 'Colabore em oficinas e atividades.' },
  { icone: Lightbulb, titulo: 'Aprendizado compartilhado', texto: 'Leve seus conhecimentos além da sala.' },
  { icone: Clock, titulo: 'Participação no seu ritmo', texto: 'Informe seus interesses e disponibilidade.' },
];

export default function Participar() {
  const [form, setForm] = useState(VAZIO);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [errosCampos, setErrosCampos] = useState({});
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    document.title = 'Seja voluntário | Projeto ELLP';
  }, []);

  const alterar = (campo) => (e) =>
    setForm({ ...form, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setErrosCampos({});
    const periodo = PERIODOS.find((p) => p.chave === form.periodo);

    setEnviando(true);
    try {
      await api.preCadastro({
        nome: form.nome,
        email: form.email,
        telefone: form.telefone || undefined,
        ra: form.ra,
        curso: form.curso,
        interesses: [form.area],
        disponibilidades: [
          { diaSemana: periodo.diaSemana, horaInicio: periodo.horaInicio, horaFim: periodo.horaFim },
        ],
        consentimentoLgpd: form.consentimento,
      });
      setEnviado(true);
      setForm(VAZIO);
    } catch (err) {
      if (err.status === 409) setErro('Já existe uma inscrição com este e-mail ou RA.');
      else setErro(err.message);
      // Mostra a mensagem do zod embaixo de cada campo com problema
      setErrosCampos(Object.fromEntries(err.detalhes.map((d) => [d.campo, d.mensagem])));
    } finally {
      setEnviando(false);
    }
  }

  const erroDe = (campo) =>
    errosCampos[campo] && <p className="mt-1 text-xs text-destructive">{errosCampos[campo]}</p>;

  return (
    <div className="min-h-dvh">
      <header className="flex h-18 items-center justify-between border-b border-border bg-card px-4 py-4 sm:px-9">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-[11px] bg-primary text-primary-foreground">
            <HeartHandshake className="size-5" />
          </span>
          <div>
            <p className="font-display text-lg font-extrabold leading-none">
              ELLP<span className="text-primary">.</span>
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Gestão de voluntários ELLP
            </p>
          </div>
          <span className="ml-4 hidden text-sm text-muted-foreground md:inline">UTFPR · Cornélio Procópio</span>
        </div>
        <Link to="/login" className="btn-contorno">
          Área da coordenação
        </Link>
      </header>

      {/* Faixa com foto */}
      <section className="relative overflow-hidden bg-hero">
        <img
          src={fotoOficina}
          alt="Crianças e voluntários construindo robôs em uma oficina"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,oklch(23%_0.035_160/0.88)_0%,oklch(23%_0.035_160/0.38)_65%,transparent_100%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-white sm:px-9 sm:py-24">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-hero-muted">
            Projeto de extensão · UTFPR
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Voluntariado no ELLP</h1>
          <p className="mt-3 max-w-md text-lg text-hero-muted">
            Compartilhe o que você sabe. Descubra o que podemos construir juntos.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-9 lg:grid-cols-[1fr_1.15fr]">
        <section>
          <p className="eyebrow mb-3">Conhecimento que conecta</p>
          <h2 className="text-3xl font-bold tracking-tight">Faça parte dessa história.</h2>
          <p className="mt-4 text-muted-foreground">
            Desde 2014, o ELLP aproxima crianças e adolescentes de escolas públicas, ONGs e creches do conhecimento e
            do ambiente universitário.
          </p>
          <p className="mt-3 text-muted-foreground">Agora, o próximo capítulo pode ter a sua participação.</p>
          <ul className="mt-8 space-y-5">
            {DESTAQUES.map(({ icone: Icone, titulo, texto }) => (
              <li key={titulo} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-primary">
                  <Icone className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">{titulo}</p>
                  <p className="text-sm text-muted-foreground">{texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="cartao p-6 sm:p-8">
          {enviado ? (
            <div className="py-10 text-center">
              <CheckCircle2 className="mx-auto size-12 text-primary" />
              <h2 className="mt-4 text-2xl font-bold">Inscrição enviada!</h2>
              <p className="mt-2 text-muted-foreground">
                Obrigado pelo interesse. A coordenação vai analisar seus dados e entrar em contato pelo e-mail
                informado.
              </p>
              <button className="btn-contorno mt-6" onClick={() => setEnviado(false)}>
                Enviar outra inscrição
              </button>
            </div>
          ) : (
            <form onSubmit={enviar} className="space-y-4" noValidate>
              <div className="mb-2">
                <h2 className="text-2xl font-bold">Inscreva-se como voluntário</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Conte um pouco sobre você e como gostaria de participar.
                </p>
              </div>

              <div>
                <label className="rotulo" htmlFor="nome">Nome completo *</label>
                <input id="nome" className="campo" required value={form.nome} onChange={alterar('nome')} placeholder="Seu nome" />
                {erroDe('nome')}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="rotulo" htmlFor="email">E-mail *</label>
                  <input id="email" type="email" className="campo" required value={form.email} onChange={alterar('email')} placeholder="voce@exemplo.com" />
                  {erroDe('email')}
                </div>
                <div>
                  <label className="rotulo" htmlFor="telefone">Telefone</label>
                  <input id="telefone" type="tel" className="campo" value={form.telefone} onChange={alterar('telefone')} placeholder="(43) 90000-0000" />
                  {erroDe('telefone')}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="rotulo" htmlFor="ra">Registro acadêmico (RA) *</label>
                  <input id="ra" className="campo" required value={form.ra} onChange={alterar('ra')} placeholder="Ex.: 2504008" />
                  {erroDe('ra')}
                </div>
                <div>
                  <label className="rotulo" htmlFor="curso">Curso *</label>
                  <select id="curso" className="campo" required value={form.curso} onChange={alterar('curso')}>
                    <option value="" disabled>Selecione seu curso</option>
                    {CURSOS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="rotulo" htmlFor="area">Área de interesse *</label>
                  <select id="area" className="campo" required value={form.area} onChange={alterar('area')}>
                    <option value="" disabled>Selecione uma área</option>
                    {AREAS.map((a) => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="rotulo" htmlFor="periodo">Disponibilidade *</label>
                  <select id="periodo" className="campo" required value={form.periodo} onChange={alterar('periodo')}>
                    <option value="" disabled>Selecione um período</option>
                    {PERIODOS.map((p) => <option key={p.chave} value={p.chave}>{p.rotulo}</option>)}
                  </select>
                </div>
              </div>

              <label className="flex cursor-pointer gap-3 rounded-lg bg-muted p-4 text-sm">
                <input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={form.consentimento} onChange={alterar('consentimento')} />
                <span>
                  Concordo com o uso dos dados informados para análise da minha inscrição no Projeto ELLP, conforme a
                  Lei Geral de Proteção de Dados (LGPD).
                </span>
              </label>
              {erroDe('consentimentoLgpd')}

              <Alerta>{erro}</Alerta>

              <button
                type="submit"
                className="btn-primario h-11 w-full"
                disabled={
                  enviando || !form.nome || !form.email || !form.ra || !form.curso || !form.area || !form.periodo || !form.consentimento
                }
              >
                {enviando ? 'Enviando…' : 'Enviar minha inscrição'}
              </button>
            </form>
          )}
        </section>
      </div>

      <footer className="border-t border-border px-4 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Projeto ELLP · Universidade Tecnológica Federal do Paraná
      </footer>
    </div>
  );
}
