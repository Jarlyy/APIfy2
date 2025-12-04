'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Favorite {
  id: string
  name: string
  service_name: string
  url: string
  method: string
  headers: any
  body: string | null
  auth_type: string | null
  auth_data: any
  created_at: string
}

export default function FavoritesList({ favorites, userId }: { favorites: Favorite[]; userId: string }) {
  const [selectedFavorite, setSelectedFavorite] = useState<Favorite | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот шаблон?')) return

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Ошибка удаления: ' + error.message)
    } else {
      router.refresh()
    }
  }

  const handleUse = (favorite: Favorite) => {
    // Сохраняем данные в localStorage для использования на странице тестирования
    localStorage.setItem('apiTestTemplate', JSON.stringify({
      serviceName: favorite.service_name,
      url: favorite.url,
      method: favorite.method,
      headers: JSON.stringify(favorite.headers || {}),
      body: favorite.body || '',
      authType: favorite.auth_type || 'none',
      authData: favorite.auth_data || {},
    }))
    router.push('/dashboard')
  }

  if (favorites.length === 0) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow dark:bg-zinc-800">
        <p className="text-zinc-600 dark:text-zinc-400">
          У вас пока нет сохраненных шаблонов
        </p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
          Сохраните запрос на странице тестирования, чтобы быстро использовать его позже
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {favorites.map((favorite) => (
          <div
            key={favorite.id}
            className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg dark:bg-zinc-800"
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {favorite.name}
              </h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {favorite.service_name}
              </p>
            </div>

            <div className="mb-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className={`rounded px-2 py-1 text-xs font-semibold ${
                  favorite.method === 'GET' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                  favorite.method === 'POST' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                  favorite.method === 'PUT' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                  favorite.method === 'DELETE' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                  'bg-zinc-100 text-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-400'
                }`}>
                  {favorite.method}
                </span>
                {favorite.auth_type && favorite.auth_type !== 'none' && (
                  <span className="rounded bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                    🔒 {favorite.auth_type}
                  </span>
                )}
              </div>
              <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">
                {favorite.url}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleUse(favorite)}
                className="flex-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Использовать
              </button>
              <button
                onClick={() => setSelectedFavorite(favorite)}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Детали
              </button>
              <button
                onClick={() => handleDelete(favorite.id)}
                className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedFavorite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {selectedFavorite.name}
              </h3>
              <button
                onClick={() => setSelectedFavorite(null)}
                className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Сервис</p>
                <p className="mt-1 text-sm text-zinc-900 dark:text-white">{selectedFavorite.service_name}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">URL</p>
                <p className="mt-1 text-sm text-zinc-900 dark:text-white">{selectedFavorite.url}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Метод</p>
                <p className="mt-1 text-sm text-zinc-900 dark:text-white">{selectedFavorite.method}</p>
              </div>

              {selectedFavorite.headers && Object.keys(selectedFavorite.headers).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Заголовки</p>
                  <pre className="mt-2 overflow-auto rounded-md bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
                    {JSON.stringify(selectedFavorite.headers, null, 2)}
                  </pre>
                </div>
              )}

              {selectedFavorite.body && (
                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Тело запроса</p>
                  <pre className="mt-2 overflow-auto rounded-md bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
                    {selectedFavorite.body}
                  </pre>
                </div>
              )}

              {selectedFavorite.auth_type && selectedFavorite.auth_type !== 'none' && (
                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Аутентификация</p>
                  <p className="mt-1 text-sm text-zinc-900 dark:text-white">{selectedFavorite.auth_type}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => {
                  handleUse(selectedFavorite)
                  setSelectedFavorite(null)
                }}
                className="flex-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Использовать
              </button>
              <button
                onClick={() => setSelectedFavorite(null)}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
