'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'

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
  method: string
  result: TestResult
  timestamp: string
}

export default function HistoryPage() {
  const [history, setHistory] = useState<TestHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadHistory = () => {
      try {
        const savedHistory = localStorage.getItem('apiTestHistory')
        if (savedHistory) {
          setHistory(JSON.parse(savedHistory))
        }
      } catch (error) {
        console.error('Ошибка загрузки истории:', error)
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [])

  const clearHistory = () => {
    localStorage.removeItem('apiTestHistory')
    setHistory([])
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ru-RU')
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600 dark:text-green-400'
    if (status >= 400) return 'text-red-600 dark:text-red-400'
    return 'text-yellow-600 dark:text-yellow-400'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-zinc-600 dark:text-zinc-400">Загрузка истории...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Header />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
              История тестов
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Все выполненные тесты API (сохранено локально)
            </p>
          </div>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Очистить историю
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-800">
            <p className="text-zinc-600 dark:text-zinc-400">
              История тестов пуста. Выполните первый тест API на главной странице.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-800"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {item.method}
                    </span>
                    <h3 className="font-medium text-zinc-900 dark:text-white">
                      {item.serviceName || 'Без названия'}
                    </h3>
                  </div>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {formatDate(item.timestamp)}
                  </span>
                </div>
                
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {item.url}
                </p>
                
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-700">
                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Статус
                    </p>
                    <p className={`text-sm font-bold ${getStatusColor(item.result.status)}`}>
                      {item.result.status} {item.result.statusText}
                    </p>
                  </div>
                  
                  <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-700">
                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Время отклика
                    </p>
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {item.result.responseTime} мс
                    </p>
                  </div>
                  
                  <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-700">
                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Размер ответа
                    </p>
                    <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                      {JSON.stringify(item.result.data).length} байт
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}