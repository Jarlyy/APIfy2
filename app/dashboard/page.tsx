import Header from '@/components/Header'
import ApiTestingWorkspace from '@/components/ApiTestingWorkspace'

export default async function DashboardPage() {
  // В гостевом режиме не передаем пользователя
  const mockUser = undefined; // Убираем мок пользователя для показа кнопки "Войти"

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Header user={mockUser} />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Тестирование API
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Используйте ИИ для поиска API или введите данные вручную
          </p>
        </div>

        <ApiTestingWorkspace userId="guest-user" />
      </main>
    </div>
  )
}
