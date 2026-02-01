// Универсальный интерфейс для AI провайдеров
export interface AIProvider {
  name: string;
  generateContent(prompt: string, options?: AIGenerationOptions): Promise<string>;
}

export interface AIGenerationOptions {
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
}

// Gemini API провайдер
export class GeminiProvider implements AIProvider {
  name = 'Gemini';
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.baseUrl = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';
    
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY не найден в переменных окружения');
    }
  }

  async generateContent(prompt: string, options?: AIGenerationOptions): Promise<string> {
    const request = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: options?.temperature || 0.3,
        topP: options?.topP || 0.95,
        maxOutputTokens: options?.maxOutputTokens || 4000
      }
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: { message: errorText } };
        }
        
        const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`Gemini API ошибка: ${errorMessage}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('Пустой ответ от Gemini API');
      }

      return content;
    } catch (error) {
      console.error('Ошибка при запросе к Gemini API:', error);
      throw new Error(`Не удалось получить ответ от Gemini: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }
}

// Hugging Face GPT OSS провайдер
export class HuggingFaceProvider implements AIProvider {
  name = 'GPT OSS 120B';
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY || '';
    // Используем Hugging Face Inference Providers с OpenAI-совместимым API
    this.baseUrl = 'https://router.huggingface.co/v1/chat/completions';
    
    if (!this.apiKey) {
      throw new Error('HUGGINGFACE_API_KEY не найден в переменных окружения');
    }
  }

  async generateContent(prompt: string, options?: AIGenerationOptions): Promise<string> {
    const request = {
      model: "openai/gpt-oss-120b:fireworks-ai", // Используем провайдер Fireworks AI
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: options?.temperature || 0.3,
      top_p: options?.topP || 0.95,
      max_tokens: options?.maxOutputTokens || 4000,
      stream: false
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }
        
        const errorMessage = errorData.error?.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`Hugging Face API ошибка: ${errorMessage}`);
      }

      const data = await response.json();
      
      // OpenAI-совместимый формат ответа
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('Пустой ответ от Hugging Face API');
      }

      return content.trim();
    } catch (error) {
      console.error('Ошибка при запросе к Hugging Face API:', error);
      throw new Error(`Не удалось получить ответ от Hugging Face: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }
}

// Фабрика для создания провайдеров
export class AIProviderFactory {
  static createProvider(providerType: 'gemini' | 'huggingface'): AIProvider {
    switch (providerType) {
      case 'gemini':
        return new GeminiProvider();
      case 'huggingface':
        return new HuggingFaceProvider();
      default:
        throw new Error(`Неизвестный провайдер: ${providerType}`);
    }
  }

  static getAvailableProviders(): Array<{id: string, name: string, description: string}> {
    return [
      {
        id: 'huggingface',
        name: 'GPT OSS 120B',
        description: 'Open Source GPT модель через Hugging Face'
      },
      {
        id: 'gemini',
        name: 'Google Gemini',
        description: 'Google Gemini 2.5 Flash - быстрый и точный'
      }
    ];
  }
}