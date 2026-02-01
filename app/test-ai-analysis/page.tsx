'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Brain, Zap } from 'lucide-react'
import AiAnalysis from '@/components/AiAnalysis'

export default function TestAiAnalysisPage() {
  const [showGeminiAnalysis, setShowGeminiAnalysis] = useState(false)
  const [showHfAnalysis, setShowHfAnalysis] = useState(false)

  // Тестовые данные для анализа
  const testResponse = {
    id: 123456789,
    login: "octocat",
    name: "The Octocat",
    company: "GitHub",
    blog: "https://github.blog",
    location: "San Francisco",
    email: null,
    bio: "There once was...",
    public_repos: 8,
    public_gists: 8,
    followers: 9001,
    following: 9
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Тест AI Анализа</h1>
          <p className="text-muted-foreground mt-2">
            Проверьте как разные AI провайдеры анализируют API ответы
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Тестовый API ответ</CardTitle>
            <CardDescription>
              Ответ от GitHub API для пользователя "octocat"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-3 rounded text-xs overflow-auto">
              {JSON.stringify(testResponse, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Gemini Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500" />
                Анализ через Gemini
                <Badge variant="default">Fast</Badge>
              </CardTitle>
              <CardDescription>
                AI анализ с использованием Google Gemini
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => setShowGeminiAnalysis(true)}
                disabled={showGeminiAnalysis}
                className="w-full"
              >
                Анализировать через Gemini
              </Button>
              
              {showGeminiAnalysis && (
                <AiAnalysis
                  actualResponse={testResponse}
                  testName="GitHub User Info"
                  apiUrl="https://api.github.com/users/octocat"
                  httpMethod="GET"
                  httpStatus={200}
                  aiProvider="gemini"
                />
              )}
            </CardContent>
          </Card>

          {/* Hugging Face Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                Анализ через GPT OSS 120B
                <Badge variant="secondary">OSS</Badge>
              </CardTitle>
              <CardDescription>
                AI анализ с использованием GPT OSS 120B
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => setShowHfAnalysis(true)}
                disabled={showHfAnalysis}
                className="w-full"
                variant="outline"
              >
                Анализировать через GPT OSS
              </Button>
              
              {showHfAnalysis && (
                <AiAnalysis
                  actualResponse={testResponse}
                  testName="GitHub User Info"
                  apiUrl="https://api.github.com/users/octocat"
                  httpMethod="GET"
                  httpStatus={200}
                  aiProvider="huggingface"
                />
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Сравнение провайдеров</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Gemini:</strong> Быстрый анализ (2-5 сек), стабильная работа</p>
              <p><strong>GPT OSS 120B:</strong> Более детальный анализ (10-30 сек), мощная модель</p>
              <p className="text-muted-foreground">
                Оба провайдера анализируют один и тот же ответ, но могут давать разные инсайты
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}