import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return handleProxyRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return handleProxyRequest(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return handleProxyRequest(request, 'PUT');
}

export async function DELETE(request: NextRequest) {
  return handleProxyRequest(request, 'DELETE');
}

export async function PATCH(request: NextRequest) {
  return handleProxyRequest(request, 'PATCH');
}

async function handleProxyRequest(request: NextRequest, method: string) {
  try {
    // Получаем целевой URL из параметров
    const targetUrl = request.nextUrl.searchParams.get('url');
    
    if (!targetUrl) {
      return NextResponse.json(
        { error: 'URL параметр обязателен' },
        { status: 400 }
      );
    }

    // Проверяем валидность URL
    let url: URL;
    try {
      url = new URL(targetUrl);
    } catch {
      return NextResponse.json(
        { error: 'Невалидный URL' },
        { status: 400 }
      );
    }

    // Получаем заголовки из запроса
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      // Пропускаем служебные заголовки
      if (!key.startsWith('x-') && 
          key !== 'host' && 
          key !== 'connection' && 
          key !== 'content-length') {
        headers[key] = value;
      }
    });

    // Получаем тело запроса если есть
    let body: string | undefined;
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        body = await request.text();
      } catch {
        body = undefined;
      }
    }

    // Выполняем запрос к целевому API
    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
    });

    // Получаем данные ответа
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Возвращаем ответ с CORS заголовками
    return NextResponse.json(
      {
        status: response.status,
        statusText: response.statusText,
        data,
        headers: Object.fromEntries(response.headers.entries()),
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      }
    );

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Ошибка прокси',
        details: String(error)
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

// Обработка OPTIONS запросов для CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}
