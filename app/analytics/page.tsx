import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Получаем все тесты пользователя
  const { data: tests } = await supabase
    .from('api_tests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Header user={user} />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Аналитика и мониторинг
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Статистика и графики производительности ваших API тестов
          </p>
        </div>

        <AnalyticsDashboard tests={tests || []} />
      </main>
    </div>
  )
}
