import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ApiTestForm from '@/components/ApiTestForm'
import Header from '@/components/Header'
import { AIAnalyzer } from '@/components/AIAnalyzer'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Header user={user} />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Тестирование API
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Используйте ИИ для поиска API или введите данные вручную
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <AIAnalyzer />
          </div>
          <div className="space-y-6">
            <ApiTestForm userId={user.id} />
          </div>
        </div>
      </main>
    </div>
  )
}
