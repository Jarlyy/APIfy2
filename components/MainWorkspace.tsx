'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { UnifiedApiTester } from './UnifiedApiTester'
import OpenApiImport from './OpenApiImport'
import HistoryTab from './HistoryTab'
import FavoritesTab from './FavoritesTab'

interface MainWorkspaceProps {
  userId: string
  initialTab?: string
  activeTab?: string
  onTabChange?: (tab: string) => void
  testData?: {
    serviceName: string
    url: string
    method: string
    headers: Record<string, string>
    body: string
    authType: string
    authToken: string
  }
}

export default function MainWorkspace({ userId, initialTab = 'testing', activeTab, onTabChange, testData }: MainWorkspaceProps) {
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const [currentTab, setCurrentTab] = useState(activeTab || tabFromUrl || initialTab)

  useEffect(() => {
    if (activeTab) {
      setCurrentTab(activeTab)
    } else if (tabFromUrl) {
      setCurrentTab(tabFromUrl)
    }
  }, [activeTab, tabFromUrl])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Тестирование */}
      <div className={`${currentTab !== 'testing' ? 'hidden' : ''}`}>
        <UnifiedApiTester userId={userId} testData={testData} />
      </div>

      {/* Избранное */}
      <div className={`${currentTab !== 'favorites' ? 'hidden' : ''}`}>
        <FavoritesTab userId={userId} />
      </div>

      {/* Импорт API */}
      <div className={`${currentTab !== 'import' ? 'hidden' : ''}`}>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Импорт OpenAPI/Swagger
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Загрузите спецификацию OpenAPI для автоматического создания тестов
          </p>
        </div>
        <OpenApiImport />
      </div>

      {/* Аналитика */}
      <div className={`${currentTab !== 'analytics' ? 'hidden' : ''}`}>
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Аналитика тестов</h3>
          <p className="text-muted-foreground">Здесь будет отображаться статистика ваших API тестов</p>
        </div>
      </div>

      {/* История */}
      <div className={`${currentTab !== 'history' ? 'hidden' : ''}`}>
        <HistoryTab />
      </div>
    </div>
  )
}