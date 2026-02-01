import { AIProvider, AIProviderFactory, AIGenerationOptions } from './ai-providers';

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
  private provider: AIProvider;

  constructor(providerType?: 'gemini' | 'huggingface') {
    const defaultProvider = (process.env.DEFAULT_AI_PROVIDER as 'gemini' | 'huggingface') || 'huggingface';
    this.provider = AIProviderFactory.createProvider(providerType || defaultProvider);
    
    console.log('GeminiAPI инициализация с провайдером:', this.provider.name);
  }

  // Переключение провайдера
  switchProvider(providerType: 'gemini' | 'huggingface') {
    this.provider = AIProviderFactory.createProvider(providerType);
    console.log('Переключен на провайдер:', this.provider.name);
  }

  // Получение текущего провайдера
  getCurrentProvider(): string {
    return this.provider.name;
  }

  async generateContent(prompt: string, options?: AIGenerationOptions): Promise<string> {
    console.log('Отправляю запрос к AI провайдеру:', {
      provider: this.provider.name,
      promptLength: prompt.length
    });

    return await this.provider.generateContent(prompt, options);
  }

  // Анализ API сервиса
  async analyzeAPI(serviceName: string): Promise<string> {
    const prompt = [
      `Проанализируй API сервис "${serviceName}" и предоставь информацию о:`,
      '',
      '1. Основные эндпоинты и их назначение',
      '2. Методы аутентификации',
      '3. Формат данных (JSON, XML и т.д.)',
      '4. Основные возможности API',
      '5. Примеры использования',
      '',
      'Ответь на русском языке в структурированном формате.'
    ].join('\n');

    return await this.generateContent(prompt, { temperature: 0.3 });
  }

  // Генерация готовых тестов
  async generateReadyTests(serviceName: string): Promise<string> {
    const prompt = [
      `Создай готовые тесты для API сервиса "${serviceName}".`,
      '',
      'Требования:',
      '- Создай 3-5 реалистичных тестов',
      '- Включи разные HTTP методы (GET, POST, PUT, DELETE)',
      '- Добавь описание каждого теста',
      '- Используй только реальные URL',
      '- Ответь в формате JSON массива',
      '',
      'Формат ответа:',
      '[',
      '  {',
      '    "name": "Название теста",',
      '    "url": "https://api.example.com/endpoint",',
      '    "method": "GET",',
      '    "description": "Описание теста"',
      '  }',
      ']'
    ].join('\n');

    return await this.generateContent(prompt, { temperature: 0.4 });
  }

  // Генерация исполняемых тестов
  async generateExecutableTests(serviceName: string): Promise<string> {
    const prompt = [
      `Создай исполняемые тесты для API сервиса "${serviceName}".`,
      '',
      'КРИТИЧЕСКИ ВАЖНО:',
      '1. Ответь ТОЛЬКО валидным JSON массивом',
      '2. НЕ используй markdown блоки',
      '3. НЕ добавляй никакого текста до или после JSON',
      '4. Убедись что все строки правильно закрыты кавычками',
      '5. Не используй переносы строк внутри строковых значений',
      '6. ИСПОЛЬЗУЙ ТОЛЬКО РЕАЛЬНЫЕ, СУЩЕСТВУЮЩИЕ API URL',
      '7. НЕ ИСПОЛЬЗУЙ api.example.com или любые другие примеры',
      '8. НЕ ПРИДУМЫВАЙ несуществующие домены',
      '9. Если не знаешь реальный URL - НЕ ГЕНЕРИРУЙ тест для этого API',
      '',
      'Создай 3-5 тестов ТОЛЬКО для тех API, реальные URL которых ты точно знаешь:',
      '- id: уникальный идентификатор (строка)',
      '- name: название теста (строка, максимум 50 символов)',
      '- url: ТОЛЬКО реальный, существующий URL (строка)',
      '- method: HTTP метод (GET/POST/PUT/DELETE)',
      '- headers: объект заголовков (объект)',
      '- body: тело запроса (строка, может быть пустой)',
      '- auth_type: тип аутентификации ("none", "bearer", "api-key", "basic")',
      '- auth_token: токен (строка, может быть пустой)',
      '- expected_status: HTTP статус (число)',
      '- expected_response: краткое описание (строка, максимум 40 символов)',
      '',
      'Начинай ответ сразу с [ и заканчивай ]'
    ].join('\n');

    return await this.generateContent(prompt, { temperature: 0.2, maxOutputTokens: 4000 });
  }

  // Генерация тестовых сценариев
  async generateTestScenarios(apiDoc: string): Promise<string> {
    const prompt = [
      'На основе документации API создай тестовые сценарии:',
      '',
      apiDoc,
      '',
      'Создай:',
      '1. Позитивные тесты (успешные сценарии)',
      '2. Негативные тесты (ошибки, граничные случаи)',
      '3. Тесты безопасности',
      '4. Тесты производительности',
      '',
      'Ответь в структурированном формате на русском языке.'
    ].join('\n');

    return await this.generateContent(prompt, { temperature: 0.4 });
  }

  // Извлечение примеров из документации
  async extractExamples(apiDoc: string): Promise<string> {
    const prompt = [
      'Извлеки примеры API запросов из документации:',
      '',
      apiDoc,
      '',
      'Найди и структурируй:',
      '1. Примеры запросов',
      '2. Примеры ответов',
      '3. Параметры запросов',
      '4. Коды ошибок',
      '',
      'Представь в удобном для тестирования формате.'
    ].join('\n');

    return await this.generateContent(prompt, { temperature: 0.2 });
  }

  // Валидация результатов тестов
  async validateTestResult(test: any, result: any): Promise<string> {
    const prompt = [
      'Проанализируй результат выполнения теста:',
      '',
      'ТЕСТ:',
      JSON.stringify(test, null, 2),
      '',
      'РЕЗУЛЬТАТ:',
      JSON.stringify(result, null, 2),
      '',
      'Оцени:',
      '1. Соответствует ли результат ожиданиям?',
      '2. Есть ли ошибки или проблемы?',
      '3. Рекомендации по улучшению',
      '',
      'Ответь кратко на русском языке.'
    ].join('\n');

    return await this.generateContent(prompt, { temperature: 0.3 });
  }
}