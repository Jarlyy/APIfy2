'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'

interface HeaderProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export default function Header({ activeTab = 'testing', onTabChange }: HeaderProps) {
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || activeTab

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const handleTabClick = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab)
    }
    // Обновляем URL без перезагрузки страницы
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    window.history.pushState({}, '', url.toString())
  }
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xl font-bold text-zinc-900 dark:text-white">
              APIfy
            </Link>
            <nav className="flex gap-4">
              <button
                onClick={() => handleTabClick('testing')}
                className={`text-sm font-medium transition-colors ${
                  currentTab === 'testing'
                    ? 'text-zinc-900 dark:text-white border-b-2 border-blue-500'
                    : 'text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white'
                }`}
              >
                Тестирование
              </button>
              <button
                onClick={() => handleTabClick('favorites')}
                className={`text-sm font-medium transition-colors ${
                  currentTab === 'favorites'
                    ? 'text-zinc-900 dark:text-white border-b-2 border-blue-500'
                    : 'text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white'
                }`}
              >
                Избранное
              </button>
              <button
                onClick={() => handleTabClick('import')}
                className={`text-sm font-medium transition-colors ${
                  currentTab === 'import'
                    ? 'text-zinc-900 dark:text-white border-b-2 border-blue-500'
                    : 'text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white'
                }`}
              >
                Импорт API
              </button>
              <button
                onClick={() => handleTabClick('analytics')}
                className={`text-sm font-medium transition-colors ${
                  currentTab === 'analytics'
                    ? 'text-zinc-900 dark:text-white border-b-2 border-blue-500'
                    : 'text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white'
                }`}
              >
                Аналитика
              </button>
              <button
                onClick={() => handleTabClick('history')}
                className={`text-sm font-medium transition-colors ${
                  currentTab === 'history'
                    ? 'text-zinc-900 dark:text-white border-b-2 border-blue-500'
                    : 'text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white'
                }`}
              >
                История
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {loading ? (
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                Загрузка...
              </div>
            ) : user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {user.email}
                </span>
                <button 
                  onClick={handleSignOut}
                  className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Войти
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
