import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import FavoritesList from '@/components/FavoritesList'

export default async function FavoritesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: favorites } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Header />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Избранные API
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Сохраненные шаблоны запросов для быстрого доступа
          </p>
        </div>

        <FavoritesList favorites={favorites || []} userId={user.id} />
      </main>
    </div>
  )
}
