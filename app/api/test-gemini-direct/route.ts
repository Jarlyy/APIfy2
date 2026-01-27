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
      return NextResponse.json({ 
        error: `Gemini API ошибка: ${response.status} ${response.statusText}`,
        details: errorText
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