export interface BaseTool {
    name: string;
    description: string;
    parameters: any; // JSON schema for parameters
    execute(args: any): Promise<any>;
}

export class ToolRegistry {
    private tools: Map<string, BaseTool> = new Map();

    register(tool: BaseTool) {
        this.tools.set(tool.name, tool);
    }

    getTool(name: string): BaseTool | undefined {
        return this.tools.get(name);
    }

    getAllTools(): BaseTool[] {
        return Array.from(this.tools.values());
    }

    getSchemas(): any[] {
        return this.getAllTools().map(t => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters
        }));
    }
}
