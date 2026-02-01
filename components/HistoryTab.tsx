'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Trash2, RefreshCw, Clock, CheckCircle, XCircle, Brain, Zap, Play } from 'lucide-react'
import { getTestHistory, clearTestHistory, getTestStats, TestHistoryItem } from '@/lib/test-history'

export default function HistoryTab() {
  const [history, setHistory] = useState<TestHistoryItem[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [notification, setNotification] = useState<{
    message: string
    type: 'success' | 'error'
    visible: boolean
  }>({ message: '', type: 'success', visible: false })

  useEffect(() => {
    loadHistory()
    loadStats()
  }, [])

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type, visible: true })
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }))
    }, 5000) // Скрываем через 5 секунд
  }

  const loadHistory = async () => {
    setLoading(true)
    try {
      const result = await getTestHistory(100)
      if (result.success && result.data) {
        setHistory(result.data)
      } else {
        console.error('Ошибка загрузки истории:', result.error)
      }
    } catch (error) {
      console.error('Ошибка загрузки истории:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const result = await getTestStats()
      if (result.success && result.data) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error)
    }
  }

  const handleClearHistory = async () => {
    if (!confirm('Вы уверены что хотите очистить всю историю тестов? Это действие нельзя отменить.')) {
      return
    }

    setClearing(true)
    try {
      const result = await clearTestHistory()
      if (result.success) {
        setHistory([])
        setStats(null)
        loadStats()
      } else {
        showNotification('Ошибка очистки истории: ' + result.error, 'error')
      }
    } catch (error) {
      console.error('Ошибка очистки истории:', error)
      showNotification('Ошибка очистки истории', 'error')
    } finally {
      setClearing(false)
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ru-RU')
  }

  const getStatusColor = (status?: number) => {
    if (!status) return 'text-gray-600'
    if (status >= 200 && status < 300) return 'text-green-600'
    if (status >= 400) return 'text-red-600'
    return 'text-yellow-600'
  }

  const getStatusIcon = (testStatus?: string) => {
    switch (testStatus) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getProviderIcon = (provider?: string) => {
    switch (provider) {
      case 'gemini':
        return <Brain className="h-3 w-3 text-blue-500" />
      case 'huggingface':
        return <Zap className="h-3 w-3 text-purple-500" />
      default:
        return null
    }
  }

  // Функция для перехода к ручному тестированию с данными теста
  const goToManualTest = (item: TestHistoryItem) => {
    if (!item.url || !item.method) {
      showNotification('Недостаточно данных для повторного запуска теста', 'error')
      return
    }

    // Подготавливаем данные для передачи
    const testData = {
      serviceName: item.service_name || item.test_name || 'Тест из истории',
      url: item.url,
      method: item.method,
      headers: item.headers || {},
      body: item.body || '',
      authType: item.auth_type || 'none',
      authToken: item.auth_token || ''
    }

    // Сохраняем данные в localStorage для передачи между компонентами
    localStorage.setItem('pendingTestData', JSON.stringify(testData))
    
    // Переходим на вкладку тестирования
    const url = new URL(window.location.href)
    url.searchParams.set('tab', 'testing')
    window.history.pushState({}, '', url.toString())
    
    // Перезагружаем страницу чтобы данные подтянулись
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Загрузка истории...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Уведомления */}
      {notification.visible && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border animate-slide-in ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification(prev => ({ ...prev, visible: false }))}
              className="ml-2 text-current opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            История тестов
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Все выполненные API тесты и их результаты
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={loadHistory}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
          
          {history.length > 0 && (
            <Button
              onClick={handleClearHistory}
              variant="destructive"
              size="sm"
              disabled={clearing}
            >
              {clearing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Очистить историю
            </Button>
          )}
        </div>
      </div>

      {/* Статистика */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Всего тестов</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.success}</div>
              <div className="text-sm text-muted-foreground">Успешных</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.error}</div>
              <div className="text-sm text-muted-foreground">С ошибками</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.services.length}</div>
              <div className="text-sm text-muted-foreground">Сервисов</div>
            </CardContent>
          </Card>
        </div>
      )}

      {history.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">
              История тестов пуста. Выполните первый тест API на вкладке "Тестирование".
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(item.test_status)}
                    <Badge variant="outline">{item.method}</Badge>
                    <h3 className="font-medium">
                      {item.test_name || item.service_name || 'Без названия'}
                    </h3>
                    {item.ai_provider && (
                      <div className="flex items-center gap-1">
                        {getProviderIcon(item.ai_provider)}
                        <span className="text-xs text-muted-foreground">
                          {item.ai_provider === 'gemini' ? 'Gemini' : 'GPT OSS'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => goToManualTest(item)}
                      disabled={!item.url}
                      size="sm"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Повторить тест
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(item.created_at || '')}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4 font-mono">
                  {item.url}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Статус
                    </p>
                    <p className={`text-sm font-bold ${getStatusColor(item.status_code)}`}>
                      {item.status_code ? `${item.status_code}` : 'Ошибка'}
                      {item.error_message && (
                        <span className="block text-xs font-normal text-red-600 mt-1">
                          {item.error_message}
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Время отклика
                    </p>
                    <p className="text-sm font-bold text-blue-600">
                      {item.response_time ? `${item.response_time} мс` : 'Н/Д'}
                    </p>
                  </div>
                  
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Размер ответа
                    </p>
                    <p className="text-sm font-bold text-purple-600">
                      {item.response_data ? 
                        `${JSON.stringify(item.response_data).length} байт` : 
                        'Н/Д'
                      }
                    </p>
                  </div>
                </div>

                {/* AI Анализ */}
                {item.ai_analysis && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1 flex items-center gap-1">
                      <Brain className="h-3 w-3" />
                      AI Анализ
                    </p>
                    <div className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                      {item.ai_analysis}
                    </div>
                  </div>
                )}

                {/* Ответ сервера */}
                {item.response_data && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                      Показать ответ сервера
                    </summary>
                    <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-x-auto">
                      {typeof item.response_data === 'string' 
                        ? item.response_data 
                        : JSON.stringify(item.response_data, null, 2)
                      }
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}