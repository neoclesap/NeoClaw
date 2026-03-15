import { Context } from 'grammy';
import { AgentController } from '../core/AgentController';
import { env } from '../config/env';
import fs from 'fs';
import path from 'path';
import pdfParse = require('pdf-parse');
import { TelegramOutputHandler } from './TelegramOutputHandler';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export class TelegramInputHandler {
    private controller: AgentController;
    private outputHandler: TelegramOutputHandler;
    private tmpDir: string;

    constructor() {
        this.controller = new AgentController();
        this.outputHandler = new TelegramOutputHandler();
        this.tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(this.tmpDir)) {
            fs.mkdirSync(this.tmpDir, { recursive: true });
        }
    }

    isUserAllowed(userId: number | undefined): boolean {
        if (!userId) return false;
        return env.TELEGRAM_ALLOWED_USER_IDS.includes(userId.toString());
    }

    async handleText(ctx: Context) {
        if (!this.isUserAllowed(ctx.from?.id)) return;
        
        await ctx.replyWithChatAction('typing');
        const text = ctx.message?.text || '';
        const userId = ctx.from!.id.toString();
        const conversationId = ctx.chat!.id.toString();

        try {
            const response = await this.controller.processMessage(userId, conversationId, text, false);
            await this.outputHandler.handleOutput(ctx, response, false);
        } catch (error: any) {
            await this.outputHandler.handleError(ctx, error.message);
        }
    }

    async handleVoice(ctx: Context) {
        if (!this.isUserAllowed(ctx.from?.id)) return;
        
        await ctx.replyWithChatAction('record_voice');
        const userId = ctx.from!.id.toString();
        const conversationId = ctx.chat!.id.toString();
        
        const audioObj = ctx.message?.voice || ctx.message?.audio;
        if (!audioObj) return;

        const fileId = audioObj.file_id;
        const tempExt = ctx.message?.voice ? '.ogg' : '.mp3'; // standardizes voice notes to ogg
        const filePath = path.join(this.tmpDir, `${fileId}${tempExt}`);
        const textFilePath = path.join(this.tmpDir, `${fileId}.txt`);

        try {
            const file = await ctx.api.getFile(fileId);
            const url = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
            const res = await fetch(url);
            const buffer = await res.arrayBuffer();
            
            fs.writeFileSync(filePath, Buffer.from(buffer));

            // Transcribe using Whisper local
            console.log(`[InputHandler] Transcrevendo aúdio usando whisper local: ${filePath}`);
            const { stdout, stderr } = await execAsync(`whisper "${filePath}" --model base --output_dir "${this.tmpDir}" --output_format txt`, { timeout: 60000 });
            
            if (stdout.includes('Skipping') || stderr.includes('FileNotFoundError')) {
                throw new Error("Whisper falhou silenciosamente. Verifique se o FFmpeg está instalado e no PATH do sistema.");
            }

            let transcribedText = "";
            if (fs.existsSync(textFilePath)) {
                 transcribedText = fs.readFileSync(textFilePath, 'utf-8').trim();
            }

            if (!transcribedText) {
                await ctx.reply("Áudio vazio captado. Pode reenviar?");
                return;
            }

            console.log(`[InputHandler] Transcript: ${transcribedText}`);
            
            let promptText = `[Sistema: O usuário enviou um Áudio e enviou ao bot para ser ouvido pelo bot.\nAbaixo está a transcrição fornecida pelo Whisper/bot]:\n\n"${transcribedText}"`;
            if (ctx.message?.caption) {
                promptText += `\n\n[Legenda enviada junto ao áudio: ${ctx.message.caption}]`;
            }

            // Inject to controller requiring audio reply
            const response = await this.controller.processMessage(userId, conversationId, promptText, true);
            await this.outputHandler.handleOutput(ctx, response, true);

        } catch (error: any) {
            console.error('[InputHandler] STT/Whisper Error', error);
            await ctx.reply("⚠️ Falha ao processar o áudio: arquivo grande demais ou falha no serviço.");
        } finally {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            if (fs.existsSync(textFilePath)) fs.unlinkSync(textFilePath);
        }
    }

    async handleDocument(ctx: Context) {
        if (!this.isUserAllowed(ctx.from?.id)) return;
        
        await ctx.replyWithChatAction('typing');
        const document = ctx.message?.document;
        if (!document) return;

        const mime = document.mime_type;
        const name = document.file_name || 'unknown';
        const userId = ctx.from!.id.toString();
        const conversationId = ctx.chat!.id.toString();
        
        if (mime !== 'application/pdf' && !name.endsWith('.md')) {
            await ctx.reply("⚠️ No momento, só consigo processar texto estruturado (.md), áudio e PDF.");
            return;
        }

        const filePath = path.join(this.tmpDir, `${document.file_id}_${name}`);

        try {
            const file = await ctx.api.getFile(document.file_id);
            const url = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
            
            const res = await fetch(url);
            const buffer = await res.arrayBuffer();
            
            fs.writeFileSync(filePath, Buffer.from(buffer));

            let extractedText = '';

            if (mime === 'application/pdf') {
                const data = await (pdfParse as any)(fs.readFileSync(filePath));
                extractedText = data.text;
            } else if (name.endsWith('.md')) {
                extractedText = fs.readFileSync(filePath, 'utf-8');
            }

            const promptText = `Abaixo está o conteúdo de um arquivo enviado pelo usuário (${name}):\n\n${extractedText}\n\nMensagem anexa: ${ctx.message?.caption || ''}`;

            const response = await this.controller.processMessage(userId, conversationId, promptText, false);
            await this.outputHandler.handleOutput(ctx, response, false);
            
        } catch (error: any) {
            console.error('[InputHandler] Document Fetch/Parse Error', error);
            await ctx.reply(`⚠️ Falha ao processar o documento: ${error.message}`);
        } finally {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
    }
}
