import { env } from '../config/env';
import { ILLMProvider, LLMMessage, ProviderResponse } from './ILLMProvider';

// Gemini API integration (simplified placeholder for actual fetch/SDK logic)
class GeminiProvider implements ILLMProvider {
    private apiKey: string;
    
    constructor() {
        this.apiKey = env.GEMINI_API_KEY;
        if (!this.apiKey) {
            console.warn('[GeminiProvider] Warning: GEMINI_API_KEY is not set.');
        }
    }

    async generateResponse(systemPrompt: string, history: LLMMessage[], tools?: any[]): Promise<ProviderResponse> {
        // Here we'd typically use @google/genai or standard fetch.
        // For demonstration, simulating an HTTP request via native fetch
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
        
        let contents = history.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user', // mapping for gemini
            parts: [{ text: msg.content }]
        }));

        const body: any = {
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            contents
        };

        if (tools && tools.length > 0) {
            // Simplified tool mapping
            body.tools = [{
                functionDeclarations: tools
            }];
        }

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Gemini API Error: ${res.statusText} - ${err}`);
        }

        const data = await res.json();
        
        // Extract content or tool calls
        let content = '';
        let tool_calls: any[] | undefined = undefined;

        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const parts = data.candidates[0].content.parts;
            if (parts) {
                 for(const p of parts) {
                     if (p.functionCall) {
                         tool_calls = tool_calls || [];
                         tool_calls.push({
                             name: p.functionCall.name,
                             arguments: p.functionCall.args
                         });
                     } else if (p.text) {
                         content += p.text;
                     }
                 }
            }
        }

        return tool_calls ? { content, tool_calls } : { content };
    }
}

export class ProviderFactory {
    static getProvider(name: string = env.DEFAULT_LLM_PROVIDER): ILLMProvider {
        // Here we can easily add deepseek, groq...
        if (name === 'gemini') {
            return new GeminiProvider();
        }
        
        return new GeminiProvider(); // Fallback
    }
}
