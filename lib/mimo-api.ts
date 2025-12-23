interface MimoMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface MimoRequest {
  model: string;
  messages: MimoMessage[];
  max_completion_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  frequency_penalty?: number;
  presence_penalty?: number;
}

interface MimoResponse {
  id: string;
  choices: Array<{
    finish_reason: string;
    index: number;
    message: {
      content: string;
      role: string;
      tool_calls: null;
      reasoning_content: null;
    };
  }>;
  created: number;
  model: string;
  object: string;
  usage: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
    completion_tokens_details: {
      reasoning_tokens: number;
    };
  };
}

export class MimoAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.MIMO_API_KEY || '';
    this.baseUrl = process.env.MIMO_API_URL || 'https://api.xiaomimimo.com/v1/chat/completions';
    
    console.log('MimoAPI инициализация:', {
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey.length,
      baseUrl: this.baseUrl
    });
    
    if (!this.apiKey) {
      throw new Error('MIMO_API_KEY не найден в переменных окружения');
    }
  }

  async chat(messages: MimoMessage[], options?: Partial<MimoRequest>): Promise<string> {
    const request: MimoRequest = {
      model: 'mimo-v2-flash',
      messages,
      max_completion_tokens: options?.max_completion_tokens || 1000,
      temperature: options?.temperature || 0.3,
      top_p: options?.top_p || 0.95,
      stream: false,
      frequency_penalty: options?.frequency_penalty || 0,
      presence_penalty: options?.presence_penalty || 0,
      ...options
    };

    try {
      console.log('Отправляю запрос к Mimo API:', {
        url: this.baseUrl,
        model: request.model,
        messagesCount: request.messages.length
      });

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      console.log('Ответ от Mimo API:', {
        status: response.status,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ошибка Mimo API:', errorText);
        
        // Если превышен лимит запросов, возвращаем демо-ответ
        if (response.status === 429) {
          return this.getDemoResponse(messages);
        }
        
        throw new Error(`Mimo API ошибка: ${response.status} - ${errorText}`);
      }

      const data: MimoResponse = await response.json();
      console.log('Данные от Mimo API:', {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length || 0,
        contentLength: data.choices?.[0]?.message?.content?.length || 0
      });
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('Пустой ответ от Mimo API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('Ошибка Mimo API:', error);
      
      // Если ошибка связана с лимитами, возвращаем демо-ответ
      if (error instanceof Error && error.message.includes('429')) {
        return this.getDemoResponse(messages);
      }
      
      throw error;
    }
  }

  // Демо-ответы когда превышен лимит API
  private getDemoResponse(messages: MimoMessage[]): string {
    const userMessage = messages[messages.length - 1]?.content || '';
    const isTestGeneration = userMessage.includes('готовых тестов') || userMessage.includes('формате JSON');
    
    if (userMessage.toLowerCase().includes('github')) {
      if (isTestGeneration) {
        return `# Готовые тесты для GitHub API

\`\`\`json
[
  {
    "name": "Получить информацию о пользователе",
    "description": "Тестирует получение публичной информации о пользователе GitHub",
    "method": "GET",
    "url": "https://api.github.com/users/octocat",
    "headers": {
      "Accept": "application/vnd.github+json",
      "User-Agent": "APIfy-Tester"
    },
    "body": "",
    "auth_type": "none",
    "auth_details": "Публичный эндпоинт, аутентификация не требуется"
  },
  {
    "name": "Получить информацию о репозитории",
    "description": "Тестирует получение информации о публичном репозитории",
    "method": "GET",
    "url": "https://api.github.com/repos/microsoft/vscode",
    "headers": {
      "Accept": "application/vnd.github+json",
      "User-Agent": "APIfy-Tester"
    },
    "body": "",
    "auth_type": "none",
    "auth_details": "Публичный репозиторий, аутентификация не требуется"
  },
  {
    "name": "Поиск репозиториев",
    "description": "Тестирует поиск репозиториев по ключевому слову",
    "method": "GET",
    "url": "https://api.github.com/search/repositories?q=javascript&sort=stars&order=desc&per_page=5",
    "headers": {
      "Accept": "application/vnd.github+json",
      "User-Agent": "APIfy-Tester"
    },
    "body": "",
    "auth_type": "none",
    "auth_details": "Публичный поиск, аутентификация не требуется"
  },
  {
    "name": "Получить информацию о текущем пользователе",
    "description": "Тестирует получение информации об аутентифицированном пользователе",
    "method": "GET",
    "url": "https://api.github.com/user",
    "headers": {
      "Accept": "application/vnd.github+json",
      "Authorization": "Bearer YOUR_GITHUB_TOKEN",
      "User-Agent": "APIfy-Tester"
    },
    "body": "",
    "auth_type": "bearer",
    "auth_details": "Требуется Personal Access Token. Создайте в Settings -> Developer settings -> Personal access tokens"
  },
  {
    "name": "Создать новый репозиторий",
    "description": "Тестирует создание нового приватного репозитория",
    "method": "POST",
    "url": "https://api.github.com/user/repos",
    "headers": {
      "Accept": "application/vnd.github+json",
      "Authorization": "Bearer YOUR_GITHUB_TOKEN",
      "Content-Type": "application/json",
      "User-Agent": "APIfy-Tester"
    },
    "body": "{\\"name\\": \\"test-repo-from-apify\\", \\"description\\": \\"Тестовый репозиторий созданный через APIfy\\", \\"private\\": true}",
    "auth_type": "bearer",
    "auth_details": "Требуется Personal Access Token с правами 'repo'. ВНИМАНИЕ: Этот тест создаст реальный репозиторий!"
  }
]
\`\`\`

**Инструкции по использованию:**
1. Скопируйте нужный тест
2. Для тестов с аутентификацией замените YOUR_GITHUB_TOKEN на ваш токен
3. Вставьте данные в форму тестирования
4. Запустите тест

*Примечание: Это демо-ответ, так как превышен лимит запросов к AI API.*`;
      }
      
      return `# GitHub API

**Официальная документация:** https://docs.github.com/en/rest

**Базовый URL:** https://api.github.com

**Аутентификация:** Personal Access Token или GitHub App

## Основные эндпоинты:

1. **Получение информации о пользователе:**
   - GET /user
   - Заголовок: Authorization: token YOUR_TOKEN

2. **Список репозиториев пользователя:**
   - GET /user/repos
   - GET /users/{username}/repos

3. **Информация о репозитории:**
   - GET /repos/{owner}/{repo}

4. **Создание репозитория:**
   - POST /user/repos
   - Body: {"name": "repo-name", "private": false}

5. **Issues:**
   - GET /repos/{owner}/{repo}/issues
   - POST /repos/{owner}/{repo}/issues

## Пример запроса:
\`\`\`bash
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
\`\`\`

*Примечание: Это демо-ответ, так как превышен лимит запросов к AI API.*`;
    }
    
    if (userMessage.toLowerCase().includes('telegram')) {
      if (isTestGeneration) {
        return `# Готовые тесты для Telegram Bot API

\`\`\`json
[
  {
    "name": "Получить информацию о боте",
    "description": "Тестирует метод getMe для получения информации о боте",
    "method": "GET",
    "url": "https://api.telegram.org/botYOUR_BOT_TOKEN/getMe",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": "",
    "auth_type": "none",
    "auth_details": "Токен передается в URL. Получите токен у @BotFather в Telegram"
  },
  {
    "name": "Отправить сообщение",
    "description": "Тестирует отправку текстового сообщения в чат",
    "method": "POST",
    "url": "https://api.telegram.org/botYOUR_BOT_TOKEN/sendMessage",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": "{\\"chat_id\\": \\"YOUR_CHAT_ID\\", \\"text\\": \\"Привет! Это тестовое сообщение от APIfy\\"}",
    "auth_type": "none",
    "auth_details": "Замените YOUR_BOT_TOKEN на токен бота и YOUR_CHAT_ID на ID чата"
  },
  {
    "name": "Получить обновления",
    "description": "Тестирует получение новых сообщений через long polling",
    "method": "GET",
    "url": "https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates?limit=10&timeout=30",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": "",
    "auth_type": "none",
    "auth_details": "Получает последние 10 обновлений с таймаутом 30 секунд"
  }
]
\`\`\`

**Как получить данные для тестов:**
1. **Bot Token:** Напишите @BotFather в Telegram, создайте бота командой /newbot
2. **Chat ID:** Напишите боту, затем откройте https://api.telegram.org/botYOUR_TOKEN/getUpdates

*Примечание: Это демо-ответ, так как превышен лимит запросов к AI API.*`;
      }
      
      return `# Telegram Bot API

**Официальная документация:** https://core.telegram.org/bots/api

**Базовый URL:** https://api.telegram.org/bot{token}/

**Аутентификация:** Bot Token от @BotFather

## Основные методы:

1. **getMe** - информация о боте
2. **sendMessage** - отправка сообщения
3. **getUpdates** - получение обновлений
4. **setWebhook** - установка webhook

## Пример:
\`\`\`bash
curl https://api.telegram.org/bot{TOKEN}/sendMessage \\
  -d chat_id=123456 \\
  -d text="Привет!"
\`\`\`

*Примечание: Это демо-ответ, так как превышен лимит запросов к AI API.*`;
    }
    
    if (isTestGeneration) {
      return `# Готовые тесты для "${userMessage.split('"')[1] || 'API'}"

К сожалению, превышен лимит запросов к AI API. 

## Общий шаблон для создания тестов:

\`\`\`json
[
  {
    "name": "Базовый тест API",
    "description": "Проверка доступности API",
    "method": "GET",
    "url": "https://api.example.com/v1/status",
    "headers": {
      "Content-Type": "application/json",
      "User-Agent": "APIfy-Tester"
    },
    "body": "",
    "auth_type": "none",
    "auth_details": "Публичный эндпоинт"
  }
]
\`\`\`

**Рекомендации:**
1. Начните с публичных эндпоинтов (без аутентификации)
2. Проверьте документацию API для получения примеров
3. Используйте тестовые данные, не реальные

*Попробуйте позже, когда лимит API обновится.*`;
    }
    
    return `# Анализ API для "${userMessage}"

К сожалению, превышен лимит запросов к AI API. 

## Общие рекомендации для поиска API:

1. **Официальная документация** - ищите на сайте сервиса раздел "API" или "Developers"
2. **Популярные форматы:**
   - REST API с JSON
   - GraphQL
   - WebSocket для real-time

3. **Типичная аутентификация:**
   - API ключи в заголовках
   - Bearer токены
   - OAuth 2.0

4. **Полезные ресурсы:**
   - GitHub - поиск по API wrapper'ам
   - Postman Collections
   - OpenAPI/Swagger спецификации

*Примечание: Это демо-ответ. Попробуйте позже, когда лимит API обновится.*`;
  }

  // Специализированные методы для разных задач
  async analyzeAPI(serviceName: string): Promise<string> {
    const messages: MimoMessage[] = [
      {
        role: 'system',
        content: 'Ты эксперт по API и веб-сервисам. Помогаешь находить информацию об API различных сервисов. Отвечай на русском языке.'
      },
      {
        role: 'user',
        content: `Найди информацию об API для сервиса "${serviceName}". Укажи:
1. Официальный URL документации API
2. Базовый URL для запросов
3. Тип аутентификации (API ключ, Bearer токен, OAuth и т.д.)
4. Основные эндпоинты
5. Примеры запросов

Если это популярный сервис, дай конкретную информацию. Если не знаешь точно, укажи это и дай общие рекомендации по поиску API документации.`
      }
    ];

    return this.chat(messages);
  }

  async generateReadyTests(serviceName: string): Promise<string> {
    const messages: MimoMessage[] = [
      {
        role: 'system',
        content: 'Ты эксперт по тестированию API. Создаешь готовые к использованию тесты в формате JSON для популярных API сервисов. Отвечай на русском языке.'
      },
      {
        role: 'user',
        content: `Создай 3-5 готовых тестов для API сервиса "${serviceName}". 

Для каждого теста укажи в формате JSON:
{
  "name": "Название теста",
  "description": "Описание что тестирует",
  "method": "GET/POST/PUT/DELETE",
  "url": "полный URL",
  "headers": {"заголовок": "значение"},
  "body": "тело запроса если нужно",
  "auth_type": "none/bearer/api-key/basic",
  "auth_details": "детали аутентификации"
}

Выбери самые важные и часто используемые эндпоинты. Если нужна аутентификация, укажи где взять ключи/токены.

Примеры должны быть реальными и рабочими для популярных сервисов.`
      }
    ];

    return this.chat(messages);
  }

  async generateTestScenarios(apiDoc: string): Promise<string> {
    const messages: MimoMessage[] = [
      {
        role: 'system',
        content: 'Ты эксперт по тестированию API. Создаешь тестовые сценарии на основе документации API. Отвечай на русском языке.'
      },
      {
        role: 'user',
        content: `На основе этой документации API создай 5-7 тестовых сценариев:

${apiDoc}

Для каждого сценария укажи:
1. Название теста
2. HTTP метод и URL
3. Необходимые заголовки
4. Тело запроса (если нужно)
5. Ожидаемый результат

Сценарии должны покрывать основные случаи использования API.`
      }
    ];

    return this.chat(messages);
  }

  async extractExamples(apiDoc: string): Promise<string> {
    const messages: MimoMessage[] = [
      {
        role: 'system',
        content: 'Ты помощник для извлечения примеров из документации API. Находишь и структурируешь примеры запросов. Отвечай на русском языке.'
      },
      {
        role: 'user',
        content: `Извлеки из этой документации все примеры HTTP запросов:

${apiDoc}

Для каждого примера укажи:
1. Описание что делает запрос
2. HTTP метод
3. URL
4. Заголовки
5. Тело запроса (если есть)
6. Пример ответа (если есть)

Структурируй ответ в удобном для чтения формате.`
      }
    ];

    return this.chat(messages);
  }
}