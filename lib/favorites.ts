import { createClient } from '@/lib/supabase/client'

export interface FavoriteItem {
  id?: string
  user_id?: string
  name: string
  service_name: string
  url: string
  method: string
  headers?: Record<string, string>
  body?: string
  auth_type?: string
  auth_data?: any
  created_at?: string
}

export interface FavoriteStats {
  total: number
  byMethod: Record<string, number>
  byService: string[]
}

// Получить избранные тесты
export async function getFavorites(limit = 50): Promise<{
  success: boolean
  data?: FavoriteItem[]
  error?: string
}> {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Пользователь не авторизован' }
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Ошибка получения избранного:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Ошибка получения избранного:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
    }
  }
}

// Добавить в избранное
export async function addToFavorites(favorite: Omit<FavoriteItem, 'id' | 'user_id' | 'created_at'>): Promise<{
  success: boolean
  data?: FavoriteItem
  error?: string
}> {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Пользователь не авторизован' }
    }

    const { data, error } = await supabase
      .from('favorites')
      .insert({
        ...favorite,
        user_id: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Ошибка добавления в избранное:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Ошибка добавления в избранное:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
    }
  }
}

// Удалить из избранного
export async function removeFromFavorites(id: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Пользователь не авторизован' }
    }

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Ошибка удаления из избранного:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Ошибка удаления из избранного:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
    }
  }
}

// Очистить все избранное
export async function clearFavorites(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Пользователь не авторизован' }
    }

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('Ошибка очистки избранного:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Ошибка очистки избранного:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
    }
  }
}

// Получить статистику избранного
export async function getFavoriteStats(): Promise<{
  success: boolean
  data?: FavoriteStats
  error?: string
}> {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Пользователь не авторизован' }
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('method, service_name')
      .eq('user_id', user.id)

    if (error) {
      console.error('Ошибка получения статистики избранного:', error)
      return { success: false, error: error.message }
    }

    const stats: FavoriteStats = {
      total: data?.length || 0,
      byMethod: {},
      byService: []
    }

    if (data) {
      // Подсчет по методам
      data.forEach(item => {
        stats.byMethod[item.method] = (stats.byMethod[item.method] || 0) + 1
      })

      // Уникальные сервисы
      stats.byService = [...new Set(data.map(item => item.service_name))]
    }

    return { success: true, data: stats }
  } catch (error) {
    console.error('Ошибка получения статистики избранного:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
    }
  }
}

// Проверить, есть ли тест в избранном
export async function isFavorite(url: string, method: string): Promise<{
  success: boolean
  data?: boolean
  error?: string
}> {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Пользователь не авторизован' }
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('url', url)
      .eq('method', method)
      .limit(1)

    if (error) {
      console.error('Ошибка проверки избранного:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: (data?.length || 0) > 0 }
  } catch (error) {
    console.error('Ошибка проверки избранного:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
    }
  }
}