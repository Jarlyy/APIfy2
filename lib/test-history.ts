import { createClient } from '@/lib/supabase/client'

export interface TestHistoryItem {
  id?: string
  user_id?: string
  service_name: string
  test_name?: string
  url: string
  method: string
  headers?: Record<string, string>
  body?: string
  auth_type?: string
  auth_token?: string
  
  // Результат теста
  status_code?: number
  response_data?: any
  response_time?: number
  error_message?: string
  test_status?: 'success' | 'error' | 'pending'
  
  // AI провайдер и анализ
  ai_provider?: 'gemini' | 'huggingface'
  ai_analysis?: string
  
  created_at?: string
  updated_at?: string
}

export interface TestHistoryResult {
  success: boolean
  data?: TestHistoryItem[]
  error?: string
}

export interface SaveTestResult {
  success: boolean
  data?: TestHistoryItem
  error?: string
}

// Сохранить тест в историю
export async function saveTestToHistory(testData: TestHistoryItem): Promise<SaveTestResult> {
  try {
    const supabase = createClient()
    
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'Пользователь не авторизован'
      }
    }

    // Подготавливаем данные для сохранения
    const historyItem = {
      ...testData,
      user_id: user.id,
      created_at: new Date().toISOString()
    }

    // Сохраняем в Supabase
    const { data, error } = await supabase
      .from('api_test_history')
      .insert([historyItem])
      .select()
      .single()

    if (error) {
      console.error('Ошибка сохранения в историю:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('Ошибка сохранения теста:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }
  }
}

// Получить историю тестов пользователя
export async function getTestHistory(limit: number = 50, offset: number = 0): Promise<TestHistoryResult> {
  try {
    const supabase = createClient()
    
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'Пользователь не авторизован'
      }
    }

    // Получаем историю тестов
    const { data, error } = await supabase
      .from('api_test_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Ошибка загрузки истории:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: data || []
    }
  } catch (error) {
    console.error('Ошибка получения истории:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }
  }
}

// Обновить результат теста
export async function updateTestResult(
  testId: string, 
  result: {
    status_code?: number
    response_data?: any
    response_time?: number
    error_message?: string
    test_status?: 'success' | 'error' | 'pending'
    ai_analysis?: string
  }
): Promise<SaveTestResult> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('api_test_history')
      .update({
        ...result,
        updated_at: new Date().toISOString()
      })
      .eq('id', testId)
      .select()
      .single()

    if (error) {
      console.error('Ошибка обновления теста:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('Ошибка обновления теста:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }
  }
}

// Удалить тест из истории
export async function deleteTestFromHistory(testId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('api_test_history')
      .delete()
      .eq('id', testId)

    if (error) {
      console.error('Ошибка удаления теста:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Ошибка удаления теста:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }
  }
}

// Очистить всю историю пользователя
export async function clearTestHistory(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'Пользователь не авторизован'
      }
    }

    const { error } = await supabase
      .from('api_test_history')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('Ошибка очистки истории:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Ошибка очистки истории:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }
  }
}

// Получить статистику тестов
export async function getTestStats(): Promise<{
  success: boolean
  data?: {
    total: number
    success: number
    error: number
    pending: number
    services: string[]
  }
  error?: string
}> {
  try {
    const supabase = createClient()
    
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'Пользователь не авторизован'
      }
    }

    // Получаем все тесты пользователя
    const { data, error } = await supabase
      .from('api_test_history')
      .select('test_status, service_name')
      .eq('user_id', user.id)

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    const tests = data || []
    const stats = {
      total: tests.length,
      success: tests.filter(t => t.test_status === 'success').length,
      error: tests.filter(t => t.test_status === 'error').length,
      pending: tests.filter(t => t.test_status === 'pending').length,
      services: [...new Set(tests.map(t => t.service_name).filter(Boolean))]
    }

    return {
      success: true,
      data: stats
    }
  } catch (error) {
    console.error('Ошибка получения статистики:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }
  }
}