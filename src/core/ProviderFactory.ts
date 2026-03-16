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
        console.log('[GeminiProvider] ♊ Processing with Gemini...');
        
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

class OpenAIProvider implements ILLMProvider {
    private apiKey: string;
    
    constructor() {
        this.apiKey = env.OPENAI_API_KEY;
        if (!this.apiKey) {
            console.warn('[OpenAIProvider] Warning: OPENAI_API_KEY is not set.');
        }
    }

    async generateResponse(systemPrompt: string, history: LLMMessage[], tools?: any[]): Promise<ProviderResponse> {
        const url = 'https://api.openai.com/v1/chat/completions';
        console.log('[OpenAIProvider] 🤖 Processing with GPT-4o-Mini...');
        
        const messages = [
            { role: 'system', content: systemPrompt },
            ...history.map(msg => ({
                role: msg.role === 'tool' ? 'tool' : msg.role,
                content: msg.content,
                tool_calls: msg.tool_calls
            }))
        ];

        const body: any = {
            model: 'gpt-4o-mini',
            messages,
        };

        if (tools && tools.length > 0) {
            body.tools = tools.map((t: any) => ({
                type: 'function',
                function: t
            }));
        }

        const res = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`OpenAI API Error: ${res.statusText} - ${err}`);
        }

        const data = await res.json();
        const choice = data.choices[0];
        const message = choice.message;

        let tool_calls: any[] | undefined = undefined;
        if (message.tool_calls) {
            tool_calls = message.tool_calls.map((tc: any) => ({
                name: tc.function.name,
                arguments: JSON.parse(tc.function.arguments)
            }));
        }

        const content = message.content || '';
        return tool_calls ? { content, tool_calls } : { content };
    }
}

export class ProviderFactory {
    static getProvider(name: string = env.DEFAULT_LLM_PROVIDER): ILLMProvider {
        console.log(`[ProviderFactory] Initializing provider: ${name.toUpperCase()}`);
        if (name === 'gemini') {
            return new GeminiProvider();
        }
        
        if (name === 'openai') {
            return new OpenAIProvider();
        }
        
        return new GeminiProvider(); // Fallback
    }
}


