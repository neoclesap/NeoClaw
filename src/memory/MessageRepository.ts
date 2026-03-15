import { db } from './db';

export interface Message {
    id?: number;
    conversation_id: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    created_at?: string;
}

export class MessageRepository {
    addMessage(conversationId: string, role: string, content: string): void {
        const stmt = db.prepare('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)');
        const strippedContent = content.replace(/\u0000/g, ''); // Fix EC-02: Null Bytes
        stmt.run(conversationId, role, strippedContent);
    }

    getMessagesByConversationId(conversationId: string, limit: number): Message[] {
        // We get the latest messages up to 'limit' and reverse them to maintain chronological order
        const stmt = db.prepare(`
            SELECT * FROM messages 
            WHERE conversation_id = ? 
            ORDER BY created_at DESC, id DESC 
            LIMIT ?
        `);
        const rows = stmt.all(conversationId, limit) as Message[];
        return rows.reverse();
    }
}
