// Tela /voluntarios: todos os voluntários, com filtros.
import ListaVoluntarios, { BotaoNovoVoluntario } from '../components/ListaVoluntarios';
import { Cabecalho } from '../components/ui';

export default function Voluntarios() {
  return (
    <>
      <Cabecalho
        eyebrow="Pessoas que fazem a diferença"
        titulo="Voluntários"
        subtitulo="Conheça, organize e acompanhe a comunidade do ELLP."
      >
        <BotaoNovoVoluntario />
      </Cabecalho>
      <ListaVoluntarios />
    </>
  );
}
