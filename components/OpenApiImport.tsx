'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Play, CheckCircle, XCircle, Clock, Eye, EyeOff } from 'lucide-react'
import { saveTestToHistory, TestHistoryItem } from '@/lib/test-history'
import CorsProxySettings from './CorsProxySettings'
import AiAnalysis from './AiAnalysis'
import AIProviderSelector from './AIProviderSelector'
import { applyProxy, getCurrentProxy, getCorsProxyEnabled, setCorsProxyEnabled, fetchThroughProxy } from '@/lib/cors-proxy'
import { isAiAnalysisEnabled, setAiAnalysisEnabled } from '@/lib/ai-analysis'

interface OpenApiSpec {
  openapi?: string
  swagger?: string
  info?: {
    title: string
    version: string
    description?: string
  }
  servers?: Array<{
    url: string
    description?: string
  }>
  paths?: Record<string, any>
  components?: {
    securitySchemes?: any
    schemas?: any
  }
}

interface ParsedEndpoint {
  path: string
  method: string
  summary?: string
  description?: string
  parameters?: any[]
  requestBody?: any
  responses?: any
}

interface TestResult {
  id: string
  status: 'success' | 'error' | 'running'
  response?: any
  error?: string
  duration?: number
  actualStatus?: number
}

interface ExecutableEndpoint extends ParsedEndpoint {
  id: string
  url: string
  headers: Record<string, string>
  body: string
  auth_type: string
  auth_token: string
}

export default function OpenApiImport() {
  const [specUrl, setSpecUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [spec, setSpec] = useState<OpenApiSpec | null>(null)
  const [endpoints, setEndpoints] = useState<ParsedEndpoint[]>([])
  const [serviceName, setServiceName] = useState('')
  
  // Состояния для тестирования
  const [executableEndpoints, setExecutableEndpoints] = useState<ExecutableEndpoint[]>([])
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({})
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({})
  const [runningAll, setRunningAll] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')
  const [globalAuth, setGlobalAuth] = useState({
    type: 'none' as 'none' | 'bearer' | 'api-key',
    token: '',
    header: 'Authorization'
  })
  
  // AI анализ и CORS прокси
  const [currentAIProvider, setCurrentAIProvider] = useState<'gemini' | 'huggingface'>('huggingface')
  const [aiAnalysisEnabled, setAiAnalysisEnabledState] = useState(isAiAnalysisEnabled())
  const [corsProxyEnabled, setCorsProxyEnabledState] = useState(getCorsProxyEnabled())

  // Функция для получения цвета метода HTTP
  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'POST':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'DELETE':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'PATCH':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      default:
        return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-400'
    }
  }

  const supabase = createClient()

  // Обработчики для AI и CORS
  const handleProviderChange = (provider: 'gemini' | 'huggingface') => {
    setCurrentAIProvider(provider)
    console.log('Переключен AI провайдер на:', provider)
  }

  const parseOpenApiSpec = (specData: OpenApiSpec) => {
    const parsedEndpoints: ParsedEndpoint[] = []
    
    if (!specData.paths) {
      throw new Error('Спецификация не содержит путей (paths)')
    }

    Object.entries(specData.paths).forEach(([path, pathItem]) => {
      const methods = ['get', 'post', 'put', 'delete', 'patch']
      
      methods.forEach(method => {
        if (pathItem[method]) {
          const operation = pathItem[method]
          parsedEndpoints.push({
            path,
            method: method.toUpperCase(),
            summary: operation.summary,
            description: operation.description,
            parameters: operation.parameters,
            requestBody: operation.requestBody,
            responses: operation.responses,
          })
        }
      })
    })

    return parsedEndpoints
  }

  const createExecutableEndpoints = (parsedEndpoints: ParsedEndpoint[], specData: OpenApiSpec, sourceUrl?: string) => {
    const serverUrl = specData.servers?.[0]?.url || baseUrl || ''
    console.log('createExecutableEndpoints вызвана с:', {
      serverUrl,
      baseUrl,
      specServers: specData.servers,
      endpointsCount: parsedEndpoints.length
    })
    
    return parsedEndpoints.map((endpoint, index) => {
      console.log(`Обрабатываем эндпоинт ${index}:`, {
        method: endpoint.method,
        path: endpoint.path,
        serverUrl
      })
      
      // Создаем пример тела запроса из схемы
      let exampleBody = ''
      if (endpoint.requestBody?.content?.['application/json']?.schema) {
        const schema = endpoint.requestBody.content['application/json'].schema
        exampleBody = JSON.stringify(generateExampleFromSchema(schema), null, 2)
      }

      // Создаем заголовки по умолчанию
      const headers: Record<string, string> = {}
      if (endpoint.requestBody?.content?.['application/json']) {
        headers['Content-Type'] = 'application/json'
      }

      // Правильно формируем URL
      let fullUrl = ''
      if (serverUrl && endpoint.path) {
        // Проверяем является ли serverUrl полным URL или относительным
        if (serverUrl.startsWith('http://') || serverUrl.startsWith('https://')) {
          // Полный URL - используем как есть
          const cleanServerUrl = serverUrl.replace(/\/+$/, '')
          const cleanPath = endpoint.path.replace(/^\/+/, '')
          fullUrl = `${cleanServerUrl}/${cleanPath}`
        } else {
          // Относительный URL - нужно добавить домен из исходной спецификации
          const specOrigin = new URL(sourceUrl || 'http://localhost').origin
          const cleanServerUrl = serverUrl.replace(/\/+$/, '')
          const cleanPath = endpoint.path.replace(/^\/+/, '')
          fullUrl = `${specOrigin}${cleanServerUrl}/${cleanPath}`
        }
        
        console.log(`URL формирование для эндпоинта ${index}:`, {
          originalServerUrl: serverUrl,
          originalPath: endpoint.path,
          sourceUrl,
          isAbsoluteUrl: serverUrl.startsWith('http'),
          fullUrl
        })
      } else if (endpoint.path) {
        // Если нет serverUrl, проверяем является ли path полным URL
        if (endpoint.path.startsWith('http://') || endpoint.path.startsWith('https://')) {
          fullUrl = endpoint.path
        } else {
          // Относительный path - добавляем домен
          const specOrigin = new URL(sourceUrl || 'http://localhost').origin
          fullUrl = `${specOrigin}${endpoint.path}`
        }
        console.log(`Используем только path для эндпоинта ${index}:`, fullUrl)
      } else {
        // Fallback
        fullUrl = serverUrl || ''
        console.log(`Fallback URL для эндпоинта ${index}:`, fullUrl)
      }

      console.log('Создан эндпоинт:', {
        method: endpoint.method,
        path: endpoint.path,
        serverUrl,
        fullUrl,
        index
      })

      return {
        ...endpoint,
        id: `endpoint-${index}`,
        url: fullUrl,
        headers,
        body: exampleBody,
        auth_type: 'none',
        auth_token: ''
      }
    })
  }

  const generateExampleFromSchema = (schema: any): any => {
    if (!schema) return {}
    
    if (schema.example) return schema.example
    if (schema.properties) {
      const example: any = {}
      Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
        if (prop.example !== undefined) {
          example[key] = prop.example
        } else if (prop.type === 'string') {
          example[key] = prop.enum?.[0] || 'string'
        } else if (prop.type === 'integer' || prop.type === 'number') {
          example[key] = 0
        } else if (prop.type === 'boolean') {
          example[key] = false
        } else if (prop.type === 'array') {
          example[key] = []
        } else {
          example[key] = {}
        }
      })
      return example
    }
    
    return {}
  }

  const handleUrlImport = async () => {
    if (!specUrl) {
      setError('Введите URL спецификации')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('Загружаем спецификацию с URL:', specUrl)
      const response = await fetch(specUrl)
      if (!response.ok) {
        throw new Error('Не удалось загрузить спецификацию')
      }

      const specData: OpenApiSpec = await response.json()
      console.log('Загруженная спецификация:', specData)
      console.log('Серверы в спецификации:', specData.servers)
      console.log('Базовый URL из состояния:', baseUrl)
      
      setSpec(specData)
      
      const parsedEndpoints = parseOpenApiSpec(specData)
      setEndpoints(parsedEndpoints)
      
      const executable = createExecutableEndpoints(parsedEndpoints, specData, specUrl)
      setExecutableEndpoints(executable)
      
      // Очищаем старые результаты тестов при загрузке новой спецификации
      setTestResults({})
      setExpandedResults({})
      
      if (specData.info?.title) {
        setServiceName(specData.info.title)
      }
      
      if (specData.servers?.[0]?.url) {
        console.log('Устанавливаем базовый URL из спецификации:', specData.servers[0].url)
        setBaseUrl(specData.servers[0].url)
      }
    } catch (err: any) {
      console.error('Ошибка загрузки спецификации:', err)
      setError(err.message || 'Ошибка загрузки спецификации')
      // Очищаем состояние при ошибке
      setSpec(null)
      setEndpoints([])
      setExecutableEndpoints([])
      setTestResults({})
      setExpandedResults({})
    } finally {
      setLoading(false)
    }
  }

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const text = await file.text()
      const specData: OpenApiSpec = JSON.parse(text)
      setSpec(specData)
      
      const parsedEndpoints = parseOpenApiSpec(specData)
      setEndpoints(parsedEndpoints)
      
      const executable = createExecutableEndpoints(parsedEndpoints, specData, undefined)
      setExecutableEndpoints(executable)
      
      // Очищаем старые результаты тестов при загрузке новой спецификации
      setTestResults({})
      setExpandedResults({})
      
      if (specData.info?.title) {
        setServiceName(specData.info.title)
      }
      
      if (specData.servers?.[0]?.url) {
        setBaseUrl(specData.servers[0].url)
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка парсинга файла')
      // Очищаем состояние при ошибке
      setSpec(null)
      setEndpoints([])
      setExecutableEndpoints([])
      setTestResults({})
      setExpandedResults({})
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!spec || !serviceName) {
      setError('Загрузите спецификацию и укажите название сервиса')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error: dbError } = await supabase
        .from('api_documentation')
        .upsert({
          service_name: serviceName,
          documentation_url: specUrl || null,
          endpoints: endpoints,
          auth_methods: spec.components?.securitySchemes || null,
          last_scanned: new Date().toISOString(),
        }, {
          onConflict: 'service_name'
        })

      if (dbError) throw dbError

      alert('Спецификация успешно сохранена!')
    } catch (err: any) {
      setError(err.message || 'Ошибка сохранения')
    } finally {
      setLoading(false)
    }
  }

  // Функции для тестирования эндпоинтов
  const runEndpointTest = async (endpoint: ExecutableEndpoint) => {
    console.log('Тестируем эндпоинт:', endpoint)
    
    // Валидация URL
    if (!endpoint.url) {
      const errorResult: TestResult = {
        id: endpoint.id,
        status: 'error',
        error: 'URL эндпоинта не задан'
      }
      setTestResults(prev => ({ ...prev, [endpoint.id]: errorResult }))
      return
    }

    // Проверяем что URL валидный
    try {
      new URL(endpoint.url)
    } catch (urlError) {
      console.error('Невалидный URL:', endpoint.url, urlError)
      const errorResult: TestResult = {
        id: endpoint.id,
        status: 'error',
        error: `Невалидный URL: ${endpoint.url}`
      }
      setTestResults(prev => ({ ...prev, [endpoint.id]: errorResult }))
      return
    }

    setTestResults(prev => ({
      ...prev,
      [endpoint.id]: { id: endpoint.id, status: 'running' }
    }))

    const startTime = Date.now()

    try {
      // Применяем глобальную аутентификацию
      const headers = { ...endpoint.headers }
      if (globalAuth.type === 'bearer' && globalAuth.token) {
        headers['Authorization'] = `Bearer ${globalAuth.token}`
      } else if (globalAuth.type === 'api-key' && globalAuth.token) {
        headers[globalAuth.header] = globalAuth.token
      }

      const requestOptions: RequestInit = {
        method: endpoint.method,
        headers,
        mode: 'cors',
      }

      if (endpoint.body && endpoint.method !== 'GET') {
        requestOptions.body = endpoint.body
      }

      // Выполняем запрос с учетом CORS прокси
      let proxyResult
      let actualStatus
      
      if (corsProxyEnabled) {
        // Используем fetchThroughProxy для обхода CORS
        proxyResult = await fetchThroughProxy(endpoint.url, requestOptions)
        actualStatus = proxyResult.status
      } else {
        // Прямой запрос без прокси
        const response = await fetch(endpoint.url, requestOptions)
        actualStatus = response.status
        
        try {
          const contentType = response.headers.get('content-type')
          if (contentType?.includes('application/json')) {
            proxyResult = { data: await response.json(), status: response.status }
          } else {
            proxyResult = { data: await response.text(), status: response.status }
          }
        } catch (parseError) {
          proxyResult = { data: `Ошибка парсинга: ${parseError}`, status: response.status }
        }
      }

      const duration = Date.now() - startTime
      
      const result: TestResult = {
        id: endpoint.id,
        status: actualStatus >= 200 && actualStatus < 300 ? 'success' : 'error',
        response: proxyResult.data,
        duration,
        actualStatus
      }

      setTestResults(prev => ({ ...prev, [endpoint.id]: result }))

      // Сохраняем в историю
      const historyItem: TestHistoryItem = {
        service_name: serviceName,
        test_name: endpoint.summary || `${endpoint.method} ${endpoint.path}`,
        url: endpoint.url,
        method: endpoint.method,
        headers: endpoint.headers,
        body: endpoint.body,
        auth_type: globalAuth.type,
        auth_token: globalAuth.token,
        status_code: actualStatus,
        response_data: proxyResult.data,
        response_time: duration,
        test_status: result.status === 'success' ? 'success' : 'error',
        ai_provider: currentAIProvider
      }

      saveTestToHistory(historyItem).catch(error => {
        console.error('Ошибка сохранения в историю:', error)
      })

    } catch (error) {
      const duration = Date.now() - startTime
      let errorMessage = 'Неизвестная ошибка'
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'Ошибка сети: CORS блокировка или сервер недоступен'
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      const result: TestResult = {
        id: endpoint.id,
        status: 'error',
        error: errorMessage,
        duration
      }

      setTestResults(prev => ({ ...prev, [endpoint.id]: result }))

      // Сохраняем ошибку в историю
      const historyItem: TestHistoryItem = {
        service_name: serviceName,
        test_name: endpoint.summary || `${endpoint.method} ${endpoint.path}`,
        url: endpoint.url,
        method: endpoint.method,
        headers: endpoint.headers,
        body: endpoint.body,
        auth_type: globalAuth.type,
        auth_token: globalAuth.token,
        error_message: errorMessage,
        response_time: duration,
        test_status: 'error',
        ai_provider: currentAIProvider
      }

      saveTestToHistory(historyItem).catch(error => {
        console.error('Ошибка сохранения в историю:', error)
      })
    }
  }

  const runAllTests = async () => {
    setRunningAll(true)
    for (const endpoint of executableEndpoints) {
      await runEndpointTest(endpoint)
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    setRunningAll(false)
  }

  const getStatusIcon = (result?: TestResult) => {
    if (!result) return null
    
    switch (result.status) {
      case 'running':
        return <Clock className="h-4 w-4 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Импорт спецификации</CardTitle>
          <CardDescription>
            Загрузите OpenAPI/Swagger спецификацию по URL или из файла
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              URL спецификации OpenAPI/Swagger
            </label>
            <div className="flex gap-2">
              <Input
                type="url"
                value={specUrl}
                onChange={(e) => setSpecUrl(e.target.value)}
                placeholder="https://api.example.com/openapi.json"
                className="flex-1"
              />
              <Button
                onClick={handleUrlImport}
                disabled={loading}
              >
                Загрузить
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border"></div>
            <span className="text-sm text-muted-foreground">или</span>
            <div className="h-px flex-1 bg-border"></div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Загрузить файл (JSON/YAML)
            </label>
            <input
              type="file"
              accept=".json,.yaml,.yml"
              onChange={handleFileImport}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/15 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {spec && (
        <Card>
          <CardHeader>
            <CardTitle>Информация о спецификации</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Название сервиса</label>
                <Input
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Базовый URL</label>
                <Input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.example.com"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Версия:</span> {spec.info?.version || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Эндпоинтов:</span> {endpoints.length}
              </div>
            </div>
            
            {spec.info?.description && (
              <div>
                <span className="text-sm font-medium">Описание:</span>
                <p className="text-sm text-muted-foreground mt-1">{spec.info.description}</p>
              </div>
            )}

            {/* Глобальные настройки аутентификации */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3">Настройки тестирования</h4>
              
              {/* AI провайдер */}
              <div className="mb-4">
                <AIProviderSelector 
                  onProviderChange={handleProviderChange}
                />
              </div>
              
              {/* AI анализ */}
              <div className="flex items-start gap-3 mb-4">
                <input
                  type="checkbox"
                  id="aiAnalysisOpenApi"
                  checked={aiAnalysisEnabled}
                  onChange={(e) => {
                    const enabled = e.target.checked
                    setAiAnalysisEnabledState(enabled)
                    setAiAnalysisEnabled(enabled)
                  }}
                  className="h-4 w-4 rounded border-input mt-0.5"
                />
                <label htmlFor="aiAnalysisOpenApi" className="flex-1 text-sm">
                  <span className="font-medium">AI анализ ответов</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({currentAIProvider === 'gemini' ? 'Gemini' : 'GPT OSS 120B'})
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Автоматический анализ ответов API с помощью ИИ
                  </p>
                </label>
              </div>
              
              {/* CORS прокси */}
              <div className="flex items-start gap-3 mb-4">
                <input
                  type="checkbox"
                  id="corsProxyOpenApi"
                  checked={corsProxyEnabled}
                  onChange={(e) => {
                    const enabled = e.target.checked
                    setCorsProxyEnabledState(enabled)
                    setCorsProxyEnabled(enabled)
                  }}
                  className="h-4 w-4 rounded border-input mt-0.5"
                />
                <label htmlFor="corsProxyOpenApi" className="flex-1 text-sm">
                  <span className="font-medium">Обход CORS блокировки</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Использовать локальный прокси для обхода CORS ограничений
                  </p>
                </label>
              </div>
              
              {corsProxyEnabled && (
                <div className="ml-4 mb-4">
                  <CorsProxySettings />
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Аутентификация</label>
                  <select
                    value={globalAuth.type}
                    onChange={(e) => setGlobalAuth(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full h-9 px-3 border border-input bg-background rounded-md text-sm mt-1"
                  >
                    <option value="none">Без аутентификации</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="api-key">API Key</option>
                  </select>
                </div>
                
                {globalAuth.type === 'api-key' && (
                  <div>
                    <label className="text-sm font-medium">Заголовок</label>
                    <Input
                      value={globalAuth.header}
                      onChange={(e) => setGlobalAuth(prev => ({ ...prev, header: e.target.value }))}
                      placeholder="X-API-Key"
                      className="mt-1"
                    />
                  </div>
                )}
                
                {globalAuth.type !== 'none' && (
                  <div>
                    <label className="text-sm font-medium">Токен</label>
                    <Input
                      type="password"
                      value={globalAuth.token}
                      onChange={(e) => setGlobalAuth(prev => ({ ...prev, token: e.target.value }))}
                      placeholder="Введите токен"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Найденные эндпоинты</h4>
                {executableEndpoints.length > 0 && (
                  <Button
                    onClick={runAllTests}
                    disabled={runningAll}
                    size="sm"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    {runningAll ? 'Тестируем все...' : 'Тестировать все'}
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                {executableEndpoints.map((endpoint, index) => {
                  const result = testResults[endpoint.id]
                  const isExpanded = expandedResults[endpoint.id]
                  
                  return (
                    <div key={index} className="border rounded-lg">
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getMethodColor(endpoint.method)}`}>
                              {endpoint.method}
                            </span>
                            <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                              {endpoint.path}
                            </code>
                            <span className="text-sm text-muted-foreground">
                              {endpoint.summary || endpoint.description || '-'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {/* Статус и время */}
                            <div className="flex items-center gap-2">
                              {getStatusIcon(result)}
                              {result && (
                                <div className="text-xs">
                                  {result.actualStatus && (
                                    <Badge 
                                      variant={result.status === 'success' ? 'default' : 'destructive'}
                                      className="text-xs"
                                    >
                                      {result.actualStatus}
                                    </Badge>
                                  )}
                                  {result.duration && (
                                    <span className="ml-1 text-muted-foreground">
                                      {result.duration}ms
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Кнопки */}
                            <div className="flex items-center gap-2">
                              {result && (result.response || result.error) && (
                                <Button
                                  onClick={() => setExpandedResults(prev => ({
                                    ...prev,
                                    [endpoint.id]: !prev[endpoint.id]
                                  }))}
                                  size="sm"
                                  variant={isExpanded ? "secondary" : "default"}
                                >
                                  {isExpanded ? (
                                    <>
                                      <EyeOff className="h-3 w-3 mr-1" />
                                      Скрыть
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-3 w-3 mr-1" />
                                      Результат
                                    </>
                                  )}
                                </Button>
                              )}
                              
                              <Button
                                onClick={() => runEndpointTest(endpoint)}
                                disabled={result?.status === 'running'}
                                size="sm"
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Тест
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Раскрывающийся результат */}
                        {isExpanded && result && (result.response || result.error) && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="space-y-3">
                              {/* Заголовок результата */}
                              <div className="flex items-center gap-2">
                                <h5 className="font-medium text-sm">Результат теста</h5>
                                {result.actualStatus && (
                                  <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                                    HTTP {result.actualStatus}
                                  </Badge>
                                )}
                                {result.duration && (
                                  <Badge variant="outline">
                                    {result.duration}ms
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Ошибка */}
                              {result.error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                  <h6 className="font-medium text-red-900 dark:text-red-100 text-sm mb-2">
                                    Ошибка
                                  </h6>
                                  <p className="text-sm text-red-800 dark:text-red-200">
                                    {result.error}
                                  </p>
                                </div>
                              )}
                              
                              {/* Ответ */}
                              {result.response && (
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                                  <h6 className="font-medium text-green-900 dark:text-green-100 text-sm mb-2">
                                    Ответ сервера
                                  </h6>
                                  <pre className="text-xs bg-white dark:bg-zinc-800 p-3 rounded border overflow-x-auto">
                                    {typeof result.response === 'string' 
                                      ? result.response 
                                      : JSON.stringify(result.response, null, 2)
                                    }
                                  </pre>
                                </div>
                              )}
                              
                              {/* AI Анализ */}
                              {result.response && aiAnalysisEnabled && (
                                <AiAnalysis
                                  testName={endpoint.summary || `${endpoint.method} ${endpoint.path}`}
                                  actualResponse={result.response}
                                  expectedResponse={undefined}
                                  apiUrl={endpoint.url}
                                  httpMethod={endpoint.method}
                                  httpStatus={result.actualStatus}
                                  aiProvider={currentAIProvider}
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Сохранение...' : 'Сохранить спецификацию'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
