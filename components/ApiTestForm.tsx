'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

interface TestResult {
  status: number
  statusText: string
  responseTime: number
  data: any
  headers: Record<string, string>
}

export default function ApiTestForm({ userId }: { userId: string }) {
  const [serviceName, setServiceName] = useState('')
  const [url, setUrl] = useState('')
  const [method, setMethod] = useState<HttpMethod>('GET')
  const [headers, setHeaders] = useState('{}')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)

    try {
      // Парсим заголовки
      let parsedHeaders: Record<string, string> = {}
      try {
        parsedHeaders = JSON.parse(headers)
      } catch {
        throw new Error('Неверный формат заголовков (должен быть JSON)')
      }

      // Выполняем запрос
      const startTime = performance.now()
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...parsedHeaders,
        },
        body: method !== 'GET' && body ? body : undefined,
      })
      const endTime = performance.now()
      const responseTime = Math.round(endTime - startTime)

      // Получаем данные ответа
      const contentType = response.headers.get('content-type')
      let responseData
      if (contentType?.includes('application/json')) {
        responseData = await response.json()
      } else {
        responseData = await response.text()
      }

      // Собираем заголовки ответа
      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      const testResult: TestResult = {
        status: response.status,
        statusText: response.statusText,
        responseTime,
        data: responseData,
        headers: responseHeaders,
      }

      setResult(testResult)

      // Сохраняем результат в базу данных
      const { error: dbError } = await supabase.from('api_tests').insert({
        user_id: userId,
        service_name: serviceName,
        api_endpoint: url,
        test_status: response.ok ? 'success' : 'failed',
        response_time: responseTime,
        response_body: JSON.stringify(responseData),
        response_status: response.status,
      })

      if (dbError) {
        console.error('Ошибка сохранения в БД:', dbError)
      }

      // Сохраняем историю запроса
      const { error: historyError } = await supabase.from('test_history').insert({
        test_id: userId, // Временно используем userId, нужно будет получить ID теста
        user_id: userId,
        request_params: body ? JSON.parse(body) : null,
        request_headers: parsedHeaders,
        request_method: method,
      })

      if (historyError) {
        console.error('Ошибка сохранения истории:', historyError)
      }

    } catch (err: any) {
      setError(err.message || 'Ошибка выполнения запроса')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleTest} className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Название сервиса
            </label>
            <input
              type="text"
              required
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
              placeholder="Например: JSONPlaceholder"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              URL API
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
              placeholder="https://api.example.com/endpoint"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              HTTP Метод
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as HttpMethod)}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Заголовки (JSON)
            </label>
            <textarea
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
              placeholder='{"Authorization": "Bearer token"}'
            />
          </div>

          {method !== 'GET' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Тело запроса (JSON)
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                placeholder='{"key": "value"}'
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? 'Выполнение...' : 'Выполнить запрос'}
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-800 dark:text-red-400">Ошибка</p>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {result && (
        <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Результат</h3>
          
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className={`rounded-full px-3 py-1 text-sm font-medium ${
                result.status >= 200 && result.status < 300
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {result.status} {result.statusText}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Время отклика: {result.responseTime}ms
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Заголовки ответа</h4>
              <pre className="mt-2 overflow-auto rounded-md bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
                {JSON.stringify(result.headers, null, 2)}
              </pre>
            </div>

            <div>
              <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Тело ответа</h4>
              <pre className="mt-2 overflow-auto rounded-md bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
                {typeof result.data === 'string' 
                  ? result.data 
                  : JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
