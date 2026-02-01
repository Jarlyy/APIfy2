'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import MainWorkspace from '@/components/MainWorkspace'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'testing')
  const [testData, setTestData] = useState<any>(null)

  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  // Проверяем наличие данных теста из localStorage при загрузке
  useEffect(() => {
    const pendingTestData = localStorage.getItem('pendingTestData')
    if (pendingTestData) {
      try {
        const parsedData = JSON.parse(pendingTestData)
        setTestData(parsedData)
        // Очищаем данные из localStorage после использования
        localStorage.removeItem('pendingTestData')
      } catch (error) {
        console.error('Ошибка парсинга данных теста:', error)
        localStorage.removeItem('pendingTestData')
      }
    }
  }, [])
  
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <Header activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-zinc-600 dark:text-zinc-400">Загрузка...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <MainWorkspace 
        userId={user?.id || 'guest-user'} 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        testData={testData}
      />
    </div>
  )
}
