import { ILLMProvider, LLMMessage } from './ILLMProvider';
import { ToolRegistry } from './ToolRegistry';
import { env } from '../config/env';

export class AgentLoop {
    private provider: ILLMProvider;
    private registry: ToolRegistry;
    private maxIterations: number;

    constructor(provider: ILLMProvider, registry: ToolRegistry) {
        this.provider = provider;
        this.registry = registry;
        this.maxIterations = env.MAX_ITERATIONS > 0 ? env.MAX_ITERATIONS : 5;
    }

    async run(systemPrompt: string, history: LLMMessage[]): Promise<string> {
        let iterations = 0;
        let currentHistory = [...history]; // Local stateful context
        const tools = this.registry.getSchemas();

        while (iterations < this.maxIterations) {
            console.log(`[AgentLoop] Iteration ${iterations + 1}/${this.maxIterations}`);
            
            try {
                const response = await this.provider.generateResponse(systemPrompt, currentHistory, tools);

                // Add assistant's response to history
                currentHistory.push({
                    role: 'assistant',
                    content: response.content || '',
                    ...(response.tool_calls ? { tool_calls: response.tool_calls } : {})
                });

                // If no tool calls, this is the final final response string
                if (!response.tool_calls || response.tool_calls.length === 0) {
                    console.log(`[AgentLoop] Finished with final response.`);
                    return response.content;
                }

                // Execute tools (Sequential resolution as per Spec 4. NG-02)
                for (const toolCall of response.tool_calls) {
                    const toolName = toolCall.name;
                    const toolArgs = toolCall.arguments;
                    console.log(`[AgentLoop] Executing Tool: ${toolName}`);

                    const tool = this.registry.getTool(toolName);
                    let observation = '';

                    if (!tool) {
                        observation = `Error: Tool ${toolName} not found.`;
                    } else {
                        try {
                            const result = await tool.execute(toolArgs);
                            observation = typeof result === 'string' ? result : JSON.stringify(result);
                        } catch (err: any) {
                            // EC-02: Tool returns Throw
                            observation = `{"error": "${err.message}"}`;
                            console.error(`[AgentLoop] Tool Exception: ${err.message}`);
                        }
                    }

                    // Append Observation
                    currentHistory.push({
                        role: 'tool', // Treated as user or tool observation depending on provider mapping
                        content: observation
                    });
                }
            } catch (error: any) {
                console.error('[AgentLoop] LLM Provider Error:', error);
                return `Desculpe, falhei no processamento devido a erro de IA: ${error.message}`;
            }

            iterations++;
        }

        // EC-03 Max Iterations Reached
        const finalMsg = "Desculpe, desisti ou deu timeout no processamento pois falhei nas chamadas em MAX iteracoes.";
        console.warn(`[AgentLoop] Loop break forced. ${finalMsg}`);
        return finalMsg;
    }
}
