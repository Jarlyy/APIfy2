'use client'

import { useState, useEffect } from 'react'
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

interface TestHistory {
  id: string
  serviceName: string
  url: string
  method: HttpMethod
  result: TestResult
  timestamp: string
}

export interface TestTemplate {
  name: string;
  description: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  auth_type: string;
  auth_details: string;
}

interface ApiTestFormLocalProps {
  userId: string;
  generatedTests?: TestTemplate[];
  onTestsUsed?: () => void;
}

export default function ApiTestFormLocal({ userId, generatedTests = [], onTestsUsed }: ApiTestFormLocalProps) {
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
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [corsProxyEnabled, setCorsProxyEnabledState] = useState(false)
  const [aiAnalysisEnabled, setAiAnalysisEnabledState] = useState(false)

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
        setBearerToken(data.bearerToken || '')
        setApiKey(data.apiKey || '')
        setApiKeyHeader(data.apiKeyHeader || 'X-API-Key')
        setBasicUsername(data.basicUsername || '')
        setBasicPassword(data.basicPassword || '')
      } catch (e) {
        console.error('Ошибка загрузки шаблона:', e)
      }
    }
  }, [])

  const showToastMessage = (message: string) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const applyGeneratedTest = (test: TestTemplate) => {
    setServiceName(test.name);
    setUrl(test.url);
    setMethod(test.method as HttpMethod);
    setHeaders(JSON.stringify(test.headers, null, 2));
    setBody(test.body || '');
    
    // Настройка аутентификации
    if (test.auth_type === 'bearer') {
      setAuthType('bearer');
      setBearerToken('YOUR_TOKEN_HERE');
    } else if (test.auth_type === 'api-key') {
      setAuthType('api-key');
      setApiKey('YOUR_API_KEY_HERE');
      // Попытаемся найти заголовок API ключа
      const authHeader = Object.keys(test.headers).find(h => 
        h.toLowerCase().includes('api') || h.toLowerCase().includes('key')
      );
      if (authHeader) {
        setApiKeyHeader(authHeader);
      }
    } else if (test.auth_type === 'basic') {
      setAuthType('basic');
      setBasicUsername('username');
      setBasicPassword('password');
    } else {
      setAuthType('none');
    }
    
    onTestsUsed?.();
    showToastMessage(`Тест "${test.name}" применен`);
  };

  // Сохранение в localStorage
  const saveTemplate = () => {
    const template = {
      serviceName,
      url,
      method,
      headers,
      body,
      authType,
      bearerToken,
      apiKey,
      apiKeyHeader,
      basicUsername,
      basicPassword
    }
    localStorage.setItem('apiTestTemplate', JSON.stringify(template))
    showToastMessage('Шаблон сохранен')
  }

  // Сохранение в историю
  const saveToHistory = (testResult: TestResult) => {
    const historyItem: TestHistory = {
      id: Date.now().toString(),
      serviceName,
      url,
      method,
      result: testResult,
      timestamp: new Date().toISOString()
    }

    const history = JSON.parse(localStorage.getItem('apiTestHistory') || '[]')
    history.unshift(historyItem)
    
    // Ограничиваем историю 100 записями
    if (history.length > 100) {
      history.splice(100)
    }
    
    localStorage.setItem('apiTestHistory', JSON.stringify(history))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Подготовка заголовков
      let requestHeaders: Record<string, string> = {}
      
      try {
        requestHeaders = JSON.parse(headers)
      } catch {
        requestHeaders = {}
      }

      // Добавление аутентификации
      if (authType === 'bearer' && bearerToken) {
        requestHeaders['Authorization'] = `Bearer ${bearerToken}`
      } else if (authType === 'api-key' && apiKey) {
        requestHeaders[apiKeyHeader] = apiKey
      } else if (authType === 'basic' && basicUsername && basicPassword) {
        const credentials = btoa(`${basicUsername}:${basicPassword}`)
        requestHeaders['Authorization'] = `Basic ${credentials}`
      }

      // Подготовка тела запроса
      let requestBody: string | undefined
      if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
        requestBody = body
        if (!requestHeaders['Content-Type']) {
          requestHeaders['Content-Type'] = 'application/json'
        }
      }

      const startTime = Date.now()
      
      // Применяем CORS прокси если включен
      if (corsProxyEnabled) {
        const proxyType = getCurrentProxy();
        
        if (proxyType === 'local') {
          // Используем локальный прокси через API
          const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
          const proxyResponse = await fetch(proxyUrl, {
            method,
            headers: requestHeaders,
            body: requestBody,
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

          const responseTime = Date.now() - startTime;

          const testResult: TestResult = {
            status: proxyResult.status,
            statusText: proxyResult.statusText,
            responseTime,
            data: proxyResult.data,
            headers: proxyResult.headers,
          };

          setResult(testResult);
          saveToHistory(testResult);
          showToastMessage('Тест выполнен успешно');
          return;
        }
      }

      // Обычный запрос без прокси
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: requestBody,
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      let responseData
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        try {
          responseData = await response.json()
        } catch {
          responseData = await response.text()
        }
      } else {
        responseData = await response.text()
      }

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
      saveToHistory(testResult)
      showToastMessage('Тест выполнен успешно')

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка'
      setError(errorMessage)
      showToastMessage('Ошибка при выполнении теста')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {generatedTests.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <h3 className="mb-3 text-sm font-semibold text-blue-900 dark:text-blue-100">
            🤖 Сгенерированные тесты ({generatedTests.length})
          </h3>
          <div className="space-y-2">
            {generatedTests.map((test, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-md bg-white p-3 dark:bg-blue-800/30"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {test.name}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {test.method} {test.url}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {test.description}
                  </p>
                </div>
                <button
                  onClick={() => applyGeneratedTest(test)}
                  className="ml-3 rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Использовать
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => onTestsUsed?.()}
            className="mt-3 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            Скрыть тесты
          </button>
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-800">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
          Настройка API теста
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Название сервиса
            </label>
            <input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
              placeholder="Например: GitHub API"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
              placeholder="https://api.example.com/endpoint"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              HTTP метод
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as HttpMethod)}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
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
              Аутентификация
            </label>
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value as AuthType)}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
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
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                placeholder="your-bearer-token"
              />
            </div>
          )}

          {authType === 'api-key' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Заголовок
                </label>
                <input
                  type="text"
                  value={apiKeyHeader}
                  onChange={(e) => setApiKeyHeader(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
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
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                  placeholder="your-api-key"
                />
              </div>
            </div>
          )}

          {authType === 'basic' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Имя пользователя
                </label>
                <input
                  type="text"
                  value={basicUsername}
                  onChange={(e) => setBasicUsername(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                  placeholder="username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Пароль
                </label>
                <input
                  type="password"
                  value={basicPassword}
                  onChange={(e) => setBasicPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                  placeholder="password"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-md border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-600 dark:bg-zinc-700">
            <input
              type="checkbox"
              id="aiAnalysisLocal"
              checked={aiAnalysisEnabled}
              onChange={(e) => {
                const enabled = e.target.checked
                setAiAnalysisEnabledState(enabled)
                setAiAnalysisEnabled(enabled)
              }}
              className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="aiAnalysisLocal" className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">
              <span className="font-medium">AI анализ ответов</span>
              <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                (автоматически анализировать ответы API с помощью ИИ)
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-600 dark:bg-zinc-700">
            <input
              type="checkbox"
              id="corsProxyLocal"
              checked={corsProxyEnabled}
              onChange={(e) => {
                const enabled = e.target.checked
                setCorsProxyEnabledState(enabled)
                setCorsProxyEnabled(enabled)
              }}
              className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="corsProxyLocal" className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">
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
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
              placeholder='{"Content-Type": "application/json"}'
            />
          </div>

          {['POST', 'PUT', 'PATCH'].includes(method) && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Тело запроса
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                placeholder='{"key": "value"}'
              />
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-zinc-800"
            >
              {loading ? 'Выполняется...' : 'Выполнить тест'}
            </button>
            <button
              type="button"
              onClick={saveTemplate}
              className="rounded-md bg-zinc-600 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800"
            >
              Сохранить шаблон
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">
            Ошибка: {error}
          </p>
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-800">
          <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
            Результат теста
          </h3>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-700">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                HTTP статус
              </p>
              <p className={`text-lg font-bold ${
                result.status >= 200 && result.status < 300
                  ? 'text-green-600 dark:text-green-400'
                  : result.status >= 400
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-yellow-600 dark:text-yellow-400'
              }`}>
                {result.status} {result.statusText}
              </p>
            </div>
            
            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-700">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Время отклика
              </p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {result.responseTime} мс
              </p>
            </div>
            
            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-700">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Размер ответа
              </p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {JSON.stringify(result.data).length} байт
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Заголовки ответа
              </h4>
              <pre className="mt-2 overflow-x-auto rounded-md bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
                {JSON.stringify(result.headers, null, 2)}
              </pre>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Тело ответа
              </h4>
              <pre className="mt-2 overflow-x-auto rounded-md bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
                {typeof result.data === 'string' 
                  ? result.data 
                  : JSON.stringify(result.data, null, 2)
                }
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