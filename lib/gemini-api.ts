interface GeminiContent {
  parts: Array<{
    text: string;
  }>;
}

interface GeminiRequest {
  contents: GeminiContent[];
  generationConfig?: {
    temperature?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GeminiAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.baseUrl = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
    
    console.log('GeminiAPI инициализация:', {
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey.length,
      baseUrl: this.baseUrl
    });
    
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY не найден в переменных окружения');
    }
  }

  async generateContent(prompt: string, options?: {
    temperature?: number;
    topP?: number;
    maxOutputTokens?: number;
  }): Promise<string> {
    const request: GeminiRequest = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: options?.temperature || 0.3,
        topP: options?.topP || 0.95,
        maxOutputTokens: options?.maxOutputTokens || 1000
      }
    };

    try {
      console.log('Отправляю запрос к Gemini API:', {
        url: this.baseUrl,
        promptLength: prompt.length
      });

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      console.log('Ответ от Gemini API:', {
        status: response.status,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ошибка Gemini API:', errorText);
        
        // Если превышен лимит запросов, возвращаем демо-ответ
        if (response.status === 429) {
          console.log('Лимит запросов превышен, возвращаю демо-ответ');
          return this.getDemoResponse(prompt);
        }
        
        throw new Error(`Gemini API ошибка: ${response.status} ${response.statusText}`);
      }

      const data: GeminiResponse = await response.json();
      console.log('Данные от Gemini API получены');

      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error('Пустой ответ от Gemini API');
      }

      return content;
    } catch (error) {
      console.error('Ошибка при запросе к Gemini API:', error);
      
      // В случае ошибки возвращаем демо-ответ
      console.log('Возвращаю демо-ответ из-за ошибки');
      return this.getDemoResponse(prompt);
    }
  }

  private getDemoResponse(prompt: string): string {
    const isExecutableTests = prompt.includes('generateExecutableTests') || prompt.includes('ТОЛЬКО JSON массив');
    const isTestGeneration = prompt.includes('готовых тестов') || prompt.includes('формате JSON');
    
    if (isExecutableTests) {
      return JSON.stringify([
        {
          "id": "demo-1",
          "name": "Получение списка пользователей",
          "url": "https://jsonplaceholder.typicode.com/users",
          "method": "GET",
          "headers": {},
          "body": "",
          "auth_type": "none",
          "auth_token": "",
          "expected_status": 200,
          "expected_response": "Массив пользователей"
        },
        {
          "id": "demo-2", 
          "name": "Получение пользователя по ID",
          "url": "https://jsonplaceholder.typicode.com/users/1",
          "method": "GET",
          "headers": {},
          "body": "",
          "auth_type": "none",
          "auth_token": "",
          "expected_status": 200,
          "expected_response": "Объект пользователя"
        }
      ], null, 2);
    }
    
    if (isTestGeneration) {
      return `Вот готовые тесты для API:

\`\`\`json
[
  {
    "name": "Получение списка постов",
    "url": "https://jsonplaceholder.typicode.com/posts",
    "method": "GET",
    "description": "Получает все посты"
  },
  {
    "name": "Создание нового поста",
    "url": "https://jsonplaceholder.typicode.com/posts",
    "method": "POST",
    "description": "Создает новый пост"
  }
]
\`\`\``;
    }
    
    return "Демо-ответ от Gemini API. Реальный API временно недоступен.";
  }

  // Анализ API сервиса
  async analyzeAPI(serviceName: string): Promise<string> {
    const prompt = `Проанализируй API сервис "${serviceName}" и предоставь информацию о:

1. Основные эндпоинты и их назначение
2. Методы аутентификации
3. Формат данных (JSON, XML и т.д.)
4. Основные возможности API
5. Примеры использования

Ответь на русском языке в структурированном формате.`;

    return await this.generateContent(prompt, { temperature: 0.3 });
  }

  // Генерация готовых тестов
  async generateReadyTests(serviceName: string): Promise<string> {
    const prompt = `Создай готовые тесты для API сервиса "${serviceName}".

Требования:
- Создай 3-5 реалистичных тестов
- Включи разные HTTP методы (GET, POST, PUT, DELETE)
- Добавь описание каждого теста
- Используй реальные URL если знаешь, или создай правдоподобные
- Ответь в формате JSON массива

Формат ответа:
\`\`\`json
[
  {
    "name": "Название теста",
    "url": "https://api.example.com/endpoint",
    "method": "GET",
    "description": "Описание теста"
  }
]
\`\`\``;

    return await this.generateContent(prompt, { temperature: 0.4 });
  }

  // Генерация исполняемых тестов
  async generateExecutableTests(serviceName: string): Promise<string> {
    const prompt = `Создай исполняемые тесты для API сервиса "${serviceName}".

ВАЖНО: Ответь ТОЛЬКО JSON массивом без дополнительного текста!

Создай 3-5 реалистичных тестов со всеми необходимыми полями:
- id: уникальный идентификатор
- name: название теста
- url: полный URL эндпоинта
- method: HTTP метод
- headers: объект заголовков
- body: тело запроса (строка)
- auth_type: тип аутентификации ("none", "bearer", "api-key", "basic")
- auth_token: токен аутентификации
- expected_status: ожидаемый HTTP статус
- expected_response: описание ожидаемого ответа

Используй реальные API если знаешь (например, JSONPlaceholder, GitHub API, OpenWeather), или создай правдоподобные.

Пример формата:
[
  {
    "id": "test-1",
    "name": "Получение списка пользователей",
    "url": "https://jsonplaceholder.typicode.com/users",
    "method": "GET",
    "headers": {},
    "body": "",
    "auth_type": "none",
    "auth_token": "",
    "expected_status": 200,
    "expected_response": "Массив пользователей"
  }
]`;

    return await this.generateContent(prompt, { temperature: 0.3, maxOutputTokens: 2000 });
  }

  // Генерация тестовых сценариев
  async generateTestScenarios(apiDoc: string): Promise<string> {
    const prompt = `На основе документации API создай тестовые сценарии:

${apiDoc}

Создай:
1. Позитивные тесты (успешные сценарии)
2. Негативные тесты (ошибки, граничные случаи)
3. Тесты безопасности
4. Тесты производительности

Ответь в структурированном формате на русском языке.`;

    return await this.generateContent(prompt, { temperature: 0.4 });
  }

  // Извлечение примеров из документации
  async extractExamples(apiDoc: string): Promise<string> {
    const prompt = `Извлеки примеры API запросов из документации:

${apiDoc}

Найди и структурируй:
1. Примеры запросов
2. Примеры ответов
3. Параметры запросов
4. Коды ошибок

Представь в удобном для тестирования формате.`;

    return await this.generateContent(prompt, { temperature: 0.2 });
  }

  // Валидация результатов тестов
  async validateTestResult(test: any, result: any): Promise<string> {
    const prompt = `Проанализируй результат выполнения теста:

ТЕСТ:
${JSON.stringify(test, null, 2)}

РЕЗУЛЬТАТ:
${JSON.stringify(result, null, 2)}

Оцени:
1. Соответствует ли результат ожиданиям?
2. Есть ли ошибки или проблемы?
3. Рекомендации по улучшению

Ответь кратко на русском языке.`;

    return await this.generateContent(prompt, { temperature: 0.3 });
  }
}