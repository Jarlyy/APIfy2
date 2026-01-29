import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    const geminiApiKey = process.env.GEMINI_API_KEY
    const geminiApiUrl = process.env.GEMINI_API_URL

    if (!geminiApiKey || !geminiApiUrl) {
      return NextResponse.json({ 
        error: 'Gemini API не настроен',
        details: 'Отсутствуют переменные окружения GEMINI_API_KEY или GEMINI_API_URL'
      }, { status: 500 })
    }

    console.log('Testing Gemini API...')
    console.log('API URL:', geminiApiUrl)
    console.log('API Key present:', !!geminiApiKey)

    const testPrompt = prompt || 'Привет! Ответь кратко на русском языке, что ты можешь делать.'

    const response = await fetch(`${geminiApiUrl}?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: testPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          maxOutputTokens: 200
        }
      })
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: { message: errorText } };
      }
      
      // Специфичные сообщения для разных ошибок
      let userMessage = `Gemini API ошибка: ${response.status} ${response.statusText}`;
      
      if (response.status === 400 && errorData.error?.message?.includes('User location is not supported')) {
        userMessage = 'Google AI Studio API недоступен в вашем регионе. Используйте VPN или альтернативные AI сервисы.';
      } else if (response.status === 404 && errorData.error?.message?.includes('not found')) {
        userMessage = 'Указанная модель Gemini не найдена. Проверьте конфигурацию модели.';
      } else if (response.status === 429) {
        userMessage = 'Превышен лимит запросов к Gemini API. Попробуйте позже.';
      } else if (response.status === 401 || response.status === 403) {
        userMessage = 'Неверный API ключ или нет доступа к Gemini API.';
      }
      
      return NextResponse.json({ 
        error: userMessage,
        details: errorData.error?.message || errorText,
        status: response.status
      }, { status: response.status })
    }

    const data = await response.json()
    console.log('Response data:', JSON.stringify(data, null, 2))

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Нет ответа'

    return NextResponse.json({ 
      success: true,
      response: text,
      fullResponse: data
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 })
  }
}