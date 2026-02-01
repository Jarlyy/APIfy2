import { NextRequest, NextResponse } from 'next/server';
import { AIProviderFactory } from '@/lib/ai-providers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const provider = searchParams.get('provider') || 'gemini';
  const service = searchParams.get('service') || 'GitHub';

  try {
    console.log(`Тестируем провайдер: ${provider} для сервиса: ${service}`);
    
    const aiProvider = AIProviderFactory.createProvider(provider as 'gemini' | 'huggingface');
    
    const prompt = `Создай 2-3 простых теста для API сервиса "${service}".
    
КРИТИЧЕСКИ ВАЖНО:
1. Ответь ТОЛЬКО валидным JSON массивом
2. НЕ используй markdown блоки
3. НЕ добавляй никакого текста до или после JSON
4. Используй только реальные URL

Формат:
[{"id":"test1","name":"Тест 1","url":"https://api.github.com/user","method":"GET","headers":{},"body":"","auth_type":"none","auth_token":"","expected_status":200,"expected_response":"User info"}]`;

    const result = await aiProvider.generateContent(prompt, {
      temperature: 0.2,
      maxOutputTokens: 2000
    });

    return NextResponse.json({
      success: true,
      provider: aiProvider.name,
      service,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Ошибка тестирования провайдера:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      provider,
      service
    }, { status: 500 });
  }
}