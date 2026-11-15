# Regras de negócio — SGV-ELLP

Regras aplicadas pela API. Cada uma indica onde está implementada e como é testada.

| Código | Regra | Onde está no código |
|---|---|---|
| RN01 | Transições de status permitidas: PENDENTE → APROVADO, APROVADO → ATIVO, ATIVO → DESLIGADO e PENDENTE → DESLIGADO (rejeição). Qualquer outra é recusada. | `src/services/fsm.js` |
| RN02 | Ao ir para ATIVO, preenche `dataEntrada`; ao ir para DESLIGADO, preenche `dataSaida`. | `src/services/fsm.js` |
| RN03 | Toda transição de status gera um registro em StatusHistorico (somente inserção). | `src/services/voluntarios.service.js` |
| RN04 | Só voluntários com participações podem receber o Termo de Voluntariado. | (etapa do termo) |
| RN05 | Carga horária total = soma das `horasValidas` das participações em oficinas REALIZADAS. | `src/services/horas.js` |
| RN06 | O hash do termo é o SHA-256 do conteúdo (id do voluntário, horas, atividades e data de emissão). | (etapa do termo) |
| RN07 | Um voluntário não pode ser vinculado duas vezes à mesma oficina. | índice único no `schema.prisma` + `src/services/oficinas.service.js` |
| RN08 | Só voluntários com status ATIVO podem ser vinculados a uma oficina. Oficinas CANCELADAS não recebem vínculos. | `src/services/oficinas.service.js` |
| RN09 | Um vínculo voluntário x oficina só pode ser removido enquanto a oficina estiver PLANEJADA. Depois de REALIZADA, a participação faz parte do histórico; correções são feitas ajustando `horasValidas`, que não pode passar da carga horária da oficina. | `src/services/oficinas.service.js` |

## Justificativa das regras RN08 e RN09

- **RN08:** ATIVO é o status que indica que o voluntário está atuando no projeto (é quando `dataEntrada` é preenchida). Vincular voluntários PENDENTES, APROVADOS ou DESLIGADOS permitiria computar horas para quem ainda não foi aceito ou já saiu, e essas horas apareceriam no termo.
- **RN09:** o termo é emitido com um hash de validação (RN06). Se participações de oficinas já realizadas pudessem ser apagadas, o total de horas mudaria depois da emissão e o histórico deixaria de ser confiável. Enquanto a oficina está PLANEJADA, remover o vínculo é apenas a correção de um engano.

## Ciclo de vida da oficina

PLANEJADA → REALIZADA ou PLANEJADA → CANCELADA. REALIZADA e CANCELADA são estados finais. Oficinas não são apagadas.

## Testes

`npm test` executa os testes unitários de RN01, RN02, RN05 e do ciclo de vida da oficina (`test/fsm.test.js`).
