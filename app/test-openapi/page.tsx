'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, FileText, Download, CheckCircle } from 'lucide-react'

export default function TestOpenApiPage() {
  const [selectedSpec, setSelectedSpec] = useState<string | null>(null)

  const testSpecs = [
    {
      id: 'petstore',
      name: 'Swagger Petstore',
      description: 'Классический пример OpenAPI 3.0 спецификации',
      url: '/test-specs/petstore-openapi.json',
      endpoints: 8,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      features: ['Параметры пути', 'Request Body', 'Схемы данных', 'Аутентификация']
    },
    {
      id: 'github',
      name: 'GitHub API (Simplified)',
      description: 'Упрощенная версия GitHub REST API',
      url: '/test-specs/github-api-simple.json',
      endpoints: 6,
      methods: ['GET', 'POST'],
      features: ['Query параметры', 'Path параметры', 'Массивы данных', 'Bearer токены']
    }
  ]

  const publicSpecs = [
    {
      name: 'JSONPlaceholder',
      url: 'https://jsonplaceholder.typicode.com/openapi.json',
      description: 'Fake REST API для тестирования'
    },
    {
      name: 'Swagger Petstore (Live)',
      url: 'https://petstore3.swagger.io/api/v3/openapi.json',
      description: 'Живая версия Petstore API'
    },
    {
      name: 'OpenWeatherMap',
      url: 'https://api.openweathermap.org/data/2.5/openapi.json',
      description: 'API погодных данных (может требовать ключ)'
    }
  ]

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('URL скопирован в буфер обмена!')
  }

  const downloadSpec = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const data = await response.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const downloadUrl = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      alert('Ошибка загрузки файла: ' + error)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Тестирование импорта OpenAPI</h1>
          <p className="text-muted-foreground mt-2">
            Протестируйте импорт OpenAPI спецификаций с готовыми примерами
          </p>
        </div>

        {/* Инструкции */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Как тестировать
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <strong>Перейдите на страницу импорта:</strong>
                  <a href="/import" className="ml-2 text-blue-600 hover:underline inline-flex items-center gap-1">
                    /import <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <strong>Выберите способ импорта:</strong>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• <strong>URL:</strong> Скопируйте URL спецификации из таблиц ниже</li>
                    <li>• <strong>Файл:</strong> Скачайте JSON файл и загрузите его</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                <div>
                  <strong>Проверьте результат:</strong> Система покажет найденные эндпоинты и сохранит спецификацию
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Локальные тестовые спецификации */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Тестовые спецификации</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {testSpecs.map((spec) => (
              <Card key={spec.id} className="relative">
                <CardHeader>
                  <CardTitle className="text-lg">{spec.name}</CardTitle>
                  <CardDescription>{spec.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">{spec.endpoints} эндпоинтов</Badge>
                    <div className="flex gap-1">
                      {spec.methods.map(method => (
                        <Badge key={method} variant="secondary" className="text-xs">
                          {method}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Особенности:</p>
                    <div className="flex flex-wrap gap-1">
                      {spec.features.map(feature => (
                        <span key={feature} className="text-xs bg-muted px-2 py-1 rounded">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong>URL для импорта:</strong>
                      <code className="block bg-muted p-2 rounded text-xs mt-1 break-all">
                        {window.location.origin}{spec.url}
                      </code>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(`${window.location.origin}${spec.url}`)}
                      >
                        Копировать URL
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadSpec(spec.url, `${spec.id}-openapi.json`)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Скачать
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Публичные API спецификации */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Публичные API спецификации</h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">API</th>
                      <th className="text-left p-4 font-medium">Описание</th>
                      <th className="text-left p-4 font-medium">URL</th>
                      <th className="text-left p-4 font-medium">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {publicSpecs.map((spec, index) => (
                      <tr key={index} className="border-b last:border-b-0">
                        <td className="p-4 font-medium">{spec.name}</td>
                        <td className="p-4 text-sm text-muted-foreground">{spec.description}</td>
                        <td className="p-4">
                          <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                            {spec.url}
                          </code>
                        </td>
                        <td className="p-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(spec.url)}
                          >
                            Копировать
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Советы по тестированию */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Советы по тестированию
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <strong>✅ Что проверить:</strong>
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• Корректность парсинга спецификации</li>
                  <li>• Количество найденных эндпоинтов</li>
                  <li>• Правильность извлечения методов HTTP</li>
                  <li>• Сохранение в базу данных Supabase</li>
                  <li>• Обработка ошибок (неверный URL, невалидный JSON)</li>
                </ul>
              </div>
              
              <div>
                <strong>🔍 Возможные проблемы:</strong>
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• CORS ошибки для внешних URL (используйте локальные файлы)</li>
                  <li>• Большие спецификации могут загружаться медленно</li>
                  <li>• Некоторые публичные API могут быть недоступны</li>
                </ul>
              </div>

              <div>
                <strong>💡 Рекомендации:</strong>
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• Начните с локальных тестовых файлов</li>
                  <li>• Проверьте консоль браузера на ошибки</li>
                  <li>• Убедитесь что вы авторизованы в системе</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}