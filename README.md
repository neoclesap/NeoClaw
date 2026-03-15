### Parte 1

# 🤖 NeoClaw

O **NeoClaw** é um agente de inteligência artificial pessoal, baseado na arquitetura do projeto **Sandeclaw** do Professor Sandeco. Ele funciona integrado ao Telegram, permitindo o uso de habilidades (skills) customizadas, processamento de documentos e comandos de voz.

## 🚀 Funcionalidades
- 🗣️ **Comandos de Voz**: Transcrição local usando Whisper.
- 🛠️ **Skills Dinâmicas**: Carregamento de habilidades para tarefas específicas (ex: análise de documentos, criação de títulos para YouTube).
- 📱 **Interface Telegram**: Controle total do agente pelo celular.
- 🔒 **Segurança**: Filtro de ID de usuário para responder apenas ao dono.

## 🛠️ Tecnologias Utilizadas
- [Google Antigravity / Cursor](https://cursor.com/)
- [Node.js](https://nodejs.org/) & TypeScript
- [Gemini API / DeepSeek](https://ai.google.dev/)
- [GramJS / Telegraf](https://web.telegram.org/) (Telegram Bot API)

## 📋 Pré-requisitos
Antes de começar, você precisará de:
1. Uma conta no Telegram (e um token do [BotFather](https://t.me/botfather)).
2. Uma chave de API do [Google AI Studio](https://aistudio.google.com/).
3. Node.js instalado na sua máquina.

## 🔧 Instalação e Uso
1. Clone o repositório:
   ```bash
   git clone [https://github.com/SEU_USUARIO/NeoClaw.git](https://github.com/SEU_USUARIO/NeoClaw.git)

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Crie um arquivo .env na raiz do projeto com as seguintes variáveis:
   ```bash
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   TELEGRAM_ALLOWED_USER_IDS=123456789,987654321
   DEFAULT_LLM_PROVIDER=gemini
   GEMINI_API_KEY=your_gemini_api_key_here
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   MAX_ITERATIONS=5
   MEMORY_WINDOW_SIZE=20
   ```

4. Inicie o bot:
   ```bash
   npm run dev
   ```

## 📝 Licença
Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

### Parte 2: Executando o Passo 3 (Subindo para o GitHub)

Agora, com o `.gitignore` corrigido e o `README.md` criado, abra o terminal no seu IDE e digite os comandos abaixo, um por um:

1.  **Inicializar o Git:**
    ```bash
    git init
    ```

2.  **Adicionar os arquivos:**
    ```bash
    git add .
    ```
    *(Note que agora os arquivos de log e a pasta node_modules não serão incluídos porque o .gitignore está funcionando!)*

3.  **Criar o primeiro commit:**
    ```bash
    git commit -m "feat: initial commit with readme and gitignore"
    ```

4.  **Conectar ao GitHub:**
    (Vá na página do repositório que você criou no site do GitHub e copie a URL que termina em `.git`).
    ```bash
    git remote add origin https://github.com/SEU_USUARIO/NeoClaw.git
    ```

5.  **Enviar os arquivos:**
    ```bash
    git branch -M main
    git push -u origin main
    ```

Assim que terminar o `push`, atualize a página do seu repositório no navegador. O código e o seu novo README aparecerão lá!

**Tudo pronto para começar os comandos no terminal? Me avise se o `git push` pedir login ou der alguma mensagem de erro!**
