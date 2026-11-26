// Tela /inscricoes: só os voluntários PENDENTES, para aprovar ou rejeitar.
import ListaVoluntarios, { BotaoNovoVoluntario } from '../components/ListaVoluntarios';
import { Cabecalho } from '../components/ui';

export default function Inscricoes() {
  return (
    <>
      <Cabecalho
        eyebrow="Pessoas que fazem a diferença"
        titulo="Inscrições"
        subtitulo="Acolha novos talentos e acompanhe as inscrições recebidas."
      >
        <BotaoNovoVoluntario />
      </Cabecalho>
      <ListaVoluntarios statusFixo="PENDENTE" rotuloAcao="Analisar" textoContagem="inscrições pendentes" />
    </>
  );
}
