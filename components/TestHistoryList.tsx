'use client'

import { useState } from 'react'

interface ApiTest {
  id: string
  service_name: string
  api_endpoint: string
  test_status: 'success' | 'failed' | 'pending'
  response_time: number | null
  response_status: number | null
  response_body: string | null
  created_at: string
}

export default function TestHistoryList({ tests }: { tests: ApiTest[] }) {
  const [selectedTest, setSelectedTest] = useState<ApiTest | null>(null)

  if (tests.length === 0) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow dark:bg-zinc-800">
        <p className="text-zinc-600 dark:text-zinc-400">
          У вас пока нет истории тестов
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-zinc-800">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Сервис
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Endpoint
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Время отклика
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Дата
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-800">
            {tests.map((test) => (
              <tr key={test.id}>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-zinc-900 dark:text-white">
                  {test.service_name}
                </td>
                <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                  <div className="max-w-xs truncate">{test.api_endpoint}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    test.test_status === 'success'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : test.test_status === 'failed'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}>
                    {test.response_status || 'N/A'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {test.response_time ? `${test.response_time}ms` : 'N/A'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {new Date(test.created_at).toLocaleString('ru-RU')}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <button
                    onClick={() => setSelectedTest(test)}
                    className="text-zinc-900 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
                  >
                    Детали
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Детали теста
              </h3>
              <button
                onClick={() => setSelectedTest(null)}
                className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Сервис</p>
                <p className="mt-1 text-sm text-zinc-900 dark:text-white">{selectedTest.service_name}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Endpoint</p>
                <p className="mt-1 text-sm text-zinc-900 dark:text-white">{selectedTest.api_endpoint}</p>
              </div>

              <div className="flex gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Статус</p>
                  <p className="mt-1 text-sm text-zinc-900 dark:text-white">{selectedTest.response_status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Время отклика</p>
                  <p className="mt-1 text-sm text-zinc-900 dark:text-white">{selectedTest.response_time}ms</p>
                </div>
              </div>

              {selectedTest.response_body && (
                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Тело ответа</p>
                  <pre className="mt-2 overflow-auto rounded-md bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
                    {JSON.stringify(JSON.parse(selectedTest.response_body), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
