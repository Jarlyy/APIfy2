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
      throw error;
    }
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