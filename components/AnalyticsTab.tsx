'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Activity, CheckCircle, XCircle, Clock } from 'lucide-react'
import { getTestHistory, getTestStats, TestHistoryItem } from '@/lib/test-history'

export default function AnalyticsTab() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<{
    total: number
    success: number
    error: number
    pending: number
    services: string[]
  } | null>(null)
  const [history, setHistory] = useState<TestHistoryItem[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [statsResult, historyResult] = await Promise.all([
        getTestStats(),
        getTestHistory(200, 0),
      ])

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data)
      }

      if (historyResult.success && historyResult.data) {
        setHistory(historyResult.data)
      }
      setLoading(false)
    }

    load()
  }, [])

  const avgResponse = useMemo(() => {
    const values = history.map(h => h.response_time).filter((v): v is number => typeof v === 'number')
    if (!values.length) return 0
    return Math.round(values.reduce((acc, v) => acc + v, 0) / values.length)
  }, [history])

  const topServices = useMemo(() => {
    const counter = new Map<string, number>()
    history.forEach(item => {
      if (!item.service_name) return
      counter.set(item.service_name, (counter.get(item.service_name) || 0) + 1)
    })

    return [...counter.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [history])

  if (loading) {
    return (
      <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
        <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
        Загрузка аналитики...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Activity className="h-4 w-4" /> Всего тестов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-green-600">
              <CheckCircle className="h-4 w-4" /> Успешные
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.success ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-red-600">
              <XCircle className="h-4 w-4" /> Ошибки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.error ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-blue-600">
              <Clock className="h-4 w-4" /> Средний отклик
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{avgResponse} мс</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Топ сервисов по количеству тестов</CardTitle>
        </CardHeader>
        <CardContent>
          {topServices.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Пока нет данных для аналитики.</p>
          ) : (
            <div className="space-y-3">
              {topServices.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span className="font-medium">{name}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
