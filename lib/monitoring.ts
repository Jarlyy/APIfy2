import { createClient } from '@/lib/supabase/client'

export interface MonitorConfig {
  id: string
  user_id: string
  name: string
  url: string
  method: string
  headers: Record<string, string> | null
  body: string | null
  interval_minutes: number
  expected_status: number
  sla_target: number
  alert_on_failure: boolean
  active: boolean
  next_run_at: string
  consecutive_failures: number
  created_at: string
  updated_at: string
}

export interface MonitoringRun {
  id: string
  monitor_id: string
  user_id: string
  status_code: number | null
  response_time_ms: number | null
  success: boolean
  error_message: string | null
  executed_at: string
}

export async function getMonitors() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Пользователь не авторизован' }

  const { data, error } = await supabase
    .from('monitor_configs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, data: (data || []) as MonitorConfig[] }
}

export async function createMonitor(input: {
  name: string
  url: string
  method?: string
  interval_minutes?: number
  expected_status?: number
  sla_target?: number
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Пользователь не авторизован' }

  const payload = {
    user_id: user.id,
    name: input.name,
    url: input.url,
    method: input.method || 'GET',
    interval_minutes: input.interval_minutes || 1440,
    expected_status: input.expected_status || 200,
    sla_target: input.sla_target || 99.9,
  }

  const { data, error } = await supabase
    .from('monitor_configs')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    const message =
      error.code === 'PGRST205' || /monitor_configs/i.test(error.message)
        ? 'Таблица monitor_configs не найдена в Supabase. Примените актуальный supabase/schema.sql.'
        : error.message

    return { success: false, error: message }
  }

  return { success: true, data: data as MonitorConfig }
}

export async function getMonitoringRuns(limit = 300) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Пользователь не авторизован' }

  const { data, error } = await supabase
    .from('monitor_runs')
    .select('*')
    .eq('user_id', user.id)
    .order('executed_at', { ascending: false })
    .limit(limit)

  if (error) return { success: false, error: error.message }
  return { success: true, data: (data || []) as MonitoringRun[] }
}

export async function deleteMonitor(monitorId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Пользователь не авторизован' }

  const { error } = await supabase
    .from('monitor_configs')
    .delete()
    .eq('id', monitorId)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
