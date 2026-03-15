import { Context, InputFile } from 'grammy';
import * as edgeTTS from 'edge-tts-universal';
import fs from 'fs';
import path from 'path';

export class TelegramOutputHandler {
    
    constructor() {}

    async handleOutput(ctx: Context, responseText: string, requiresAudio: boolean) {
        if (requiresAudio) {
            await this.handleAudioOutput(ctx, responseText);
            return;
        }

        // Feature G-03: Chunking large responses instead of throwing Bad Request
        const isMarkdownPayload = responseText.includes('```markdown') && responseText.includes('# ');
        
        if (isMarkdownPayload) {
            await this.handleFileOutput(ctx, responseText);
        } else {
            await this.handleTextChunking(ctx, responseText);
        }
    }

    private async handleTextChunking(ctx: Context, text: string) {
        const MAX_LEN = 4000;
        let remainingText = text;

        if (remainingText.length <= MAX_LEN) {
            await ctx.reply(remainingText);
            return;
        }

        while (remainingText.length > 0) {
            let chunk = remainingText.substring(0, MAX_LEN);
            // Quick heuristic to avoid cutting middle of words if possible
            if (remainingText.length > MAX_LEN) {
                const lastSpace = chunk.lastIndexOf(' ');
                if (lastSpace > 0) {
                    chunk = remainingText.substring(0, lastSpace);
                    remainingText = remainingText.substring(lastSpace + 1);
                } else {
                    remainingText = remainingText.substring(MAX_LEN);
                }
            } else {
                remainingText = '';
            }
            
            await ctx.reply(chunk);
            // Sleep to avoid 429 Too Many Requests
            await new Promise(r => setTimeout(r, 500));
        }
    }

    private async handleFileOutput(ctx: Context, text: string) {
        const tmpDir = path.resolve(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

        const filename = `Document_${Date.now()}.md`;
        const filepath = path.join(tmpDir, filename);

        // Standard cleanup of markdown wrapper
        let cleanText = text.replace(/```markdown\n/g, '').replace(/```\n*$/g, '');

        try {
            fs.writeFileSync(filepath, cleanText, 'utf-8');
            await ctx.replyWithDocument(new InputFile(filepath));
        } catch (err: any) {
            console.error('[OutputHandler] File write error', err);
            await this.handleError(ctx, "Não consegui gerar o arquivo, segue texto puro...");
            await this.handleTextChunking(ctx, cleanText);
        } finally {
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
        }
    }

    private async handleAudioOutput(ctx: Context, text: string) {
        const tmpDir = path.resolve(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

        const filepath = path.join(tmpDir, `Audio_${Date.now()}.ogg`);

        try {
            // Cleanup markdown formatting visually so the bot doesn't speak "hash hash hash"
            const plainText = text.replace(/[#*`_~]/g, '');

            const tts = new edgeTTS.EdgeTTS(plainText, 'pt-BR-ThalitaNeural');
            const result = await tts.synthesize();
            const audioBuffer = Buffer.from(await result.audio.arrayBuffer());
            fs.writeFileSync(filepath, audioBuffer);

            await ctx.replyWithVoice(new InputFile(filepath));
        } catch (e: any) {
            console.error('[OutputHandler] TTS Fallback Error', e);
            await this.handleError(ctx, "Ops, falha ao gerar o áudio. Respondendo em texto:");
            await this.handleTextChunking(ctx, text);
        } finally {
             if (fs.existsSync(filepath)) {
                 fs.unlinkSync(filepath);
             }
        }
    }

    async handleError(ctx: Context, errorMsg: string) {
        await ctx.reply(`⚠️ Erro: ${errorMsg}`);
    }
}
