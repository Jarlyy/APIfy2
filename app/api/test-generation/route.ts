import { NextRequest, NextResponse } from 'next/server'
import { GeminiAPI } from '@/lib/gemini-api'

export async function POST(request: NextRequest) {
  try {
    console.log('=== ТЕСТ ГЕНЕРАЦИИ ТЕСТОВ ===')
    
    // Проверяем переменные окружения
    const geminiKey = process.env.GEMINI_API_KEY
    const geminiUrl = process.env.GEMINI_API_URL
    
    console.log('Переменные окружения:')
    console.log('GEMINI_API_KEY:', geminiKey ? `${geminiKey.substring(0, 10)}...` : 'НЕТ')
    console.log('GEMINI_API_URL:', geminiUrl || 'НЕТ')
    
    if (!geminiKey || !geminiUrl) {
      return NextResponse.json({
        error: 'Переменные окружения не настроены',
        details: {
          hasKey: !!geminiKey,
          hasUrl: !!geminiUrl
        }
      }, { status: 500 })
    }
    
    // Создаем экземпляр GeminiAPI
    console.log('Создаем экземпляр GeminiAPI...')
    const gemini = new GeminiAPI()
    
    // Тестируем простой запрос
    console.log('Тестируем простой запрос...')
    const simpleResult = await gemini.generateContent('Привет! Ответь кратко на русском.')
    console.log('Простой результат:', simpleResult)
    
    // Тестируем генерацию тестов
    console.log('Тестируем генерацию тестов...')
    const testsResult = await gemini.generateExecutableTests('JSONPlaceholder')
    console.log('Результат генерации тестов:', testsResult.substring(0, 200) + '...')
    
    return NextResponse.json({
      success: true,
      simpleResult,
      testsResult,
      environment: {
        hasKey: !!geminiKey,
        hasUrl: !!geminiUrl,
        keyLength: geminiKey?.length || 0
      }
    })
    
  } catch (error) {
    console.error('Ошибка в тесте генерации:', error)
    return NextResponse.json({
      error: 'Ошибка тестирования',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}