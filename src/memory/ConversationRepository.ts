import { db } from './db';

export interface Conversation {
    id: string;
    user_id: string;
    provider: string;
    created_at?: string;
}

export class ConversationRepository {
    createOrGet(id: string, userId: string, provider: string): Conversation {
        const stmt = db.prepare('SELECT * FROM conversations WHERE id = ?');
        let conv = stmt.get(id) as Conversation | undefined;

        if (!conv) {
            const insert = db.prepare('INSERT INTO conversations (id, user_id, provider) VALUES (?, ?, ?)');
            insert.run(id, userId, provider);
            conv = { id, user_id: userId, provider };
        }

        return conv;
    }

    getById(id: string): Conversation | undefined {
        const stmt = db.prepare('SELECT * FROM conversations WHERE id = ?');
        return stmt.get(id) as Conversation | undefined;
    }
}
