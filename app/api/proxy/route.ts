import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url, method, headers, body } = await request.json();

    console.log('Прокси запрос:', { url, method });

    // Выполняем запрос с сервера (CORS не применяется к серверным запросам)
    const requestOptions: RequestInit = {
      method: method || 'GET',
      headers: headers || {},
    };

    // Добавляем тело запроса только если это не GET и тело не пустое
    if (body && method !== 'GET') {
      if (typeof body === 'string') {
        requestOptions.body = body;
      } else {
        requestOptions.body = JSON.stringify(body);
      }
    }

    console.log('Выполняю запрос:', { url, method, headers, hasBody: !!requestOptions.body });

    const response = await fetch(url, requestOptions);

    // Получаем данные ответа
    let responseData;
    const contentType = response.headers.get('content-type');
    
    try {
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
    } catch (parseError) {
      responseData = await response.text();
    }

    // Собираем заголовки ответа
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Возвращаем ответ с CORS заголовками
    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      data: responseData,
      headers: responseHeaders,
    }, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      }
    });

  } catch (error) {
    console.error('Ошибка прокси:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}

// Обработка preflight запросов
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    },
  });
}