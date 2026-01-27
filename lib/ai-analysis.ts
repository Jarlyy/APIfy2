// Утилиты для AI анализа ответов API с использованием Google Gemini

export interface AnalysisRequest {
  actualResponse: any;
  expectedResponse?: any;
  testName?: string;
  apiUrl?: string;
  httpMethod?: string;
  httpStatus?: number;
}

export interface AnalysisResult {
  analysis: string;
  error?: string;
  fallback?: boolean;
}

// Анализ ответа API через Google Gemini AI
export async function analyzeApiResponse(request: AnalysisRequest): Promise<AnalysisResult> {
  try {
    const response = await fetch('/api/ai/analyze-response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error analyzing API response:', error);
    
    // Fallback анализ
    return {
      analysis: generateSimpleAnalysis(request),
      error: 'Не удалось получить AI анализ, используется упрощенный анализ',
      fallback: true
    };
  }
}

// Тестирование Google Gemini API
export async function testGeminiApi(prompt?: string): Promise<{
  success: boolean;
  response?: string;
  error?: string;
  details?: string;
}> {
  try {
    const response = await fetch('/api/test-gemini-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt })
    })

    const data = await response.json()
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Неизвестная ошибка',
        details: data.details
      }
    }

    return {
      success: true,
      response: data.response
    }
  } catch (error) {
    return {
      success: false,
      error: 'Ошибка сети',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }
  }
}

// Простой анализ без AI
function generateSimpleAnalysis(request: AnalysisRequest): string {
  const { actualResponse, httpStatus, httpMethod } = request;
  
  let analysis = '';

  // Анализ статуса
  if (httpStatus) {
    if (httpStatus >= 200 && httpStatus < 300) {
      analysis += '✅ Успешный ответ. ';
    } else if (httpStatus >= 400) {
      analysis += '❌ Ошибка в запросе. ';
    }
  }

  // Анализ метода
  if (httpMethod) {
    analysis += `🔧 ${httpMethod} запрос. `;
  }

  // Анализ содержимого
  if (actualResponse) {
    if (typeof actualResponse === 'object' && !Array.isArray(actualResponse)) {
      const keys = Object.keys(actualResponse);
      analysis += `📊 Объект с ${keys.length} полями. `;
    } else if (Array.isArray(actualResponse)) {
      analysis += `📋 Массив из ${actualResponse.length} элементов. `;
    } else {
      analysis += `📝 ${typeof actualResponse} ответ. `;
    }
  }

  return analysis || '📋 Ответ получен.';
}

// Проверка доступности AI анализа
export function isAiAnalysisEnabled(): boolean {
  return typeof window !== 'undefined' && 
         localStorage.getItem('aiAnalysisEnabled') !== 'false';
}

// Включение/выключение AI анализа
export function setAiAnalysisEnabled(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('aiAnalysisEnabled', enabled ? 'true' : 'false');
  }
}