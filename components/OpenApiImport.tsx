'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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

export default function OpenApiImport({ userId }: { userId: string }) {
  const [specUrl, setSpecUrl] = useState('')
  const [specFile, setSpecFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [spec, setSpec] = useState<OpenApiSpec | null>(null)
  const [endpoints, setEndpoints] = useState<ParsedEndpoint[]>([])
  const [serviceName, setServiceName] = useState('')

  const supabase = createClient()

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

  const handleUrlImport = async () => {
    if (!specUrl) {
      setError('Введите URL спецификации')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(specUrl)
      if (!response.ok) {
        throw new Error('Не удалось загрузить спецификацию')
      }

      const specData: OpenApiSpec = await response.json()
      setSpec(specData)
      
      const parsedEndpoints = parseOpenApiSpec(specData)
      setEndpoints(parsedEndpoints)
      
      if (specData.info?.title) {
        setServiceName(specData.info.title)
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки спецификации')
    } finally {
      setLoading(false)
    }
  }

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSpecFile(file)
    setLoading(true)
    setError(null)

    try {
      const text = await file.text()
      const specData: OpenApiSpec = JSON.parse(text)
      setSpec(specData)
      
      const parsedEndpoints = parseOpenApiSpec(specData)
      setEndpoints(parsedEndpoints)
      
      if (specData.info?.title) {
        setServiceName(specData.info.title)
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка парсинга файла')
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

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Импорт спецификации
        </h3>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              URL спецификации OpenAPI/Swagger
            </label>
            <div className="mt-1 flex gap-2">
              <input
                type="url"
                value={specUrl}
                onChange={(e) => setSpecUrl(e.target.value)}
                className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                placeholder="https://api.example.com/openapi.json"
              />
              <button
                onClick={handleUrlImport}
                disabled={loading}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Загрузить
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-zinc-300 dark:bg-zinc-600"></div>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">или</span>
            <div className="h-px flex-1 bg-zinc-300 dark:bg-zinc-600"></div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Загрузить файл (JSON/YAML)
            </label>
            <input
              type="file"
              accept=".json,.yaml,.yml"
              onChange={handleFileImport}
              className="mt-1 block w-full text-sm text-zinc-900 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800 dark:text-white dark:file:bg-zinc-100 dark:file:text-zinc-900 dark:hover:file:bg-zinc-200"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>

      {spec && (
        <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Информация о спецификации
          </h3>

          <div className="mt-4 space-y-2">
            <div>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Название:</span>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="ml-2 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
              />
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Версия: {spec.info?.version || 'N/A'}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Описание: {spec.info?.description || 'Нет описания'}
            </p>
            {spec.servers && spec.servers.length > 0 && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Сервер: {spec.servers[0].url}
              </p>
            )}
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Найдено эндпоинтов: {endpoints.length}
            </h4>
            <div className="mt-2 max-h-96 overflow-auto">
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                <thead className="bg-zinc-50 dark:bg-zinc-900">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Метод
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Путь
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Описание
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {endpoints.map((endpoint, index) => (
                    <tr key={index}>
                      <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-zinc-900 dark:text-white">
                        <span className={`rounded px-2 py-1 text-xs font-semibold ${
                          endpoint.method === 'GET' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                          endpoint.method === 'POST' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          endpoint.method === 'DELETE' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                          'bg-zinc-100 text-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-400'
                        }`}>
                          {endpoint.method}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {endpoint.path}
                      </td>
                      <td className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {endpoint.summary || endpoint.description || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="mt-6 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? 'Сохранение...' : 'Сохранить спецификацию'}
          </button>
        </div>
      )}
    </div>
  )
}
