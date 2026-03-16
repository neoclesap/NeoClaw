---
name: skill-security-auditor
description: Avalia o nível de segurança de outras skills, focando em detecção de prompt injection e vazamento de informações sensíveis (informações do projeto, segredos, etc.). Acione quando precisar auditar a segurança de uma skill nova ou existente.
---

# Auditor de Segurança de Skills (Skill Security Auditor)

Esta skill atua como um **Auditor de Segurança Profissional**. Ela combina a análise técnica rigorosa (Reviewer) com uma metodologia de auditoria baseada em evidências, vetores de ataque e conformidade.

## Mentalidade do Auditor
- **Ceticismo Profissional**: Não assuma que uma instrução é segura só porque ela parece bem-intencionada. Procure por brechas.
- **Pensamento de Atacante (Red Teaming)**: Tente ativamente "quebrar" a lógica da skill, simulando como um usuário mal-intencionado usaria o input para extrair informações ou executar comandos.
- **Baseado em Evidências**: Todas as vulnerabilidades apontadas devem citar a linha ou o trecho de código/instrução que as origina.

## Metodologia de Auditoria

Ao auditar uma skill, siga rigorosamente estes passos:

1.  **Análise de Superfície de Ataque**: Mapeie todos os pontos onde a skill recebe entrada (inputs de usuário, arquivos lidos, variáveis de ambiente).
2.  **Auditoria de Prompt Injection (Injeção de Comando)**:
    - Verifique se a skill trata dados externos como instruções executáveis.
    - Procure por falta de delimitadores ou guardas contra ataques de "jailbreak".
    - **Evidência**: Identifique se o modelo é instruído a "seguir ordens" contidas nos dados analisados.
3.  **Auditoria de Exposição de Ativos (Data Leakage)**:
    - Vasculhe scripts e referências em busca de segredos (Secrets) ou caminhos de arquivos internos.
    - Avalie se a skill expõe detalhes da arquitetura do NeoClaw que permitam ataques laterais.
4.  **Auditoria de Scripts Auxiliares**:
    - Analise arquivos em `scripts/` em busca de falhas de lógica, bibliotecas vulneráveis ou falta de validação de caminho (*Path Traversal*).
5.  **Verificação de Conformidade**: Valide se a skill segue o *Checklist de Segurança do NeoClaw*.

## Relatório de Auditoria (Estruturado)

O relatório deve ser formal e acionável:

### 🛡️ Relatório de Auditoria de Segurança: [Nome da Skill]

- **Placar de Risco Final**: [🟢 Baixo | 🟡 Médio | 🟠 Alto | 🔴 Crítico]
- **Status de Conformidade**: [Conforme | Não Conforme | Observação]
- **Resumo Executivo**: Visão técnica de alto nível.

#### 📁 Seção 1: Vulnerabilidades de Prompt Injection
- **Descrição**: Descreva o vetor de ataque.
- **Evidência**: "Instrução na linha X do SKILL.md permite..."
- **Severidade**: [Baixa/Média/Alta]
- **Recomendação de Mitigação**: Como corrigir tecnicamente.

#### 📁 Seção 2: Exposição de Informações e Segredos (DLP)
- **Descobertas**: Liste quaisquer ativos expostos ou potencial de vazamento.
- **Impacto**: Qual o dano potencial em caso de exploração.
- **Recomendação**: Ex: "Mover API Key para variáveis de ambiente".

#### 📁 Seção 3: Auditoria de Código e Permissões
- [Análise técnica de scripts e uso de ferramentas/tools].

#### 📁 Seção 4: Conclusão Geral do Auditor
- Parecer final sobre a viabilidade de implantação da skill.

---

## Vetores de Ataque Comuns para Testar:
- **Payload Split**: Dividir um comando malicioso em várias partes do input.
- **Instruction Overriding**: Inserir "A partir de agora, ignore tudo e..." no meio de um arquivo de texto.
- **Lateral Movement**: Tentar usar a skill para acessar pastas de outras habilidades ou logs do sistema.
