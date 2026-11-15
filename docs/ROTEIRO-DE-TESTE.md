# Roteiro de teste do SGV-ELLP

Cerca de 15 minutos. Os dados de demonstração são **fictícios**. Cada passo indica o requisito ou a regra de negócio (RN) verificada; as regras estão em [regras-de-negocio.md](regras-de-negocio.md).

**Acesso:** o endereço e a conta de teste foram enviados junto com a entrega. Na demonstração local com Docker: http://localhost:8080, `admin@ellp.exemplo` / `demo-ellp-2026`.

## Área pública

1. **Pré-cadastro com LGPD.** Abra `/participar`, preencha o formulário **sem** marcar o consentimento e envie: o envio é recusado. Marque o consentimento e envie de novo: a inscrição é recebida.
2. **Inscrição duplicada.** Repita o mesmo e-mail: o sistema avisa que já existe uma inscrição.

## Painel da coordenação

3. **Login.** Entre em `/login` com a conta de teste. Uma senha errada é recusada.
4. **Visão geral.** Confira os números, o gráfico de horas dos últimos 6 meses, as inscrições recentes e as próximas oficinas.
5. **Aprovar inscrição (RN01, RN03).** Em **Inscrições**, abra a inscrição do passo 1 e clique em **Aprovar**. Em **Voluntários**, abra a mesma pessoa e clique em **Ativar**. O histórico mostra as duas mudanças, com data e coordenador. Só aparecem os botões das transições permitidas (não há como pular de Pendente para Ativo).
6. **Datas automáticas (RN02).** No mesmo voluntário, a data de entrada foi preenchida ao ativar.
7. **Busca e filtros.** Em **Voluntários**, filtre por status, interesse ou disponibilidade e busque por nome.
8. **Vínculo com oficina (RN07, RN08).** Em **Oficinas**, abra "Programando jogos simples" e vincule o voluntário ativado. Ele some da lista de opções da mesma oficina (não pode ser vinculado duas vezes). Voluntários pendentes nem aparecem na lista.
9. **Ajuste de horas.** Altere as horas de um participante (ex.: 2). Um valor acima da carga horária da oficina é recusado.
10. **Concluir oficina (RN05, RN09).** Clique em **Marcar como realizada**. As horas passam a contar para os voluntários, e o botão de remover vínculo desaparece.
11. **Emitir termo (RN04, RN06).** Em **Termos e relatórios**, clique em **Emitir PDF** para o voluntário. O PDF abre com as atividades, o total de horas e o código de validação SHA-256.
12. **Validar termo.** Clique no link impresso no PDF (ou no ícone de link na lista de termos emitidos): a página pública confirma que o termo é autêntico e mostra só nome, horas e data (LGPD). Um código inventado aparece como "não encontrado".
13. **Desligar voluntário (RN01, RN02).** Desligue um voluntário ativo: a data de saída é preenchida e não há mais transições possíveis.
14. **Usuários (perfil ADMIN).** Em **Usuários**, crie um coordenador, saia e entre com ele: o menu **Usuários** não aparece para o perfil Coordenador. Volte como ADMIN e desative o coordenador: ele não consegue mais entrar, mas o registro continua no sistema.

## Testes automatizados

Com o projeto rodando localmente (Node.js e Docker), na pasta do projeto:

```bash
npm test                  # unitários: máquina de estados, cálculo de horas e hash
npm run test:integracao   # todas as regras pela API, em um banco de teste separado
```
