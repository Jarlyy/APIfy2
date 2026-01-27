import { NextRequest, NextResponse } from 'next/server';
import { GeminiAPI } from '@/lib/gemini-api';

export async function POST(request: NextRequest) {
  console.log('AI API вызван');
  
  try {
    const body = await request.json();
    console.log('Получен запрос:', body);
    
    const { action, data } = body;
    
    if (!action) {
      return NextResponse.json(
        { error: 'Не указано действие' },
        { status: 400 }
      );
    }

    const gemini = new GeminiAPI();
    let result: string;

    switch (action) {
      case 'analyzeService':
        if (!data?.serviceName) {
          return NextResponse.json(
            { error: 'Не указано название сервиса' },
            { status: 400 }
          );
        }
        result = await gemini.analyzeAPI(data.serviceName);
        break;

      case 'generateTests':
        if (!data?.serviceName) {
          return NextResponse.json(
            { error: 'Не указано название сервиса' },
            { status: 400 }
          );
        }
        result = await gemini.generateReadyTests(data.serviceName);
        break;

      case 'generateExecutableTests':
        if (!data?.serviceName) {
          return NextResponse.json(
            { error: 'Не указано название сервиса' },
            { status: 400 }
          );
        }
        result = await gemini.generateExecutableTests(data.serviceName);
        break;

      case 'generateScenarios':
        if (!data?.apiDoc) {
          return NextResponse.json(
            { error: 'Не указана документация API' },
            { status: 400 }
          );
        }
        result = await gemini.generateTestScenarios(data.apiDoc);
        break;

      case 'extractExamples':
        if (!data?.apiDoc) {
          return NextResponse.json(
            { error: 'Не указана документация API' },
            { status: 400 }
          );
        }
        result = await gemini.extractExamples(data.apiDoc);
        break;

      case 'validateTestResult':
        if (!data?.test || !data?.result) {
          return NextResponse.json(
            { error: 'Не указаны данные теста или результат' },
            { status: 400 }
          );
        }
        result = await gemini.validateTestResult(data.test, data.result);
        break;

      default:
        return NextResponse.json(
          { error: 'Неизвестное действие' },
          { status: 400 }
        );
    }

    console.log('Результат AI:', result.substring(0, 100) + '...');
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Ошибка AI анализа:', error);
    return NextResponse.json(
      { error: `Ошибка при обработке запроса к AI: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}` },
      { status: 500 }
    );
  }
}