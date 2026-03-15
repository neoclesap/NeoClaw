import { Bot } from 'grammy';
import { env } from './config/env';
import { TelegramInputHandler } from './telegram/TelegramInputHandler';

async function bootstrap() {
    console.log('[Main] Inicializando o NeoClaw...');
    
    if (!env.TELEGRAM_BOT_TOKEN) {
        console.error('[Main] TELEGRAM_BOT_TOKEN indefinido. O bot não pode iniciar.');
        process.exit(1);
    }

    const bot = new Bot(env.TELEGRAM_BOT_TOKEN);
    const inputHandler = new TelegramInputHandler();

    // Middleware de log simples
    bot.use(async (ctx, next) => {
        console.log(`[Telegram] Evento recebido: ${ctx.update.update_id}`);
        await next();
    });

    bot.on('message:text', async (ctx) => {
        await inputHandler.handleText(ctx);
    });

    bot.on(['message:voice', 'message:audio'], async (ctx) => {
        await inputHandler.handleVoice(ctx);
    });

    bot.on('message:document', async (ctx) => {
        await inputHandler.handleDocument(ctx);
    });
    
    // Default error handler para não derrubar o Node.js
    bot.catch((err) => {
        console.error('[Main] Bot Error:', err);
    });

    // Handle graceful shutdown
    process.once('SIGINT', () => bot.stop());
    process.once('SIGTERM', () => bot.stop());

    await bot.api.setMyCommands([
        { command: 'start', description: 'Acordar o bot' }
    ]);

    bot.command('start', (ctx) => {
         if (inputHandler.isUserAllowed(ctx.from?.id)) {
             ctx.reply("Olá, eu sou o NeoClaw. Como posso ajudar?");
         }
    });

    console.log('[Main] Bot grammy escutando via Long Polling...');
    bot.start();
}

bootstrap().catch(console.error);
