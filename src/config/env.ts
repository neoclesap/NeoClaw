import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_ALLOWED_USER_IDS: (process.env.TELEGRAM_ALLOWED_USER_IDS || '').split(',').map(id => id.trim()).filter(id => id.length > 0),
  DEFAULT_LLM_PROVIDER: process.env.DEFAULT_LLM_PROVIDER || 'gemini',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',
  MAX_ITERATIONS: parseInt(process.env.MAX_ITERATIONS || '5', 10),
  MEMORY_WINDOW_SIZE: parseInt(process.env.MEMORY_WINDOW_SIZE || '20', 10),
};
