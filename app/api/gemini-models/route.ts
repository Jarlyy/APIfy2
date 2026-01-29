import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY
    
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'API ключ не настроен' }, { status: 500 })
    }

    console.log('Получаю список моделей Gemini...')
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    console.log('Ответ от Gemini Models API:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Ошибка получения моделей:', errorText)
      return NextResponse.json({ 
        error: `Ошибка API: ${response.status} ${response.statusText}`,
        details: errorText
      }, { status: response.status })
    }

    const data = await response.json()
    console.log('Доступные модели:', data)

    // Фильтруем только модели, поддерживающие generateContent
    const supportedModels = data.models?.filter((model: any) => 
      model.supportedGenerationMethods?.includes('generateContent')
    ) || []

    return NextResponse.json({ 
      success: true,
      models: supportedModels,
      totalModels: data.models?.length || 0,
      supportedModels: supportedModels.length
    })

  } catch (error) {
    console.error('Ошибка:', error)
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 })
  }
}