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
    const isExecutableTests = userMessage.includes('generateExecutableTests') || userMessage.includes('ТОЛЬКО JSON массив');
    const isTestGeneration = userMessage.includes('готовых тестов') || userMessage.includes('формате JSON');
    
    if (userMessage.toLowerCase().includes('github')) {
      if (isExecutableTests) {
        return JSON.stringify([
          {
            "id": "github_user_info",
            "name": "Информация о пользователе",
            "description": "Получает публичную информацию о пользователе GitHub",
            "method": "GET",
            "url": "https://api.github.com/users/YOUR_USERNAME",
            "headers": {
              "Accept": "application/vnd.github+json",
              "User-Agent": "APIfy-Tester"
            },
            "body": "",
            "auth_type": "none",
            "auth_token": "",
            "expected_status": 200,
            "test_type": "smoke",
            "category": "data",
            "instructions": "Замените YOUR_USERNAME на имя пользователя GitHub"
          },
          {
            "id": "github_repo_info",
            "name": "Информация о репозитории",
            "description": "Получает информацию о публичном репозитории",
            "method": "GET",
            "url": "https://api.github.com/repos/YOUR_USERNAME/YOUR_REPO",
            "headers": {
              "Accept": "application/vnd.github+json",
              "User-Agent": "APIfy-Tester"
            },
            "body": "",
            "auth_type": "none",
            "auth_token": "",
            "expected_status": 200,
            "test_type": "functional",
            "category": "data",
            "instructions": "Замените YOUR_USERNAME и YOUR_REPO на реальные значения"
          },
          {
            "id": "github_current_user",
            "name": "Текущий пользователь",
            "description": "Получает информацию об аутентифицированном пользователе",
            "method": "GET",
            "url": "https://api.github.com/user",
            "headers": {
              "Accept": "application/vnd.github+json",
              "User-Agent": "APIfy-Tester"
            },
            "body": "",
            "auth_type": "bearer",
            "auth_token": "YOUR_GITHUB_TOKEN",
            "expected_status": 200,
            "test_type": "functional",
            "category": "auth",
            "instructions": "Требуется Personal Access Token. Создайте в Settings -> Developer settings -> Personal access tokens"
          }
        ]);
      }
      
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
  }
]
\`\`\`

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
      if (isExecutableTests) {
        return JSON.stringify([
          {
            "id": "telegram_get_me",
            "name": "Информация о боте",
            "description": "Получает информацию о боте через метод getMe",
            "method": "GET",
            "url": "https://api.telegram.org/botYOUR_BOT_TOKEN/getMe",
            "headers": {
              "Content-Type": "application/json"
            },
            "body": "",
            "auth_type": "none",
            "auth_token": "",
            "expected_status": 200,
            "test_type": "smoke",
            "category": "auth",
            "instructions": "Замените YOUR_BOT_TOKEN на токен вашего бота от @BotFather"
          },
          {
            "id": "telegram_send_message",
            "name": "Отправить сообщение",
            "description": "Отправляет текстовое сообщение в чат",
            "method": "POST",
            "url": "https://api.telegram.org/botYOUR_BOT_TOKEN/sendMessage",
            "headers": {
              "Content-Type": "application/json"
            },
            "body": "{\"chat_id\": \"YOUR_CHAT_ID\", \"text\": \"Привет! Это тестовое сообщение от APIfy\"}",
            "auth_type": "none",
            "auth_token": "",
            "expected_status": 200,
            "test_type": "functional",
            "category": "data",
            "instructions": "Замените YOUR_BOT_TOKEN и YOUR_CHAT_ID на реальные значения"
          }
        ]);
      }
      
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
  }
]
\`\`\`

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

    if (userMessage.toLowerCase().includes('reqres')) {
      if (isExecutableTests) {
        return JSON.stringify([
          {
            "id": "reqres_users_list",
            "name": "Список пользователей",
            "description": "Получает список пользователей с пагинацией",
            "method": "GET",
            "url": "https://reqres.in/api/users?page=1",
            "headers": {
              "Content-Type": "application/json"
            },
            "body": "",
            "auth_type": "none",
            "auth_token": "",
            "expected_status": 200,
            "test_type": "functional",
            "category": "data"
          },
          {
            "id": "reqres_user_single",
            "name": "Конкретный пользователь",
            "description": "Получает информацию о пользователе по ID",
            "method": "GET",
            "url": "https://reqres.in/api/users/2",
            "headers": {
              "Content-Type": "application/json"
            },
            "body": "",
            "auth_type": "none",
            "auth_token": "",
            "expected_status": 200,
            "test_type": "functional",
            "category": "data"
          },
          {
            "id": "reqres_create_user",
            "name": "Создать пользователя",
            "description": "Создает нового пользователя",
            "method": "POST",
            "url": "https://reqres.in/api/users",
            "headers": {
              "Content-Type": "application/json"
            },
            "body": "{\"name\": \"APIfy Tester\", \"job\": \"QA Engineer\"}",
            "auth_type": "none",
            "auth_token": "",
            "expected_status": 201,
            "test_type": "functional",
            "category": "crud"
          },
          {
            "id": "reqres_login",
            "name": "Вход в систему",
            "description": "Тестирует аутентификацию пользователя",
            "method": "POST",
            "url": "https://reqres.in/api/login",
            "headers": {
              "Content-Type": "application/json"
            },
            "body": "{\"email\": \"eve.holt@reqres.in\", \"password\": \"cityslicka\"}",
            "auth_type": "none",
            "auth_token": "",
            "expected_status": 200,
            "test_type": "functional",
            "category": "auth"
          }
        ]);
      }
      
      return `# ReqRes API

**Официальная документация:** https://reqres.in/

**Базовый URL:** https://reqres.in/api

**Аутентификация:** Не требуется для большинства эндпоинтов

## Основные эндпоинты:

1. **Пользователи:** GET /users, POST /users, PUT /users/{id}
2. **Аутентификация:** POST /login, POST /register
3. **Ресурсы:** GET /unknown

*Примечание: Это демо-ответ, так как превышен лимит запросов к AI API.*`;
    }

    if (userMessage.toLowerCase().includes('httpbin')) {
      if (isExecutableTests) {
        return JSON.stringify([
          {
            "id": "httpbin_get_test",
            "name": "GET запрос с параметрами",
            "description": "Тестирует GET запрос и отображение параметров",
            "method": "GET",
            "url": "https://httpbin.org/get?param1=test&param2=apiffy",
            "headers": {
              "User-Agent": "APIfy-Tester",
              "X-Custom-Header": "test-value"
            },
            "body": "",
            "auth_type": "none",
            "auth_token": "",
            "expected_status": 200,
            "test_type": "functional",
            "category": "data"
          },
          {
            "id": "httpbin_post_json",
            "name": "POST с JSON данными",
            "description": "Тестирует отправку JSON данных",
            "method": "POST",
            "url": "https://httpbin.org/post",
            "headers": {
              "Content-Type": "application/json"
            },
            "body": "{\"test\": \"APIfy POST test\", \"timestamp\": \"" + new Date().toISOString() + "\"}",
            "auth_type": "none",
            "auth_token": "",
            "expected_status": 200,
            "test_type": "functional",
            "category": "crud"
          },
          {
            "id": "httpbin_status_test",
            "name": "Тест статус кода 418",
            "description": "Тестирует специальный статус код 418 I'm a teapot",
            "method": "GET",
            "url": "https://httpbin.org/status/418",
            "headers": {
              "Content-Type": "application/json"
            },
            "body": "",
            "auth_type": "none",
            "auth_token": "",
            "expected_status": 418,
            "test_type": "functional",
            "category": "data"
          }
        ]);
      }
      
      return `# HTTPBin API

**Официальная документация:** https://httpbin.org/

**Базовый URL:** https://httpbin.org

**Аутентификация:** Не требуется

## HTTP методы для тестирования:

1. **GET** /get - тестирование GET запросов
2. **POST** /post - тестирование POST запросов  
3. **PUT** /put - тестирование PUT запросов
4. **DELETE** /delete - тестирование DELETE запросов

*Примечание: Это демо-ответ, так как превышен лимит запросов к AI API.*`;
    }

    // Универсальные демо-тесты для неизвестных сервисов
    if (isExecutableTests) {
      return JSON.stringify([
        {
          "id": "jsonplaceholder_posts",
          "name": "Список постов",
          "description": "Получает список всех постов из JSONPlaceholder",
          "method": "GET",
          "url": "https://jsonplaceholder.typicode.com/posts?_limit=5",
          "headers": {
            "Content-Type": "application/json"
          },
          "body": "",
          "auth_type": "none",
          "auth_token": "",
          "expected_status": 200,
          "test_type": "smoke",
          "category": "data"
        },
        {
          "id": "jsonplaceholder_post",
          "name": "Конкретный пост",
          "description": "Получает информацию о посте с ID 1",
          "method": "GET",
          "url": "https://jsonplaceholder.typicode.com/posts/1",
          "headers": {
            "Content-Type": "application/json"
          },
          "body": "",
          "auth_type": "none",
          "auth_token": "",
          "expected_status": 200,
          "test_type": "functional",
          "category": "data"
        },
        {
          "id": "httpbin_get",
          "name": "HTTP GET тест",
          "description": "Тестирует GET запрос с параметрами",
          "method": "GET",
          "url": "https://httpbin.org/get?test=apiffy&source=demo",
          "headers": {
            "User-Agent": "APIfy-Tester"
          },
          "body": "",
          "auth_type": "none",
          "auth_token": "",
          "expected_status": 200,
          "test_type": "functional",
          "category": "data"
        },
        {
          "id": "rest_countries",
          "name": "Информация о стране",
          "description": "Получает информацию о России",
          "method": "GET",
          "url": "https://restcountries.com/v3.1/name/russia",
          "headers": {
            "Content-Type": "application/json"
          },
          "body": "",
          "auth_type": "none",
          "auth_token": "",
          "expected_status": 200,
          "test_type": "functional",
          "category": "data"
        },
        {
          "id": "cat_fact",
          "name": "Факт о кошках",
          "description": "Получает случайный факт о кошках",
          "method": "GET",
          "url": "https://catfact.ninja/fact",
          "headers": {
            "Content-Type": "application/json"
          },
          "body": "",
          "auth_type": "none",
          "auth_token": "",
          "expected_status": 200,
          "test_type": "functional",
          "category": "data"
        },
        {
          "id": "dog_image",
          "name": "Случайное фото собаки",
          "description": "Получает ссылку на случайное изображение собаки",
          "method": "GET",
          "url": "https://dog.ceo/api/breeds/image/random",
          "headers": {
            "Content-Type": "application/json"
          },
          "body": "",
          "auth_type": "none",
          "auth_token": "",
          "expected_status": 200,
          "test_type": "functional",
          "category": "data"
        },
        {
          "id": "advice_slip",
          "name": "Случайный совет",
          "description": "Получает случайный совет на английском языке",
          "method": "GET",
          "url": "https://api.adviceslip.com/advice",
          "headers": {
            "Content-Type": "application/json"
          },
          "body": "",
          "auth_type": "none",
          "auth_token": "",
          "expected_status": 200,
          "test_type": "functional",
          "category": "data"
        },
        {
          "id": "httpbin_post",
          "name": "HTTP POST тест",
          "description": "Тестирует POST запрос с JSON данными",
          "method": "POST",
          "url": "https://httpbin.org/post",
          "headers": {
            "Content-Type": "application/json"
          },
          "body": "{\"test\": \"APIfy POST test\", \"timestamp\": \"" + new Date().toISOString() + "\"}",
          "auth_type": "none",
          "auth_token": "",
          "expected_status": 200,
          "test_type": "functional",
          "category": "crud"
        }
      ]);
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

  async generateExecutableTests(serviceName: string): Promise<string> {
    const messages: MimoMessage[] = [
      {
        role: 'system',
        content: `Ты эксперт по API тестированию. Создаешь готовые к запуску тесты для популярных API сервисов. 
        
ВАЖНО: Ответ должен содержать ТОЛЬКО валидный JSON массив тестов без дополнительного текста или markdown разметки.

КРИТИЧЕСКИ ВАЖНО: Если API требует токены, ключи или пользовательские данные, используй ТОЧНО такие плейсхолдеры:
- YOUR_TOKEN - для общих токенов
- YOUR_API_KEY - для API ключей  
- YOUR_BOT_TOKEN - для Telegram ботов
- YOUR_GITHUB_TOKEN - для GitHub
- YOUR_CHAT_ID - для Telegram chat ID
- YOUR_USERNAME - для имен пользователей
- YOUR_USER_ID - для ID пользователей

НЕ используй {username}, <token>, user, или другие форматы - только указанные выше!

Каждый тест должен быть готов к немедленному выполнению и содержать реальные рабочие эндпоинты.`
      },
      {
        role: 'user',
        content: `Создай готовые к запуску тесты для "${serviceName}" API. 

Верни ТОЛЬКО JSON массив в таком формате:
[
  {
    "id": "уникальный_id",
    "name": "Краткое название теста",
    "description": "Подробное описание что тестирует",
    "method": "GET/POST/PUT/DELETE",
    "url": "полный_рабочий_URL",
    "headers": {
      "Content-Type": "application/json",
      "User-Agent": "APIfy-Tester"
    },
    "body": "",
    "auth_type": "none/bearer/api-key/basic",
    "auth_token": "",
    "expected_status": 200,
    "test_type": "functional/smoke/integration",
    "category": "auth/data/search/crud",
    "instructions": "Инструкции по настройке если нужна аутентификация"
  }
]

ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ:
1. Минимум 3-5 тестов покрывающих основные функции API
2. Начни с публичных эндпоинтов (auth_type: "none") 
3. Для приватных API используй плейсхолдеры: YOUR_TOKEN, YOUR_API_KEY, YOUR_BOT_TOKEN, YOUR_GITHUB_TOKEN, YOUR_CHAT_ID, YOUR_USERNAME, YOUR_USER_ID
4. URL должны быть реальными и рабочими
5. Добавь подробные инструкции для получения токенов
6. Категоризируй тесты (auth, data, search, crud)

Если API требует аутентификации, обязательно используй плейсхолдеры в URL, auth_token или body!

Популярные сервисы: GitHub, Telegram Bot, Twitter, Discord, Slack, OpenAI, Weather API, News API.`
      }
    ];

    return this.chat(messages, { max_completion_tokens: 2000 });
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

  async validateTestResult(test: any, result: any): Promise<string> {
    const messages: MimoMessage[] = [
      {
        role: 'system',
        content: 'Ты эксперт по тестированию API. Анализируешь результаты тестов и даешь оценку их корректности. Отвечай кратко и по делу на русском языке.'
      },
      {
        role: 'user',
        content: `Проанализируй результат теста API:

**Тест:**
- Название: ${test.name}
- Описание: ${test.description}
- Ожидаемый статус: ${test.expected_status}
- Категория: ${test.category}

**Результат:**
- Фактический статус: ${result.status}
- Ответ: ${result.response}

Оцени:
1. Соответствует ли результат ожиданиям?
2. Есть ли проблемы в ответе?
3. Какие рекомендации по улучшению?

Ответь кратко в формате:
ОЦЕНКА: [0-100]%
ПРОБЛЕМЫ: [список проблем или "нет"]
РЕКОМЕНДАЦИИ: [список рекомендаций или "нет"]`
      }
    ];

    return this.chat(messages);
  }
}