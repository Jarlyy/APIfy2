'use client'

import { useMemo, useState } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ApiTest {
  id: string
  service_name: string
  api_endpoint: string
  test_status: 'success' | 'failed' | 'pending'
  response_time: number | null
  response_status: number | null
  created_at: string
}

export default function AnalyticsDashboard({ tests }: { tests: ApiTest[] }) {
  const [selectedService, setSelectedService] = useState<string>('all')
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('all')

  // Получаем уникальные сервисы
  const services = useMemo(() => {
    const uniqueServices = Array.from(new Set(tests.map(t => t.service_name)))
    return uniqueServices.sort()
  }, [tests])

  // Получаем эндпоинты для выбранного сервиса
  const endpoints = useMemo(() => {
    if (selectedService === 'all') return []
    const serviceTests = tests.filter(t => t.service_name === selectedService)
    const uniqueEndpoints = Array.from(new Set(serviceTests.map(t => t.api_endpoint)))
    return uniqueEndpoints.sort()
  }, [tests, selectedService])

  // Фильтруем тесты по выбранному сервису и эндпоинту
  const filteredTests = useMemo(() => {
    let filtered = tests
    
    if (selectedService !== 'all') {
      filtered = filtered.filter(t => t.service_name === selectedService)
    }
    
    if (selectedEndpoint !== 'all') {
      filtered = filtered.filter(t => t.api_endpoint === selectedEndpoint)
    }
    
    return filtered
  }, [tests, selectedService, selectedEndpoint])
  // Статистика для отфильтрованных тестов
  const stats = useMemo(() => {
    const total = filteredTests.length
    const successful = filteredTests.filter(t => t.test_status === 'success').length
    const failed = filteredTests.filter(t => t.test_status === 'failed').length
    const avgResponseTime = filteredTests.reduce((acc, t) => acc + (t.response_time || 0), 0) / (total || 1)
    
    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? ((successful / total) * 100).toFixed(1) : '0',
      avgResponseTime: Math.round(avgResponseTime),
    }
  }, [filteredTests])

  // Данные для графика времени отклика
  const responseTimeData = useMemo(() => {
    return filteredTests
      .filter(t => t.response_time !== null)
      .slice(-20) // Последние 20 тестов
      .map((t, index) => ({
        name: `#${index + 1}`,
        time: t.response_time,
        service: t.service_name,
        date: new Date(t.created_at).toLocaleDateString('ru-RU'),
      }))
  }, [filteredTests])

  // Данные для круговой диаграммы статусов
  const statusData = useMemo(() => {
    return [
      { name: 'Успешно', value: stats.successful, color: '#10b981' },
      { name: 'Ошибка', value: stats.failed, color: '#ef4444' },
    ].filter(d => d.value > 0)
  }, [stats])

  // Данные для графика по сервисам (только если не выбран конкретный сервис)
  const serviceData = useMemo(() => {
    if (selectedService !== 'all') return []
    
    const serviceMap = new Map<string, { total: number; success: number; avgTime: number; times: number[] }>()
    
    filteredTests.forEach(t => {
      if (!serviceMap.has(t.service_name)) {
        serviceMap.set(t.service_name, { total: 0, success: 0, avgTime: 0, times: [] })
      }
      const service = serviceMap.get(t.service_name)!
      service.total++
      if (t.test_status === 'success') service.success++
      if (t.response_time) service.times.push(t.response_time)
    })

    return Array.from(serviceMap.entries()).map(([name, data]) => ({
      name,
      total: data.total,
      success: data.success,
      failed: data.total - data.success,
      avgTime: data.times.length > 0 
        ? Math.round(data.times.reduce((a, b) => a + b, 0) / data.times.length)
        : 0,
    }))
  }, [filteredTests, selectedService])

  // Данные для графика по времени
  const timelineData = useMemo(() => {
    const dateMap = new Map<string, { success: number; failed: number }>()
    
    filteredTests.forEach(t => {
      const date = new Date(t.created_at).toLocaleDateString('ru-RU')
      if (!dateMap.has(date)) {
        dateMap.set(date, { success: 0, failed: 0 })
      }
      const day = dateMap.get(date)!
      if (t.test_status === 'success') {
        day.success++
      } else {
        day.failed++
      }
    })

    return Array.from(dateMap.entries())
      .slice(-7) // Последние 7 дней
      .map(([date, data]) => ({
        date,
        success: data.success,
        failed: data.failed,
      }))
  }, [filteredTests])

  if (tests.length === 0) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow dark:bg-zinc-800">
        <p className="text-zinc-600 dark:text-zinc-400">
          Нет данных для отображения. Выполните несколько тестов API.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Фильтры */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
          Фильтры
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Сервис
            </label>
            <select
              value={selectedService}
              onChange={(e) => {
                setSelectedService(e.target.value)
                setSelectedEndpoint('all')
              }}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
            >
              <option value="all">Все сервисы ({tests.length} тестов)</option>
              {services.map(service => {
                const count = tests.filter(t => t.service_name === service).length
                return (
                  <option key={service} value={service}>
                    {service} ({count} тестов)
                  </option>
                )
              })}
            </select>
          </div>

          {selectedService !== 'all' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Эндпоинт
              </label>
              <select
                value={selectedEndpoint}
                onChange={(e) => setSelectedEndpoint(e.target.value)}
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
              >
                <option value="all">Все эндпоинты ({filteredTests.length} тестов)</option>
                {endpoints.map(endpoint => {
                  const count = tests.filter(t => 
                    t.service_name === selectedService && 
                    t.api_endpoint === endpoint
                  ).length
                  return (
                    <option key={endpoint} value={endpoint}>
                      {endpoint.length > 50 ? endpoint.substring(0, 50) + '...' : endpoint} ({count})
                    </option>
                  )
                })}
              </select>
            </div>
          )}
        </div>

        {(selectedService !== 'all' || selectedEndpoint !== 'all') && (
          <div className="mt-4">
            <button
              onClick={() => {
                setSelectedService('all')
                setSelectedEndpoint('all')
              }}
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              ✕ Сбросить фильтры
            </button>
          </div>
        )}
      </div>

      {/* Карточки статистики */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Всего тестов</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">{stats.total}</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Успешных</p>
          <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">{stats.successful}</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Процент успеха</p>
          <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.successRate}%</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Среднее время</p>
          <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.avgResponseTime}ms</p>
        </div>
      </div>

      {/* График времени отклика */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
          Время отклика (последние 20 тестов)
          {selectedService !== 'all' && (
            <span className="ml-2 text-sm font-normal text-zinc-600 dark:text-zinc-400">
              - {selectedService}
              {selectedEndpoint !== 'all' && ` → ${selectedEndpoint.substring(0, 30)}...`}
            </span>
          )}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={responseTimeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#f3f4f6' }}
            />
            <Legend />
            <Line type="monotone" dataKey="time" stroke="#8b5cf6" strokeWidth={2} name="Время (ms)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Круговая диаграмма статусов */}
        <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
            Распределение статусов
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* График по сервисам (только для "все сервисы") */}
        {selectedService === 'all' && (
          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
              Статистика по сервисам
            </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={serviceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Legend />
              <Bar dataKey="success" fill="#10b981" name="Успешно" />
              <Bar dataKey="failed" fill="#ef4444" name="Ошибки" />
            </BarChart>
          </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* График активности по дням */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
          Активность за последние 7 дней
          {selectedService !== 'all' && (
            <span className="ml-2 text-sm font-normal text-zinc-600 dark:text-zinc-400">
              - {selectedService}
            </span>
          )}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#f3f4f6' }}
            />
            <Legend />
            <Bar dataKey="success" stackId="a" fill="#10b981" name="Успешно" />
            <Bar dataKey="failed" stackId="a" fill="#ef4444" name="Ошибки" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Таблица производительности */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
          {selectedService === 'all' ? 'Производительность по сервисам' : `Производительность эндпоинтов - ${selectedService}`}
        </h3>
        <div className="overflow-x-auto">
          {selectedService === 'all' ? (
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Сервис
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Всего тестов
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Успешных
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Среднее время
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-800">
                {serviceData.map((service, index) => (
                  <tr key={index}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-zinc-900 dark:text-white">
                      {service.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {service.total}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {service.success} ({((service.success / service.total) * 100).toFixed(0)}%)
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {service.avgTime}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Эндпоинт
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Всего тестов
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Успешных
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Среднее время
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-800">
                {endpoints.map((endpoint) => {
                  const endpointTests = filteredTests.filter(t => t.api_endpoint === endpoint)
                  const total = endpointTests.length
                  const success = endpointTests.filter(t => t.test_status === 'success').length
                  const avgTime = endpointTests.reduce((acc, t) => acc + (t.response_time || 0), 0) / (total || 1)
                  
                  return (
                    <tr key={endpoint}>
                      <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-white">
                        <div className="max-w-md truncate" title={endpoint}>
                          {endpoint}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                        {total}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                        {success} ({total > 0 ? ((success / total) * 100).toFixed(0) : 0}%)
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                        {Math.round(avgTime)}ms
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
