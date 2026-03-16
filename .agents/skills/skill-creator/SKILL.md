---
name: skill-creator
description: Crie novas habilidades (skills), modifique e melhore skills existentes e meça o desempenho das skills. Use quando os usuários quiserem criar uma skill do zero, editar ou otimizar uma skill existente, executar avaliações (evals) para testar uma skill, comparar o desempenho da skill com análise de variância ou otimizar a descrição de uma skill para melhor precisão de acionamento (triggering).
---

# Criador de Skills (Skill Creator)

Uma skill para criar novas skills e melhorá-las iterativamente.

Em alto nível, o processo de criação de uma skill funciona assim:

- Decida o que você quer que a skill faça e, aproximadamente, como ela deve fazer.
- Escreva um rascunho da skill.
- Crie alguns prompts de teste e execute o Claude com acesso à skill neles.
- Ajude o usuário a avaliar os resultados tanto qualitativa quanto quantitativamente.
- Reescreva a skill com base no feedback da avaliação do usuário sobre os resultados (e também se houver falhas gritantes).
- Repita até estar satisfeito.
- Expanda o conjunto de testes e tente novamente em maior escala.

Seu trabalho é entender em que estágio o usuário está e ajudá-lo a progredir. Por exemplo, se ele disser "quero fazer uma skill para X", você ajuda a refinar a ideia, escreve o rascunho, cria os testes, etc. Se ele já tiver um rascunho, você pula para a parte de avaliação/iteração.

## Comunicação com o usuário

O criador de skills pode ser usado por pessoas com diferentes níveis de conhecimento técnico. Preste atenção ao contexto para ajustar sua linguagem:
- Termos como "avaliação" (evaluation) e "benchmark" são aceitáveis, mas use com moderação.
- Para "JSON" e "assertion" (afirmação), verifique se o usuário entende esses conceitos antes de usá-los sem explicação.

---

## Criando uma skill

### Capturar Intenção

Comece entendendo o que o usuário quer. Se a conversa atual já contém um fluxo de trabalho (ex: "transforme isso em uma skill"), extraia as informações de lá primeiro: ferramentas usadas, sequência de passos, correções feitas, formatos de entrada/saída.

1. O que esta skill deve permitir que o Claude faça?
2. Quando esta skill deve ser acionada? (frases/contextos do usuário)
3. Qual é o formato de saída esperado?
4. Devemos configurar casos de teste?

### Entrevista e Pesquisa

Faça perguntas sobre casos de borda (edge cases), formatos de entrada/saída, arquivos de exemplo e dependências.

### Escrevendo o SKILL.md

Preencha estes componentes:
- **name**: Identificador da skill.
- **description**: Quando acionar e o que faz. Seja um pouco "persistente" na descrição para evitar que o Claude deixe de usar a skill quando ela seria útil.
- **corpo da skill**: As instruções reais.

### Guia de Escrita da Skill

#### Anatomia de uma Skill
```
nome-da-skill/
├── SKILL.md (obrigatório)
│   ├── Frontmatter YAML (name, description obrigatórios)
│   └── Instruções em Markdown
└── Recursos Agrupados (opcional)
    ├── scripts/    - Código executável para tarefas repetitivas
    ├── references/ - Documentos carregados conforme necessário
    └── assets/     - Arquivos usados na saída (modelos, ícones, fontes)
```

#### Divulgação Progressiva
As skills usam um sistema de carregamento em três níveis:
1. **Metadados** (nome + descrição) - Sempre no contexto.
2. **Corpo do SKILL.md** - No contexto quando a skill é acionada (ideal < 500 linhas).
3. **Recursos agrupados** - Conforme necessário.

Organize por domínio se a skill suportar múltiplos frameworks (ex: pastas separadas para aws.md, gcp.md).

#### Princípio da Ausência de Surpresa
As skills não devem conter malware ou código malicioso. O conteúdo da skill não deve surpreender o usuário em sua intenção.

#### Padrões de Escrita
Use o modo imperativo nas instruções. Defina formatos de saída e inclua exemplos.

### Casos de Teste

Crie 2 a 3 prompts de teste realistas. Salve-os em `evals/evals.json`.

---

## Executando e avaliando casos de teste

Coloque os resultados em `<nome-da-skill>-workspace/`, organizados por iteração (`iteration-1/`, etc.).

### Passo 1: Iniciar as execuções
Para cada caso de teste, inicie uma execução com a skill e uma de base (baseline) sem a skill (ou com a versão antiga).

### Passo 2: Rascunhar afirmações (assertions)
Enquanto as execuções ocorrem, prepare afirmações quantitativas (objetivamente verificáveis) para avaliar o sucesso.

### Passo 3: Capturar dados de tempo e tokens
Grave `total_tokens` e `duration_ms` em um arquivo `timing.json`.

### Passo 4: Dar nota, agregar e lançar o visualizador
- Use um subagente ou script para dar nota (grading) às afirmações.
- Agregue tudo em um benchmark.
- Lance o visualizador de avaliações (eval-viewer) para que o usuário revise.

### Passo 5: Ler o feedback
Leia o arquivo `feedback.json` gerado pelo usuário e foque nas melhorias sugeridas.

---

## Melhorando a skill

1. **Generalize a partir do feedback**: Tente criar instruções que funcionem para muitos casos, não apenas para os exemplos de teste.
2. **Mantenha o prompt enxuto**: Remova partes que não agregam valor ou que fazem o modelo perder tempo.
3. **Explique o "porquê"**: Em vez de apenas usar "DEVE" ou "NUNCA", explique a lógica por trás da instrução. Modelos inteligentes trabalham melhor quando entendem o motivo.
4. **Identifique trabalho repetido**: Se os testes mostram o modelo criando os mesmos scripts sempre, embale esses scripts na pasta `scripts/` da skill.

---

## Otimização da Descrição

A descrição é o que faz o Claude decidir usar a skill. Você pode otimizá-la:
1. Gere 20 consultas (queries) de teste (metade deve acionar a skill, metade não).
2. Revise o conjunto com o usuário.
3. Execute o loop de otimização (usando scripts como `run_loop.py`).
4. Aplique a melhor descrição encontrada.

---

## Instruções específicas para Claude.ai

No Claude.ai não há subagentes, então:
- Execute os testes manualmente, um por um.
- Apresente os resultados diretamente na conversa em vez de usar o visualizador de navegador.
- Pule o benchmark quantitativo e foque no feedback qualitativo.
- O script `package_skill.py` ainda funciona para gerar o arquivo `.skill` final.

---

## Ciclo Principal (Resumo):
1. Entenda o que a skill deve fazer.
2. Rascunhe ou edite a skill.
3. Execute testes com acesso à skill.
4. Avalie os resultados com o usuário (usando o visualizador se possível).
5. Repita até que ambos estejam satisfeitos.
6. Empacote a skill final e entregue ao usuário.
