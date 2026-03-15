import { ConversationRepository, Conversation } from './ConversationRepository';
import { MessageRepository, Message } from './MessageRepository';
import { env } from '../config/env';

export class MemoryManager {
    private conversationRepo: ConversationRepository;
    private messageRepo: MessageRepository;

    constructor() {
        this.conversationRepo = new ConversationRepository();
        this.messageRepo = new MessageRepository();
    }

    async getConversationHistory(conversationId: string, userId: string): Promise<Message[]> {
        // Ensure conversation exists using the default provider for now
        this.conversationRepo.createOrGet(conversationId, userId, env.DEFAULT_LLM_PROVIDER);
        
        return this.messageRepo.getMessagesByConversationId(conversationId, env.MEMORY_WINDOW_SIZE);
    }

    async addMessage(conversationId: string, role: 'user' | 'assistant' | 'system' | 'tool', content: string): Promise<void> {
        this.messageRepo.addMessage(conversationId, role, content);
    }
}
