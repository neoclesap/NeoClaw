import { Skill } from './SkillLoader';
import { AgentLoop } from '../core/AgentLoop';
import { LLMMessage } from '../core/ILLMProvider';

export class SkillExecutor {
    private agentLoop: AgentLoop;

    constructor(agentLoop: AgentLoop) {
        this.agentLoop = agentLoop;
    }

    async execute(skill: Skill, userPrompt: string, history: LLMMessage[]): Promise<string> {
        console.log(`[SkillExecutor] Executing skill: ${skill.name}`);
        
        // Push user message to local history copy
        const sessionHistory = [...history, { role: 'user' as const, content: userPrompt }];

        // The skill content is injected purely as the system prompt
        // which guides the agent loop specific to this skill.
        return this.agentLoop.run(skill.content, sessionHistory);
    }
}
