export interface LLMMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    tool_calls?: any[]; // For now generic
}

export interface ProviderResponse {
    content: string;
    tool_calls?: any[];
}

export interface ILLMProvider {
    generateResponse(systemPrompt: string, history: LLMMessage[], tools?: any[]): Promise<ProviderResponse>;
}
