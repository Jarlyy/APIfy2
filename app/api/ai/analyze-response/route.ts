import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  let requestBody: any;
  
  try {
    // Сначала парсим тело запроса
    requestBody = await request.json();
    console.log('Received request body:', requestBody);
    
    const { 
      actualResponse, 
      expectedResponse, 
      testName, 
      apiUrl, 
      httpMethod,
      httpStatus 
    } = requestBody;

    console.log('AI Analysis request:', { testName, apiUrl, httpMethod, httpStatus });

    if (!actualResponse) {
      console.log('No actualResponse provided');
      return NextResponse.json(
        { error: 'Фактический ответ обязателен' },
        { status: 400 }
      );
    }

    // Проверяем наличие API ключа
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found in environment variables');
      const fallbackAnalysis = generateFallbackAnalysis(actualResponse, expectedResponse, httpStatus);
      return NextResponse.json({ 
        analysis: fallbackAnalysis,
        fallback: true,
        error: 'AI API ключ не настроен'
      });
    }

    // Формируем промпт для анализа
    const prompt = `Проанализируй ответ API и дай краткий комментарий на русском языке (максимум 2-3 предложения).

ИНФОРМАЦИЯ О ТЕСТЕ:
- Название теста: ${testName || 'Не указано'}
- URL: ${apiUrl || 'Не указан'}
- HTTP метод: ${httpMethod || 'Не указан'}
- HTTP статус: ${httpStatus || 'Не указан'}

ФАКТИЧЕСКИЙ ОТВЕТ:
${typeof actualResponse === 'string' ? actualResponse : JSON.stringify(actualResponse, null, 2)}

${expectedResponse ? `ОЖИДАЕМЫЙ ОТВЕТ:
${typeof expectedResponse === 'string' ? expectedResponse : JSON.stringify(expectedResponse, null, 2)}` : ''}

Дай краткий анализ:
1. Успешен ли запрос?
2. ${expectedResponse ? 'Соответствует ли ответ ожиданиям?' : 'Что содержит ответ?'}
3. Есть ли проблемы или рекомендации?

Ответь кратко и по делу, используй эмодзи для наглядности.`;

    console.log('Sending request to Google Gemini API...');
    console.log('API Key present:', !!process.env.GEMINI_API_KEY);
    console.log('API URL:', process.env.GEMINI_API_URL);

    // Отправляем запрос к Google Gemini API
    const geminiApiUrl = process.env.GEMINI_API_URL;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    const requestPayload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        topP: 0.95,
        maxOutputTokens: 300
      }
    };

    console.log('Request payload:', JSON.stringify(requestPayload, null, 2));

    const geminiResponse = await fetch(`${geminiApiUrl}?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    console.log('Google Gemini API response status:', geminiResponse.status);
    console.log('Google Gemini API response headers:', Object.fromEntries(geminiResponse.headers.entries()));

    if (!geminiResponse.ok) {
      let errorData;
      try {
        const errorText = await geminiResponse.text();
        console.log('Error response text:', errorText);
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
      } catch {
        errorData = { error: 'Failed to read error response' };
      }
      console.error('Google Gemini API error:', errorData);
      
      // Fallback анализ без AI
      const fallbackAnalysis = generateFallbackAnalysis(actualResponse, expectedResponse, httpStatus);
      return NextResponse.json({ 
        analysis: fallbackAnalysis,
        fallback: true,
        error: `AI API ошибка: ${geminiResponse.status} ${geminiResponse.statusText} - ${JSON.stringify(errorData)}`
      });
    }

    const responseText = await geminiResponse.text();
    console.log('Google Gemini API response text:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      const fallbackAnalysis = generateFallbackAnalysis(actualResponse, expectedResponse, httpStatus);
      return NextResponse.json({ 
        analysis: fallbackAnalysis,
        fallback: true,
        error: 'Не удалось распарсить ответ AI'
      });
    }

    console.log('Google Gemini API response data:', data);

    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Не удалось проанализировать ответ';

    console.log('AI Analysis result:', analysis);

    return NextResponse.json({ analysis });

  } catch (error) {
    console.error('Error analyzing response:', error);
    
    // Fallback анализ при ошибке
    const fallbackAnalysis = generateFallbackAnalysis(
      requestBody?.actualResponse || null,
      requestBody?.expectedResponse || null,
      requestBody?.httpStatus || null
    );
    
    return NextResponse.json({ 
      analysis: fallbackAnalysis,
      fallback: true,
      error: `Ошибка AI анализа: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
    });
  }
}

// Простой анализ без AI как fallback
function generateFallbackAnalysis(actualResponse: any, expectedResponse: any, httpStatus?: number): string {
  let analysis = '';

  // Анализ HTTP статуса
  if (httpStatus) {
    if (httpStatus >= 200 && httpStatus < 300) {
      analysis += '✅ Запрос выполнен успешно. ';
    } else if (httpStatus >= 400 && httpStatus < 500) {
      analysis += '❌ Ошибка клиента (4xx). Проверьте параметры запроса. ';
    } else if (httpStatus >= 500) {
      analysis += '🔥 Ошибка сервера (5xx). Проблема на стороне API. ';
    } else {
      analysis += `ℹ️ HTTP статус: ${httpStatus}. `;
    }
  }

  // Анализ содержимого ответа
  if (actualResponse) {
    if (typeof actualResponse === 'object') {
      const keys = Object.keys(actualResponse);
      if (keys.length > 0) {
        analysis += `📊 Ответ содержит ${keys.length} полей: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}. `;
      }
      
      if (actualResponse.error) {
        analysis += '⚠️ В ответе есть поле error. ';
      }
      
      if (Array.isArray(actualResponse)) {
        analysis += `📋 Получен массив из ${actualResponse.length} элементов. `;
      }
    } else {
      analysis += `📝 Получен текстовый ответ (${typeof actualResponse}). `;
    }
  }

  // Сравнение с ожидаемым ответом
  if (expectedResponse && actualResponse) {
    try {
      const actualStr = JSON.stringify(actualResponse);
      const expectedStr = JSON.stringify(expectedResponse);
      if (actualStr === expectedStr) {
        analysis += '🎯 Ответ полностью соответствует ожиданиям!';
      } else {
        analysis += '🔍 Ответ отличается от ожидаемого. Проверьте детали.';
      }
    } catch {
      analysis += '🔍 Не удалось сравнить с ожидаемым ответом.';
    }
  }

  return analysis || '📋 Ответ получен, но требует ручной проверки.';
}