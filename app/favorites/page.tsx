import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function FavoritesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Перенаправляем на dashboard с вкладкой избранного
  redirect('/dashboard?tab=favorites')
}
