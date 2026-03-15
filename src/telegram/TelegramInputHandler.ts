import { Context } from 'grammy';
import { AgentController } from '../core/AgentController';
import { env } from '../config/env';
import fs from 'fs';
import path from 'path';
import pdfParse = require('pdf-parse');
import { TelegramOutputHandler } from './TelegramOutputHandler';

export class TelegramInputHandler {
    private controller: AgentController;
    private outputHandler: TelegramOutputHandler;

    constructor() {
        this.controller = new AgentController();
        this.outputHandler = new TelegramOutputHandler();
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

        try {
            // Placeholder for Whisper STT processing
            // In a real implementation we would download the OGG file via getFile() and pass to whisper local
            const transcribedText = "[Transcription Placeholder. O usuário mandou um áudio.]";
            
            // Inject to controller requiring audio reply
            const response = await this.controller.processMessage(userId, conversationId, transcribedText, true);
            await this.outputHandler.handleOutput(ctx, response, true);

        } catch (error: any) {
            await this.outputHandler.handleError(ctx, error.message);
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

        try {
            const file = await ctx.api.getFile(document.file_id);
            const url = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
            
            const res = await fetch(url);
            const buffer = await res.arrayBuffer();

            let extractedText = '';

            if (mime === 'application/pdf') {
                const data = await (pdfParse as any)(Buffer.from(buffer));
                extractedText = data.text;
            } else if (name.endsWith('.md')) {
                extractedText = Buffer.from(buffer).toString('utf-8');
            }

            const promptText = `Abaixo está o conteúdo de um arquivo enviado pelo usuário (${name}):\n\n${extractedText}\n\nMensagem anexa: ${ctx.message?.caption || ''}`;

            const response = await this.controller.processMessage(userId, conversationId, promptText, false);
            await this.outputHandler.handleOutput(ctx, response, false);
            
        } catch (error: any) {
            console.error('[InputHandler] Document Fetch/Parse Error', error);
            await this.outputHandler.handleError(ctx, `Falha ao processar o documento: ${error.message}`);
        }
    }
}
