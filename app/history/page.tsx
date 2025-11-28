import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import TestHistoryList from '@/components/TestHistoryList'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Получаем историю тестов
  const { data: tests, error } = await supabase
    .from('api_tests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Header user={user} />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            История тестов
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Все ваши предыдущие проверки API
          </p>
        </div>

        {error ? (
          <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-sm text-red-800 dark:text-red-400">
              Ошибка загрузки истории: {error.message}
            </p>
          </div>
        ) : (
          <TestHistoryList tests={tests || []} />
        )}
      </main>
    </div>
  )
}
