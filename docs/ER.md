# Diagrama ER — SGV-ELLP

```mermaid
%%{init: {'theme': 'neutral'}}%%
erDiagram
    Usuario ||--o{ StatusHistorico : registra
    Usuario ||--o{ TermoVoluntariado : emite
    Voluntario ||--o{ Disponibilidade : possui
    Voluntario ||--o{ Participacao : participa
    Oficina ||--o{ Participacao : recebe
    Voluntario ||--o{ StatusHistorico : historico
    Voluntario ||--o{ TermoVoluntariado : recebe

    Usuario {
        uuid id PK
        string nome
        string email UK
        string senhaHash
        enum perfil
        boolean ativo
        datetime criadoEm
    }

    Voluntario {
        uuid id PK
        string nome
        string email UK
        string telefone
        string ra UK
        string curso
        int periodo
        string interesses
        enum status
        datetime dataEntrada
        datetime dataSaida
        boolean consentimentoLgpd
        datetime consentimentoEm
        datetime criadoEm
        datetime atualizadoEm
    }

    Disponibilidade {
        uuid id PK
        uuid voluntarioId FK
        int diaSemana
        string horaInicio
        string horaFim
    }

    Oficina {
        uuid id PK
        string tema
        string descricao
        datetime data
        string local
        float cargaHoraria
        enum status
        datetime criadoEm
    }

    Participacao {
        uuid id PK
        uuid voluntarioId FK
        uuid oficinaId FK
        enum papel
        float horasValidas
        datetime criadoEm
    }

    StatusHistorico {
        uuid id PK
        uuid voluntarioId FK
        uuid usuarioId FK
        enum de
        enum para
        string observacao
        datetime em
    }

    TermoVoluntariado {
        uuid id PK
        uuid voluntarioId FK
        uuid geradoPorId FK
        float totalHoras
        string hashValidacao UK
        datetime geradoEm
    }
```

## Legenda

- `PK` chave primária, `FK` chave estrangeira, `UK` valor único.
- **Participacao** é a tabela de junção da relação M:N entre Voluntario e Oficina.
- **StatusHistorico** só recebe inserções (histórico inalterável).
- Status do voluntário: PENDENTE, APROVADO, ATIVO, DESLIGADO.
