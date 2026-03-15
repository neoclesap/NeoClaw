markdown
# Spec: Telegram Output Handler — NeoClaw

**Versão:** 1.1  
**Status:** Aprovada  
**Autor original:** SandecoClaw Agent  
**Adaptado por:** neocles — versão NeoClaw (fork do projeto original SandecoClaw)  
**Data:** 2026-03-09  

---

## 1. Resumo

O módulo de Output atua como a boca do SandecoClaw. Ele capta o Output resultativo estático final da Pipeline (do Agent Loop ou das Skills puras processadas) e define as estratégias adequadas de exibição — seja "Chunking" em mensagens grandes de texto, seja disparo de documentos em markdown ou aviso explícito de timeout e erro com formatações de emoji.

---

## 2. Contexto e Motivação

**Problema:**
LLMs (como GPT-4 e Gemini) são programados para gerar outputs massivos de 10k-30k tokens em documentações contínuas e códigos densos. O Telegram tem um hard limit restrito de `4096` caracteres por bolha de mensagem. Um envio direto em texto estoura a API (Erro HTTP 400 Payload Too Large). Além disso, documentos gerados na pipeline em JSON ou Markdowns complexos não devem ser "espremidos" em caixas de chat estreitas.

**Evidências:**
Usuários frequentemente pedem por exemplo 3 mil linhas de TCC, que o LLM gera, mas o Agent morreria no Output sem dividir.

**Por que agora:**
A padronização das outputs de Skills requer renderizar os "arquivos" processados na ponta pra uso (salvar e baixar). Sem um output strategy bem definido, a UX morre no console log ou crashea a aplicação final.

---

## 3. Goals (Objetivos)

- [ ] G-01: Prover interface `TelegramOutputHandler` para separar preocupações de Output.
- [ ] G-02: Receber strings > 4096 docs em `TextOutputStrategy` sendo recortadas dinamicamente sem matar a sintaxe ou palavras ao meio, enviando de forma serial múltipla.
- [ ] G-03: Receber tags classificadoras "ARQUIVO.MD" pelo interpretador via regex e encapsular o envio como `FileOutputStrategy` enviando um Attach de arquivo local limpo para o Telegram Document do Usuário.
- [ ] G-04: Prover `AudioOutputStrategy` para sintetizar texto em voz (TTS) via Microsoft Edge TTS quando a flag de áudio for detectada no Pipeline.

**Métricas de sucesso:**
| Métrica | Baseline atual | Target | Prazo |
|---------|---------------|--------|-------|
| Payload de API Error (4096 bytes ext.) | Alto Risco | 0 Crash de Length | MVP |
| Taxa de Conversão Artefatos para Arquivos | N/A | 100% em .md Skills | Continuo |

---

## 4. Non-Goals (Fora do Escopo)

- NG-01: Não implementaremos botões de inline HTML/CSS no Telegram (Keyboard buttons de sim/nao para o AgentLoop - interface apenas command-line/chat pura simplista inicial).
- NG-02: MarkdownV2 nativo super restritivo (Que exige escape de `()`, `-`, `!` etc). O LLM falha ao escapar nativamente. Usaremos texto formatado cru seguro e legível de fallback.

---

## 5. Usuários e Personas

**Usuario:** Neocles, via aplicativo de Telegram que se beneficia de uma Timeline dividida limpa pra leitura dos relatórios com suporte a baixar em .MD suas specs, PRDs etc.

---

## 6. Requisitos Funcionais

### 6.1 Requisitos Principais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | O TextOutputStrategy deverá fatiar arrays de String se e apenas se o String global ultrapassar limite configurado. | Must | Strings de 9000 bytes criam 3 bolhas limpas sendo enviadas em Promise All na exata ordem do Array. |
| RF-02 | O FileOutputStrategy deve interceptar a flag de envio em arquivo de Markdown e salvar temporariamente no Node pra usar Upload de buffer grammy `replyWithDocument()`. | Must | Geração de documento na Skill envia um anexo com Titulo formatado apropriadamente. |
| RF-03 | O ErrorOutputStrategy formata em bloco emoji amarelo e dispara apenas avisos. | Must | Erros críticos de Prompt/API disparam "⚠️ Erro: X" ao invés de quebra silenciosa no Nodejs. |
| RF-04 | O AudioOutputStrategy deve sintetizar o texto em áudio `.ogg` e enviar como mensagem de voz (`replyWithVoice`) caso a flag `isAudio` esteja ativa no resultado. | Must | Recebimento de áudio no Telegram em substituição ao texto puro. |

### 6.2 Fluxo Principal (Happy Path)

1. Pipeline AI retornou conteúdo com flag `isAudio: true`.
2. Output Handler aciona `AudioOutputStrategy`.
3. Sistema sinaliza `record_voice` no Telegram.
4. Texto é limpo de Markdown e enviado para `edge-tts-universal`.
5. Buffer de áudio resultante é salvo temporariamente no `./tmp/`.
6. Bot envia o arquivo como Voice Note e deleta o arquivo temporário em seguida.

### 6.3 Fluxos Alternativos

Falhas - ver seção de Edge Cases.

---

## 7. Requisitos Não-Funcionais

| ID | Requisito | Valor alvo | Observação |
|----|-----------|-----------|------------|
| RNF-01 | Ordem das Mensagens (Sync) | 100% Cronologico | Chunks mal organizados perdem sentido. Async/Await estrito no "for...of" loop em vez de map() promise async. |

---

## 8. Design e Interface

Componente lida com a visibilidade final no Chat Window do Telegram Mobile e Web.

---

## 9. Modelo de Dados

Não gera tabela SQLite. É pass-through state. Memória do SQLite captura a string pura unificada antes do Output SplitHandler agir.

---

## 10. Integrações e Dependências

| Dependência | Tipo | Impacto se indisponível |
|-------------|------|------------------------|
| API Grammy (Send) | Obrigatória | Nenhuma response vai chegar. Timeout nativo por Retry do app telegram após 60 segs (loop eterno para o server node). |
| `edge-tts-universal` | Secundária | O sistema faz fallback para `TextOutputStrategy` com um aviso de erro na geração do áudio. |

---

## 11. Edge Cases e Tratamento de Erros

| Cenário | Trigger | Comportamento esperado |
|---------|---------|----------------------|
| EC-01: Rate Limiting Telegram (429 Too Many Requests) | O Output gerou 30 chunks sequenciais por um arquivo colossal e o TG bloqueia Flood. | O Grammy deve emitir Erro 429. Catch Strategy dorme a promessa do Node JS (`sleep(timeout)`) exposto pelo cabeçalho `Retry-After` da API, e re-dispara via fila com buffer na sequencia restrita sem perda do payload do chunk. |
| EC-02: Path File Corrupted / Cannot Write TMP | Arquivo `.md` pedido para export mas pasta /tmp sem prems de IO Read. | Captura o err fs.Write, e retrocede mandando como texto em Chunk Alerting pro usário: "Nao consegui gerar arq, segue texto puro...". |
| EC-03: Bot Blocker | O user bloqueia o bot ou desativa mid-reply. | O `ctx.reply` lança erro "Forbidden". Output handler descarta em Catch e loga "Msg abandonada, User bot-blocked" para não falhar stack Node. |

---

## 12. Segurança e Privacidade

- Não é mandado NADA sensivel de internal stacks logs de `Error` que exponham as tokens das APIS Gemini pra tela de erro final. Somente "API Provider Gemini falhou".

---

## 13. Plano de Rollout

Será construído instanciando o `OutputHandler` diretamente na ponta passiva do Controller Root.

---

## 14. Open Questions

N/A
