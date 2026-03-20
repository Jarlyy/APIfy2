import { GeminiAPI } from "@/lib/gemini-api";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let requestBody: any;

  try {
    // Сначала парсим тело запроса
    requestBody = await request.json();
    console.log("Received request body:", requestBody);

    const {
      actualResponse,
      expectedResponse,
      testName,
      apiUrl,
      httpMethod,
      httpStatus,
      aiProvider = "huggingface",
    } = requestBody;

    console.log("AI Analysis request:", {
      testName,
      apiUrl,
      httpMethod,
      httpStatus,
      aiProvider,
    });

    if (!actualResponse) {
      console.log("No actualResponse provided");
      return NextResponse.json(
        { error: "Фактический ответ обязателен" },
        { status: 400 },
      );
    }

    // Используем универсальную систему AI провайдеров
    try {
      const geminiApi = new GeminiAPI(aiProvider);

      // Формируем промпт для анализа
      const prompt = `Проанализируй ответ API и дай краткий комментарий на русском языке (максимум 2-3 предложения).

ИНФОРМАЦИЯ О ТЕСТЕ:
- Название теста: ${testName || "Не указано"}
- URL: ${apiUrl || "Не указан"}
- HTTP метод: ${httpMethod || "Не указан"}
- HTTP статус: ${httpStatus || "Не указан"}

ФАКТИЧЕСКИЙ ОТВЕТ:
${typeof actualResponse === "string" ? actualResponse : JSON.stringify(actualResponse, null, 2)}

${
  expectedResponse
    ? `ОЖИДАЕМЫЙ ОТВЕТ:
${typeof expectedResponse === "string" ? expectedResponse : JSON.stringify(expectedResponse, null, 2)}`
    : ""
}

Дай краткий анализ:
1. Успешен ли запрос?
2. ${expectedResponse ? "Соответствует ли ответ ожиданиям?" : "Что содержит ответ?"}
3. Есть ли проблемы или рекомендации?

Ответь кратко и по делу, используй эмодзи для наглядности.`;

      console.log(
        `Отправляем запрос к AI провайдеру: ${geminiApi.getCurrentProvider()}`,
      );

      const analysis = await geminiApi.generateContent(prompt, {
        temperature: 0.3,
        maxOutputTokens: 2000,
      });

      console.log("AI Analysis result:", analysis);

      return NextResponse.json({
        analysis,
        provider: geminiApi.getCurrentProvider(),
      });
    } catch (aiError) {
      console.error("AI provider error:", aiError);

      // Fallback анализ при ошибке AI
      const fallbackAnalysis = generateFallbackAnalysis(
        actualResponse,
        expectedResponse,
        httpStatus,
      );
      return NextResponse.json({
        analysis: fallbackAnalysis,
        fallback: true,
        error: `Ошибка AI провайдера (${aiProvider}): ${aiError instanceof Error ? aiError.message : "Неизвестная ошибка"}`,
      });
    }
  } catch (error) {
    console.error("Error analyzing response:", error);

    // Fallback анализ при общей ошибке
    const fallbackAnalysis = generateFallbackAnalysis(
      requestBody?.actualResponse || null,
      requestBody?.expectedResponse || null,
      requestBody?.httpStatus || null,
    );

    // Проверяем специфичные ошибки
    let errorMessage = "Ошибка AI анализа";
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        errorMessage = "Превышено время ожидания ответа от AI (30 сек)";
      } else if (error.message.includes("fetch failed")) {
        errorMessage = "Ошибка подключения к AI API";
      } else {
        errorMessage = `Ошибка AI анализа: ${error.message}`;
      }
    }

    return NextResponse.json({
      analysis: fallbackAnalysis,
      fallback: true,
      error: errorMessage,
    });
  }
}

// Простой анализ без AI как fallback
function generateFallbackAnalysis(
  actualResponse: any,
  expectedResponse: any,
  httpStatus?: number,
): string {
  let analysis = "";

  // Анализ HTTP статуса
  if (httpStatus) {
    if (httpStatus >= 200 && httpStatus < 300) {
      analysis += "✅ Запрос выполнен успешно. ";
    } else if (httpStatus >= 400 && httpStatus < 500) {
      analysis += "❌ Ошибка клиента (4xx). Проверьте параметры запроса. ";
    } else if (httpStatus >= 500) {
      analysis += "🔥 Ошибка сервера (5xx). Проблема на стороне API. ";
    } else {
      analysis += `ℹ️ HTTP статус: ${httpStatus}. `;
    }
  }

  // Анализ содержимого ответа
  if (actualResponse) {
    if (typeof actualResponse === "object") {
      const keys = Object.keys(actualResponse);
      if (keys.length > 0) {
        analysis += `📊 Ответ содержит ${keys.length} полей: ${keys.slice(0, 3).join(", ")}${keys.length > 3 ? "..." : ""}. `;
      }

      if (actualResponse.error) {
        analysis += "⚠️ В ответе есть поле error. ";
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
        analysis += "🎯 Ответ полностью соответствует ожиданиям!";
      } else {
        analysis += "🔍 Ответ отличается от ожидаемого. Проверьте детали.";
      }
    } catch {
      analysis += "🔍 Не удалось сравнить с ожидаемым ответом.";
    }
  }

  return analysis || "📋 Ответ получен, но требует ручной проверки.";
}
