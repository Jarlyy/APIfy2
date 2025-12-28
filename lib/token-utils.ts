interface TokenPlaceholder {
  placeholder: string;
  description: string;
  type: 'token' | 'id' | 'key' | 'url';
  example?: string;
}

// Паттерны для поиска плейсхолдеров
const TOKEN_PATTERNS = [
  // Основные форматы плейсхолдеров
  { pattern: /YOUR_TOKEN/g, type: 'token', description: 'API токен для аутентификации' },
  { pattern: /YOUR_API_TOKEN/g, type: 'token', description: 'API токен для доступа к сервису' },
  { pattern: /YOUR_ACCESS_TOKEN/g, type: 'token', description: 'Токен доступа' },
  { pattern: /YOUR_AUTH_TOKEN/g, type: 'token', description: 'Токен аутентификации' },
  { pattern: /YOUR_BEARER_TOKEN/g, type: 'token', description: 'Bearer токен' },
  
  // Специфичные токены
  { pattern: /YOUR_BOT_TOKEN/g, type: 'token', description: 'Токен Telegram бота от @BotFather', example: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11' },
  { pattern: /YOUR_GITHUB_TOKEN/g, type: 'token', description: 'Personal Access Token от GitHub', example: 'ghp_xxxxxxxxxxxxxxxxxxxx' },
  { pattern: /YOUR_OPENAI_KEY/g, type: 'key', description: 'API ключ OpenAI', example: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx' },
  { pattern: /YOUR_WEATHER_KEY/g, type: 'key', description: 'API ключ OpenWeatherMap', example: 'abcd1234567890abcd1234567890abcd' },
  
  // API ключи
  { pattern: /YOUR_API_KEY/g, type: 'key', description: 'API ключ для доступа к сервису' },
  { pattern: /YOUR_KEY/g, type: 'key', description: 'Ключ API' },
  { pattern: /API_KEY_HERE/g, type: 'key', description: 'Вставьте ваш API ключ' },
  
  // ID и пользовательские данные
  { pattern: /YOUR_CHAT_ID/g, type: 'id', description: 'ID чата в Telegram', example: '123456789' },
  { pattern: /YOUR_USER_ID/g, type: 'id', description: 'ID пользователя' },
  { pattern: /YOUR_USERNAME/g, type: 'id', description: 'Имя пользователя', example: 'john_doe' },
  { pattern: /YOUR_REPO/g, type: 'id', description: 'Название репозитория', example: 'my-project' },
  { pattern: /YOUR_CHANNEL_ID/g, type: 'id', description: 'ID канала' },
  { pattern: /YOUR_ID/g, type: 'id', description: 'Ваш ID' },
  
  // URL и домены
  { pattern: /YOUR_DOMAIN/g, type: 'url', description: 'Ваш домен', example: 'example.com' },
  { pattern: /YOUR_URL/g, type: 'url', description: 'Ваш URL', example: 'https://example.com' },
  { pattern: /YOUR_WEBHOOK_URL/g, type: 'url', description: 'URL вашего webhook', example: 'https://example.com/webhook' },

  // Альтернативные форматы (которые иногда генерирует AI)
  { pattern: /\{token\}/g, type: 'token', description: 'API токен' },
  { pattern: /\{api_key\}/g, type: 'key', description: 'API ключ' },
  { pattern: /\{username\}/g, type: 'id', description: 'Имя пользователя', example: 'john_doe' },
  { pattern: /\{user_id\}/g, type: 'id', description: 'ID пользователя' },
  { pattern: /\{chat_id\}/g, type: 'id', description: 'ID чата' },
  
  // Простые форматы (осторожно - могут давать ложные срабатывания)
  { pattern: /\buser\b/g, type: 'id', description: 'Имя пользователя', example: 'john_doe' },
  { pattern: /\busername\b/g, type: 'id', description: 'Имя пользователя', example: 'john_doe' },
  { pattern: /\brepo\b/g, type: 'id', description: 'Название репозитория', example: 'my-project' },
  { pattern: /\brepos\b/g, type: 'id', description: 'Название репозитория', example: 'my-project' },
  { pattern: /\bowner\b/g, type: 'id', description: 'Владелец репозитория', example: 'john_doe' },
  { pattern: /\btoken\b/g, type: 'token', description: 'Токен доступа' },
  { pattern: /\bapi_key\b/g, type: 'key', description: 'API ключ' },
  { pattern: /\bchat_id\b/g, type: 'id', description: 'ID чата', example: '123456789' },
  { pattern: /\buser_id\b/g, type: 'id', description: 'ID пользователя', example: '123456' },
  
  // Форматы в угловых скобках
  { pattern: /<token>/g, type: 'token', description: 'API токен' },
  { pattern: /<api_key>/g, type: 'key', description: 'API ключ' },
  { pattern: /<username>/g, type: 'id', description: 'Имя пользователя', example: 'john_doe' },
  { pattern: /<user_id>/g, type: 'id', description: 'ID пользователя' },
  { pattern: /<chat_id>/g, type: 'id', description: 'ID чата' },
];

/**
 * Находит все плейсхолдеры токенов в тексте
 */
export function findTokenPlaceholders(text: string): TokenPlaceholder[] {
  const found = new Set<string>();
  const placeholders: TokenPlaceholder[] = [];

  console.log('🔍 Поиск плейсхолдеров в тексте:', text);

  TOKEN_PATTERNS.forEach(({ pattern, type, description, example }) => {
    const matches = text.match(pattern);
    if (matches) {
      console.log(`✅ Найдены совпадения для паттерна ${pattern}:`, matches);
      matches.forEach(match => {
        const normalized = match.toUpperCase();
        
        // Исключаем ложные срабатывания для простых слов
        if (isValidPlaceholder(match, text)) {
          if (!found.has(normalized)) {
            found.add(normalized);
            placeholders.push({
              placeholder: normalized,
              description,
              type: type as 'token' | 'id' | 'key' | 'url',
              example
            });
          }
        } else {
          console.log(`❌ Исключен как ложное срабатывание: ${match}`);
        }
      });
    } else {
      console.log(`❌ Нет совпадений для паттерна ${pattern}`);
    }
  });

  console.log('📋 Итоговые плейсхолдеры:', placeholders);
  return placeholders;
}

/**
 * Проверяет, является ли найденное совпадение действительным плейсхолдером
 */
function isValidPlaceholder(match: string, fullText: string): boolean {
  const lowerMatch = match.toLowerCase();
  
  // Всегда включаем YOUR_* паттерны
  if (match.startsWith('YOUR_') || match.startsWith('{') || match.startsWith('<')) {
    return true;
  }
  
  // Для простых слов проверяем контекст
  if (lowerMatch === 'user' || lowerMatch === 'username') {
    // Исключаем если это часть URL с реальными пользователями
    if (fullText.includes('/users/user') || fullText.includes('github.com/user')) {
      return false;
    }
    // Включаем если это в пути URL без домена
    if (fullText.includes('/user/') || fullText.includes('/user"') || fullText.includes('user/repos')) {
      return true;
    }
  }
  
  if (lowerMatch === 'repo' || lowerMatch === 'repos') {
    // Включаем если это в пути URL
    if (fullText.includes('/repos/') || fullText.includes('/repo/') || fullText.includes('user/repos')) {
      return true;
    }
  }
  
  if (lowerMatch === 'token') {
    // Включаем если это в auth_token поле или в URL
    if (fullText.includes('"auth_token": "token"') || fullText.includes('/token/')) {
      return true;
    }
  }
  
  // По умолчанию исключаем простые слова
  return false;
}

/**
 * Заменяет плейсхолдеры в тексте на реальные значения
 */
export function replacePlaceholders(text: string, tokens: Record<string, string>): string {
  let result = text;
  
  Object.entries(tokens).forEach(([placeholder, value]) => {
    if (value.trim()) {
      // Создаем регулярное выражение для поиска плейсхолдера (case-insensitive)
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      result = result.replace(regex, value);
    }
  });
  
  return result;
}

/**
 * Проверяет, содержит ли тест плейсхолдеры токенов
 */
export function hasTokenPlaceholders(test: any): boolean {
  const textToCheck = [
    test.url || '',
    test.auth_token || '',
    test.body || '',
    JSON.stringify(test.headers || {}),
  ].join(' ');
  
  const placeholders = findTokenPlaceholders(textToCheck);
  
  // Отладочная информация
  console.log('🧪 Проверка плейсхолдеров для теста:', test.name);
  console.log('📝 Текст для проверки:', textToCheck);
  console.log('🔍 Найденные плейсхолдеры:', placeholders);
  console.log('✅ Есть плейсхолдеры:', placeholders.length > 0);
  
  return placeholders.length > 0;
}

/**
 * Применяет токены к тесту, заменяя плейсхолдеры
 */
export function applyTokensToTest(test: any, tokens: Record<string, string>): any {
  const updatedTest = { ...test };
  
  // Заменяем плейсхолдеры в URL
  if (updatedTest.url) {
    updatedTest.url = replacePlaceholders(updatedTest.url, tokens);
  }
  
  // Заменяем плейсхолдеры в токене аутентификации
  if (updatedTest.auth_token) {
    updatedTest.auth_token = replacePlaceholders(updatedTest.auth_token, tokens);
  }
  
  // Заменяем плейсхолдеры в теле запроса
  if (updatedTest.body) {
    updatedTest.body = replacePlaceholders(updatedTest.body, tokens);
  }
  
  // Заменяем плейсхолдеры в заголовках
  if (updatedTest.headers) {
    const updatedHeaders: Record<string, string> = {};
    Object.entries(updatedTest.headers).forEach(([key, value]) => {
      const newKey = replacePlaceholders(key, tokens);
      const newValue = replacePlaceholders(String(value), tokens);
      updatedHeaders[newKey] = newValue;
    });
    updatedTest.headers = updatedHeaders;
  }
  
  return updatedTest;
}

/**
 * Получает инструкции по получению токенов для популярных сервисов
 */
export function getTokenInstructions(serviceName: string): Record<string, string> {
  const service = serviceName.toLowerCase();
  
  if (service.includes('telegram') || service.includes('bot')) {
    return {
      'YOUR_BOT_TOKEN': 'Получите токен у @BotFather в Telegram: /newbot -> следуйте инструкциям',
      'YOUR_CHAT_ID': 'Напишите боту @userinfobot в Telegram, чтобы узнать ваш Chat ID'
    };
  }
  
  if (service.includes('github')) {
    return {
      'YOUR_GITHUB_TOKEN': 'GitHub Settings -> Developer settings -> Personal access tokens -> Generate new token',
      'YOUR_TOKEN': 'GitHub Settings -> Developer settings -> Personal access tokens -> Generate new token'
    };
  }
  
  if (service.includes('openai') || service.includes('gpt')) {
    return {
      'YOUR_OPENAI_KEY': 'Получите API ключ на https://platform.openai.com/api-keys',
      'YOUR_API_KEY': 'Получите API ключ на https://platform.openai.com/api-keys'
    };
  }
  
  if (service.includes('weather')) {
    return {
      'YOUR_WEATHER_KEY': 'Зарегистрируйтесь на https://openweathermap.org/api и получите бесплатный API ключ',
      'YOUR_API_KEY': 'Зарегистрируйтесь на https://openweathermap.org/api и получите бесплатный API ключ'
    };
  }
  
  // Общие инструкции
  return {
    'YOUR_TOKEN': 'Получите токен в настройках API вашего сервиса',
    'YOUR_API_KEY': 'Получите API ключ в панели разработчика сервиса',
    'YOUR_API_TOKEN': 'Получите API токен в настройках аккаунта',
    'YOUR_ACCESS_TOKEN': 'Получите токен доступа через OAuth или в настройках API'
  };
}