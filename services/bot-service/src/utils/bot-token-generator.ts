import * as crypto from 'crypto';

/**
 * Генерирует фейковый токен бота для разработки
 * В продакшн версии токены будут получаться через BotFather API
 */
export function generateBotToken(): string {
  const botId = Math.floor(Math.random() * 1000000000) + 1000000000; // 10-digit number
  const hash = crypto.randomBytes(35).toString('hex').substring(0, 35);
  
  return `${botId}:${hash}`;
}

/**
 * Валидация формата токена бота
 */
export function validateBotToken(token: string): boolean {
  const tokenRegex = /^\d{9,10}:[a-zA-Z0-9_-]{35}$/;
  return tokenRegex.test(token);
}

/**
 * Извлечение bot ID из токена
 */
export function extractBotIdFromToken(token: string): number | null {
  const match = token.match(/^(\d{9,10}):/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Генерирует username бота на основе названия курса
 */
export function generateBotUsername(courseName: string, courseId: string): string {
  // Убираем специальные символы и пробелы
  const cleanName = courseName
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 20);
  
  // Добавляем короткий ID для уникальности
  const shortId = courseId.substring(0, 8);
  
  return `${cleanName}_${shortId}_bot`;
}

/**
 * Проверяет доступность username бота
 */
export async function checkBotUsernameAvailability(username: string): Promise<boolean> {
  // В реальной реализации здесь будет запрос к Telegram API
  // Пока возвращаем true для разработки
  return true;
}

/**
 * Генерирует секретный ключ для webhook
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}
