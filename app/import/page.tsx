import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ImportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Перенаправляем на dashboard с вкладкой импорта
  redirect('/dashboard?tab=import')
}
