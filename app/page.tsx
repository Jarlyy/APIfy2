import { redirect } from 'next/navigation'

export default async function Home() {
  // Убираем проверку аутентификации - переходим сразу на дашборд
  redirect('/dashboard')
}
