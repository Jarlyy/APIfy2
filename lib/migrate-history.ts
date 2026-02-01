import { saveTestToHistory, TestHistoryItem } from './test-history'

// Миграция истории из localStorage в Supabase
export async function migrateLocalHistoryToSupabase(): Promise<{
  success: boolean
  migrated: number
  errors: number
  message: string
}> {
  try {
    // Проверяем есть ли данные в localStorage
    const localHistory = localStorage.getItem('apiTestHistory')
    const testHistory = localStorage.getItem('testHistory')
    
    if (!localHistory && !testHistory) {
      return {
        success: true,
        migrated: 0,
        errors: 0,
        message: 'Нет локальных данных для миграции'
      }
    }

    let allLocalTests: any[] = []
    
    // Собираем данные из разных ключей localStorage
    if (localHistory) {
      try {
        const parsed = JSON.parse(localHistory)
        if (Array.isArray(parsed)) {
          allLocalTests = allLocalTests.concat(parsed)
        }
      } catch (e) {
        console.warn('Ошибка парсинга apiTestHistory:', e)
      }
    }

    if (testHistory) {
      try {
        const parsed = JSON.parse(testHistory)
        if (Array.isArray(parsed)) {
          allLocalTests = allLocalTests.concat(parsed)
        }
      } catch (e) {
        console.warn('Ошибка парсинга testHistory:', e)
      }
    }

    if (allLocalTests.length === 0) {
      return {
        success: true,
        migrated: 0,
        errors: 0,
        message: 'Нет валидных данных для миграции'
      }
    }

    let migrated = 0
    let errors = 0

    // Мигрируем каждый тест
    for (const localTest of allLocalTests) {
      try {
        // Преобразуем старый формат в новый
        const historyItem: TestHistoryItem = {
          service_name: localTest.serviceName || localTest.service_name || 'Migrated Test',
          test_name: localTest.serviceName || localTest.test_name,
          url: localTest.url,
          method: localTest.method,
          headers: localTest.headers || {},
          body: localTest.body || '',
          auth_type: localTest.auth_type || 'none',
          auth_token: localTest.auth_token || '',
          
          // Извлекаем данные из result объекта (старый формат)
          status_code: localTest.result?.status || localTest.status_code,
          response_data: localTest.result?.data || localTest.response_data,
          response_time: localTest.result?.responseTime || localTest.response_time,
          error_message: localTest.result?.error || localTest.error_message,
          test_status: localTest.result?.status >= 200 && localTest.result?.status < 300 ? 'success' : 'error',
          
          ai_provider: 'huggingface', // По умолчанию GPT OSS для старых тестов
          created_at: localTest.timestamp || localTest.created_at || new Date().toISOString()
        }

        const result = await saveTestToHistory(historyItem)
        if (result.success) {
          migrated++
        } else {
          errors++
          console.warn('Ошибка миграции теста:', result.error)
        }
      } catch (error) {
        errors++
        console.warn('Ошибка обработки теста:', error)
      }
    }

    // Если миграция прошла успешно, очищаем localStorage
    if (migrated > 0 && errors === 0) {
      localStorage.removeItem('apiTestHistory')
      localStorage.removeItem('testHistory')
    }

    return {
      success: true,
      migrated,
      errors,
      message: `Мигрировано ${migrated} тестов${errors > 0 ? `, ошибок: ${errors}` : ''}`
    }

  } catch (error) {
    console.error('Ошибка миграции:', error)
    return {
      success: false,
      migrated: 0,
      errors: 1,
      message: `Ошибка миграции: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
    }
  }
}

// Проверяем нужна ли миграция
export function needsMigration(): boolean {
  if (typeof window === 'undefined') return false
  
  const localHistory = localStorage.getItem('apiTestHistory')
  const testHistory = localStorage.getItem('testHistory')
  
  return !!(localHistory || testHistory)
}