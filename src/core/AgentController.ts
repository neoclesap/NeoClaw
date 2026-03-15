import { MemoryManager } from '../memory/MemoryManager';
import { SkillLoader, Skill } from '../skills/SkillLoader';
import { SkillRouter } from '../skills/SkillRouter';
import { SkillExecutor } from '../skills/SkillExecutor';
import { AgentLoop } from '../core/AgentLoop';
import { ProviderFactory } from '../core/ProviderFactory';
import { ToolRegistry } from '../core/ToolRegistry';
import { LLMMessage } from '../core/ILLMProvider';

export class AgentController {
    private memoryManager: MemoryManager;
    private skillLoader: SkillLoader;
    private skillRouter: SkillRouter;
    private skillExecutor: SkillExecutor;
    private defaultAgentLoop: AgentLoop;
    private availableSkills: Skill[] = [];

    constructor() {
        this.memoryManager = new MemoryManager();
        
        this.skillLoader = new SkillLoader();
        this.skillRouter = new SkillRouter();
        
        const provider = ProviderFactory.getProvider();
        const registry = new ToolRegistry();
        
        this.defaultAgentLoop = new AgentLoop(provider, registry);
        this.skillExecutor = new SkillExecutor(this.defaultAgentLoop);
    }

    async processMessage(userId: string, conversationId: string, text: string, requiresAudio: boolean = false): Promise<string> {
        // Hot-reload skills on every request
        this.availableSkills = this.skillLoader.loadSkills();
        console.log(`[AgentController] Loaded ${this.availableSkills.length} skills from FS.`);

        // Fetch History
        const dbHistory = await this.memoryManager.getConversationHistory(conversationId, userId);
        const history: LLMMessage[] = dbHistory.map(msg => ({
             role: msg.role as 'user' | 'assistant' | 'system' | 'tool',
             content: msg.content
        }));

        // Log user message to memory
        await this.memoryManager.addMessage(conversationId, 'user', text);

        let finalResponse = '';

        // Router (Step 0)
        const matchedSkill = await this.skillRouter.route(text, this.availableSkills);

        if (matchedSkill) {
            finalResponse = await this.skillExecutor.execute(matchedSkill, text, history);
        } else {
            console.log(`[AgentController] No skill route matched. Using default conversational loop.`);
            const defaultPrompt = "Você é o NeoClaw, um agente de inteligência artificial assistente amigável programado para ser útil, conciso e eficaz. Você não possui limitações para entender áudios, PDFs ou arquivos locais, pois o sistema ao seu redor fará a transcrição/leitura e entregará o conteúdo injetado para você em formato de texto. Portanto, JAMAIS diga ao usuário que não pode ler arquivos ou ouvir áudios. Trate todo [Conteúdo Transcrito] com naturalidade." + (requiresAudio ? " O usuário pediu uma resposta em áudio, seja muito conciso para que a voz fique natural e não muito demorada." : "");
            
            const currentHistory = [...history, { role: 'user' as const, content: text }];
            
            finalResponse = await this.defaultAgentLoop.run(defaultPrompt, currentHistory);
        }

        // Save AI response to DB
        await this.memoryManager.addMessage(conversationId, 'assistant', finalResponse);

        return finalResponse;
    }
}
