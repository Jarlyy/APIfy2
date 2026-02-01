'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, Brain, Zap } from 'lucide-react'

interface TestResult {
  success: boolean
  provider?: string
  service?: string
  result?: string
  error?: string
  timestamp?: string
}

export default function TestProvidersPage() {
  const [serviceName, setServiceName] = useState('GitHub')
  const [geminiLoading, setGeminiLoading] = useState(false)
  const [hfLoading, setHfLoading] = useState(false)
  const [geminiResult, setGeminiResult] = useState<TestResult | null>(null)
  const [hfResult, setHfResult] = useState<TestResult | null>(null)

  const testProvider = async (provider: 'gemini' | 'huggingface') => {
    const setLoading = provider === 'gemini' ? setGeminiLoading : setHfLoading
    const setResult = provider === 'gemini' ? setGeminiResult : setHfResult

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch(`/api/test-providers?provider=${provider}&service=${encodeURIComponent(serviceName)}`)
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка сети'
      })
    } finally {
      setLoading(false)
    }
  }

  const renderResult = (result: TestResult | null, loading: boolean) => {
    if (loading) {
      return (
        <div className="flex items-center gap-2 text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Тестируем...</span>
        </div>
      )
    }

    if (!result) return null

    if (result.success) {
      let tests = []
      try {
        if (typeof result.result === 'string') {
          const cleanResult = result.result
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim()
          
          const jsonMatch = cleanResult.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            tests = JSON.parse(jsonMatch[0])
          } else {
            tests = JSON.parse(cleanResult)
          }
        }
      } catch (e) {
        // Ignore parsing errors for display
      }

      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Успешно!</span>
            <Badge variant="outline">{result.provider}</Badge>
          </div>
          {Array.isArray(tests) && tests.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Сгенерировано тестов: {tests.length}
            </div>
          )}
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">Показать ответ</summary>
            <pre className="mt-2 bg-muted p-2 rounded overflow-auto max-h-32">
              {result.result}
            </pre>
          </details>
        </div>
      )
    } else {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-4 w-4" />
            <span>Ошибка</span>
          </div>
          <div className="text-sm text-red-600">
            {result.error}
          </div>
        </div>
      )
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Тест AI Провайдеров</h1>
          <p className="text-muted-foreground mt-2">
            Проверьте работу Gemini и GPT OSS 120B для генерации API тестов
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Настройки теста</CardTitle>
            <CardDescription>
              Введите название API сервиса для генерации тестов
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium">Название сервиса</label>
                <Input
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Например: GitHub, Telegram Bot, JSONPlaceholder"
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Gemini Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500" />
                Google Gemini
                <Badge variant="default">Fast</Badge>
              </CardTitle>
              <CardDescription>
                Быстрый и надежный провайдер от Google
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => testProvider('gemini')}
                disabled={geminiLoading || !serviceName.trim()}
                className="w-full"
              >
                {geminiLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Тестируем...
                  </>
                ) : (
                  'Тестировать Gemini'
                )}
              </Button>
              {renderResult(geminiResult, geminiLoading)}
            </CardContent>
          </Card>

          {/* Hugging Face Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                GPT OSS 120B
                <Badge variant="secondary">OSS</Badge>
              </CardTitle>
              <CardDescription>
                OpenAI GPT OSS через Hugging Face Inference Providers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => testProvider('huggingface')}
                disabled={hfLoading || !serviceName.trim()}
                className="w-full"
                variant="outline"
              >
                {hfLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Тестируем...
                  </>
                ) : (
                  'Тестировать GPT OSS'
                )}
              </Button>
              {renderResult(hfResult, hfLoading)}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Настройка Hugging Face</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>Для использования GPT OSS 120B нужен токен Hugging Face:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Зайдите на <a href="https://huggingface.co/settings/tokens" target="_blank" className="text-blue-600 hover:underline">huggingface.co/settings/tokens</a></li>
                <li>Создайте новый токен с правами "Read"</li>
                <li>Откройте файл <code className="bg-muted px-1 py-0.5 rounded">.env.local</code> в корне проекта</li>
                <li>Замените значение <code className="bg-muted px-1 py-0.5 rounded">HUGGINGFACE_API_KEY</code> на ваш токен</li>
                <li>Перезапустите сервер разработки</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}