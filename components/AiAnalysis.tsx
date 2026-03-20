"use client";

import {
  analyzeApiResponse,
  isAiAnalysisEnabled,
  setAiAnalysisEnabled,
} from "@/lib/ai-analysis";
import { useEffect, useState } from "react";

interface AiAnalysisProps {
  actualResponse: any;
  expectedResponse?: any;
  testName?: string;
  apiUrl?: string;
  httpMethod?: string;
  httpStatus?: number;
  aiProvider?: "gemini" | "huggingface";
  onAnalysisComplete?: (analysis: string) => void;
}

export default function AiAnalysis({
  actualResponse,
  expectedResponse,
  testName,
  apiUrl,
  httpMethod,
  httpStatus,
  aiProvider = "huggingface",
  onAnalysisComplete,
}: AiAnalysisProps) {
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [enabled, setEnabled] = useState(isAiAnalysisEnabled());

  useEffect(() => {
    if (enabled && actualResponse) {
      performAnalysis();
    }
  }, [actualResponse, enabled]);

  const performAnalysis = async () => {
    if (!actualResponse) return;

    setLoading(true);
    setError("");
    setAnalysis("");

    try {
      const result = await analyzeApiResponse({
        actualResponse,
        expectedResponse,
        testName,
        apiUrl,
        httpMethod,
        httpStatus,
        aiProvider,
      });

      setAnalysis(result.analysis);
      if (result.error) {
        setError(result.error);
      }

      // Показываем информацию о fallback режиме
      if (result.fallback) {
        setError(
          result.error || "Используется упрощенный анализ (AI недоступен)",
        );
      }

      onAnalysisComplete?.(result.analysis);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ошибка анализа";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleEnabled = () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    setAiAnalysisEnabled(newEnabled);

    if (newEnabled && actualResponse) {
      performAnalysis();
    } else {
      setAnalysis("");
      setError("");
    }
  };

  if (!enabled) {
    return (
      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            🤖 AI анализ ответа отключен
          </span>
          <button
            onClick={toggleEnabled}
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            Включить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
          🤖 AI Анализ ответа (
          {aiProvider === "gemini" ? "Gemini" : "GPT OSS 120B"})
          {loading && (
            <div className="animate-spin h-3 w-3 border border-blue-600 border-t-transparent rounded-full" />
          )}
        </h4>
        <button
          onClick={toggleEnabled}
          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
        >
          Отключить
        </button>
      </div>

      {loading && (
        <div className="text-sm text-blue-700 dark:text-blue-300">
          ⏳ Анализирую ответ...
        </div>
      )}

      {error && (
        <div className="text-sm text-orange-700 dark:text-orange-300 mb-2">
          ⚠️ {error}
        </div>
      )}

      {analysis && (
        <div className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
          {analysis}
        </div>
      )}

      {!loading && !analysis && !error && enabled && (
        <button
          onClick={performAnalysis}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
        >
          🔍 Анализировать ответ
        </button>
      )}
    </div>
  );
}
