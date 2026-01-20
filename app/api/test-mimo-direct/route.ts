import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    console.log('Testing Xiaomi Mimo API directly...');
    console.log('API Key present:', !!process.env.MIMO_API_KEY);
    console.log('API URL:', process.env.MIMO_API_URL);

    if (!process.env.MIMO_API_KEY) {
      return NextResponse.json(
        { error: 'MIMO_API_KEY не настроен' },
        { status: 500 }
      );
    }

    const mimoApiUrl = process.env.MIMO_API_URL || 'https://api.xiaomimimo.com/v1/chat/completions';
    
    const requestPayload = {
      model: 'mimo-v2-flash', // Правильная модель для Xiaomi Mimo
      messages: [
        {
          role: 'user',
          content: message || 'Привет! Это тест API.'
        }
      ],
      max_completion_tokens: 100, // Правильный параметр для Xiaomi Mimo
      temperature: 0.3,
      top_p: 0.95,
      stream: false,
      frequency_penalty: 0,
      presence_penalty: 0
    };

    console.log('Sending request to:', mimoApiUrl);
    console.log('Request payload:', JSON.stringify(requestPayload, null, 2));

    const response = await fetch(mimoApiUrl, {
      method: 'POST',
      headers: {
        'api-key': process.env.MIMO_API_KEY, // Правильный заголовок для Xiaomi Mimo
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Response text:', responseText);

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: 'Xiaomi Mimo API error',
          status: response.status,
          statusText: response.statusText,
          response: responseText
        },
        { status: response.status }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      return NextResponse.json(
        { 
          error: 'Failed to parse response',
          response: responseText
        },
        { status: 500 }
      );
    }

    const aiResponse = data.choices?.[0]?.message?.content || 'No response content';

    return NextResponse.json({
      success: true,
      response: aiResponse,
      fullResponse: data
    });

  } catch (error) {
    console.error('Error testing Xiaomi Mimo API:', error);
    return NextResponse.json(
      { 
        error: 'Server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}