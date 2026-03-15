import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export interface Skill {
    id: string; // Folder name
    name: string;
    description: string;
    content: string; // The full markdown content for the prompt
}

export class SkillLoader {
    private skillsPath: string;

    constructor() {
        this.skillsPath = path.resolve(process.cwd(), '.agents', 'skills');
        if (!fs.existsSync(this.skillsPath)) {
            fs.mkdirSync(this.skillsPath, { recursive: true });
        }
    }

    loadSkills(): Skill[] {
        const skills: Skill[] = [];
        try {
            const items = fs.readdirSync(this.skillsPath, { withFileTypes: true });
            
            for (const item of items) {
                if (item.isDirectory()) {
                    const skillId = item.name;
                    const skillFilePath = path.join(this.skillsPath, skillId, 'SKILL.md');
                    
                    if (fs.existsSync(skillFilePath)) {
                        try {
                            const fileContent = fs.readFileSync(skillFilePath, 'utf-8');
                            const parsed = this.parseFrontmatter(fileContent);
                            if (parsed) {
                                // EC-01 First Match First / Overwrite behavior will be a map conceptually
                                // but we return a list here. 
                                skills.push({
                                    id: skillId,
                                    name: parsed.metadata.name || skillId,
                                    description: parsed.metadata.description || 'No description provided.',
                                    content: parsed.content
                                });
                            }
                        } catch (err) {
                            console.warn(`[SkillLoader] Failed to parse SKILL.md for skill ${skillId}`);
                        }
                    }
                }
            }
        } catch (e) {
            console.error('[SkillLoader] Error reading skills directory', e);
        }
        
        // Handle deduplication (first match)
        const uniqueSkills: Record<string, Skill> = {};
        for(const skill of skills) {
             uniqueSkills[skill.name] = skill; // overwrite keeps the latest parsed one per EC-01 req
        }
        
        return Object.values(uniqueSkills);
    }

    private parseFrontmatter(fileContent: string): { metadata: any, content: string } | null {
        const match = fileContent.match(/^-{3}\n([\s\S]*?)\n-{3}\n([\s\S]*)$/);
        if (!match) {
            return null; // EC-03: Structural Failure
        }
        try {
            const metadata = yaml.load(match[1]!) as Record<string, any>;
            return {
                metadata,
                content: match[2]!.trim()
            };
        } catch (e) {
            return null;
        }
    }
}
