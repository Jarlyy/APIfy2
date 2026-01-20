'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Toast from './Toast'
import CorsProxySettings from './CorsProxySettings'
import AiAnalysis from './AiAnalysis'
import { applyProxy, getCurrentProxy, getCorsProxyEnabled, setCorsProxyEnabled } from '@/lib/cors-proxy'
import { isAiAnalysisEnabled, setAiAnalysisEnabled } from '@/lib/ai-analysis'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
type AuthType = 'none' | 'bearer' | 'api-key' | 'basic'

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
  const [authType, setAuthType] = useState<AuthType>('none')
  const [bearerToken, setBearerToken] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [apiKeyHeader, setApiKeyHeader] = useState('X-API-Key')
  const [basicUsername, setBasicUsername] = useState('')
  const [basicPassword, setBasicPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [favoriteName, setFavoriteName] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [corsProxyEnabled, setCorsProxyEnabledState] = useState(false)
  const [aiAnalysisEnabled, setAiAnalysisEnabledState] = useState(false)

  const supabase = createClient()

  // Загрузка настройки CORS proxy
  useEffect(() => {
    setCorsProxyEnabledState(getCorsProxyEnabled())
  }, [])

  // Загрузка настройки AI анализа
  useEffect(() => {
    setAiAnalysisEnabledState(isAiAnalysisEnabled())
  }, [])

  // Загрузка шаблона из localStorage
  useEffect(() => {
    const template = localStorage.getItem('apiTestTemplate')
    if (template) {
      try {
        const data = JSON.parse(template)
        setServiceName(data.serviceName || '')
        setUrl(data.url || '')
        setMethod(data.method || 'GET')
        setHeaders(data.headers || '{}')
        setBody(data.body || '')
        setAuthType(data.authType || 'none')
        if (data.authData) {
          setBearerToken(data.authData.bearerToken || '')
          setApiKey(data.authData.apiKey || '')
          setApiKeyHeader(data.authData.apiKeyHeader || 'X-API-Key')
          setBasicUsername(data.authData.basicUsername || '')
          setBasicPassword(data.authData.basicPassword || '')
        }
        localStorage.removeItem('apiTestTemplate')
      } catch (err) {
        console.error('Error loading template:', err)
      }
    }
  }, [])

  const handleSaveToFavorites = async () => {
    if (!favoriteName.trim()) {
      setError('Введите название шаблона')
      return
    }

    try {
      const authData: any = {}
      if (authType === 'bearer') authData.bearerToken = bearerToken
      if (authType === 'api-key') {
        authData.apiKey = apiKey
        authData.apiKeyHeader = apiKeyHeader
      }
      if (authType === 'basic') {
        authData.basicUsername = basicUsername
        authData.basicPassword = basicPassword
      }

      const { error: saveError } = await supabase.from('favorites').insert({
        user_id: userId,
        name: favoriteName,
        service_name: serviceName,
        url,
        method,
        headers: JSON.parse(headers),
        body: body || null,
        auth_type: authType,
        auth_data: authData,
      })

      if (saveError) throw saveError

      setShowSaveModal(false)
      setFavoriteName('')
      setError(null)
      
      // Показываем уведомление об успехе
      setToastMessage('Шаблон сохранен в избранное!')
      setShowToast(true)
    } catch (err: any) {
      setError('Ошибка сохранения: ' + err.message)
    }
  }

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

      // Добавляем аутентификацию
      if (authType === 'bearer' && bearerToken) {
        parsedHeaders['Authorization'] = `Bearer ${bearerToken}`
      } else if (authType === 'api-key' && apiKey) {
        parsedHeaders[apiKeyHeader] = apiKey
      } else if (authType === 'basic' && basicUsername && basicPassword) {
        const credentials = btoa(`${basicUsername}:${basicPassword}`)
        parsedHeaders['Authorization'] = `Basic ${credentials}`
      }

      // Применяем CORS прокси если включен
      if (corsProxyEnabled) {
        const proxyType = getCurrentProxy();
        
        if (proxyType === 'local') {
          // Используем локальный прокси через API
          const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
          const proxyResponse = await fetch(proxyUrl, {
            method,
            headers: {
              'Content-Type': 'application/json',
              ...parsedHeaders,
            },
            body: method !== 'GET' && body ? body : undefined,
          });

          let proxyResult;
          try {
            proxyResult = await proxyResponse.json();
          } catch (parseError) {
            throw new Error(`Ошибка парсинга ответа прокси: ${parseError}`);
          }
          
          if (!proxyResponse.ok && proxyResult.error) {
            throw new Error(proxyResult.error);
          }

          const testResult: TestResult = {
            status: proxyResult.status,
            statusText: proxyResult.statusText,
            responseTime: Math.round(endTime - startTime),
            data: proxyResult.data,
            headers: proxyResult.headers,
          };

          setResult(testResult);

          // Сохраняем результат в базу данных
          const { error: dbError } = await supabase.from('api_tests').insert({
            user_id: userId,
            service_name: serviceName,
            api_endpoint: url,
            test_status: proxyResult.status >= 200 && proxyResult.status < 300 ? 'success' : 'failed',
            response_time: Math.round(endTime - startTime),
            response_body: JSON.stringify(proxyResult.data),
            response_status: proxyResult.status,
          });

          if (dbError) {
            console.error('Ошибка сохранения в БД:', dbError);
          }

          return;
        }
      }

      // Обычный запрос без прокси
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
              Тип аутентификации
            </label>
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value as AuthType)}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
            >
              <option value="none">Без аутентификации</option>
              <option value="bearer">Bearer Token</option>
              <option value="api-key">API Key</option>
              <option value="basic">Basic Auth</option>
            </select>
          </div>

          {authType === 'bearer' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Bearer Token
              </label>
              <input
                type="password"
                value={bearerToken}
                onChange={(e) => setBearerToken(e.target.value)}
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                placeholder="your-token-here"
              />
            </div>
          )}

          {authType === 'api-key' && (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Название заголовка
                </label>
                <input
                  type="text"
                  value={apiKeyHeader}
                  onChange={(e) => setApiKeyHeader(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                  placeholder="X-API-Key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                  placeholder="your-api-key"
                />
              </div>
            </>
          )}

          {authType === 'basic' && (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Username
                </label>
                <input
                  type="text"
                  value={basicUsername}
                  onChange={(e) => setBasicUsername(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                  placeholder="username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <input
                  type="password"
                  value={basicPassword}
                  onChange={(e) => setBasicPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                  placeholder="password"
                />
              </div>
            </>
          )}

          <div className="flex items-center gap-2 rounded-md border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-600 dark:bg-zinc-700">
            <input
              type="checkbox"
              id="aiAnalysis"
              checked={aiAnalysisEnabled}
              onChange={(e) => {
                const enabled = e.target.checked
                setAiAnalysisEnabledState(enabled)
                setAiAnalysisEnabled(enabled)
              }}
              className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="aiAnalysis" className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">
              <span className="font-medium">AI анализ ответов</span>
              <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                (автоматически анализировать ответы API с помощью ИИ)
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-600 dark:bg-zinc-700">
            <input
              type="checkbox"
              id="corsProxy"
              checked={corsProxyEnabled}
              onChange={(e) => {
                const enabled = e.target.checked
                setCorsProxyEnabledState(enabled)
                setCorsProxyEnabled(enabled)
              }}
              className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="corsProxy" className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">
              <span className="font-medium">Обход CORS блокировки</span>
              <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                (использовать прокси-сервис для обхода ограничений браузера)
              </span>
            </label>
          </div>

          {corsProxyEnabled && (
            <CorsProxySettings />
          )}

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

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? 'Выполнение...' : 'Выполнить запрос'}
            </button>
            <button
              type="button"
              onClick={() => setShowSaveModal(true)}
              disabled={!serviceName || !url}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
              title="Сохранить в избранное"
            >
              ⭐ Сохранить
            </button>
          </div>
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

            {/* AI Анализ ответа */}
            <AiAnalysis
              actualResponse={result.data}
              testName={serviceName}
              apiUrl={url}
              httpMethod={method}
              httpStatus={result.status}
            />
          </div>
        </div>
      )}

      {/* Модальное окно сохранения в избранное */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-800">
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
              Сохранить в избранное
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Название шаблона
              </label>
              <input
                type="text"
                value={favoriteName}
                onChange={(e) => setFavoriteName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveToFavorites()
                  }
                }}
                placeholder="Например: GitHub API - Get User"
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                autoFocus
              />
            </div>

            <div className="mb-4 rounded-md bg-zinc-50 p-3 dark:bg-zinc-900">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                <strong>Сервис:</strong> {serviceName}
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                <strong>URL:</strong> {url.substring(0, 50)}{url.length > 50 ? '...' : ''}
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                <strong>Метод:</strong> {method}
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSaveToFavorites}
                disabled={!favoriteName.trim()}
                className="flex-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Сохранить
              </button>
              <button
                onClick={() => {
                  setShowSaveModal(false)
                  setFavoriteName('')
                  setError(null)
                }}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast уведомление */}
      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  )
}
