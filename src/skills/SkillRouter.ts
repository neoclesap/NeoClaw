import { Skill } from './SkillLoader';
import { ProviderFactory } from '../core/ProviderFactory';

export class SkillRouter {
    constructor() {}

    async route(userInput: string, availableSkills: Skill[]): Promise<Skill | null> {
        if (!availableSkills || availableSkills.length === 0) {
            return null; // No skills to route to
        }

        const provider = ProviderFactory.getProvider();

        const skillDescriptions = availableSkills.map(s => `- ${s.name}: ${s.description}`).join('\n');
        
        const systemPrompt = `Você é um classificador de intenções (Router).
Você deve avaliar a mensagem do usuário e decidir qual das habilidades (skills) disponíveis, se houver, é a mais apropriada para processar o pedido.
Se nenhuma habilidade for compatível com o pedido, retorne nulo.
Sua saída deve OBRIGATORIAMENTE ser um JSON estrito no seguinte formato:
{"skillName": "name_of_the_skill" | null}

Habilidades disponíveis:
${skillDescriptions}
`;

        try {
            const response = await provider.generateResponse(systemPrompt, [
                { role: 'user', content: userInput }
            ]);
            
            // Clean up potentially dirty markdown from LLM
            let cleanJson = response.content.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            
            if (parsed && parsed.skillName) {
                const match = availableSkills.find(s => s.name === parsed.skillName);
                if (match) return match;
            }
            
            return null;
        } catch (err) {
            console.error('[SkillRouter] Failed to parse routing JSON or call LLM', err);
            return null; // Fallback to raw logic
        }
    }
}
