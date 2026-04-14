import { createClient } from "@/lib/supabase/client";

const SENSITIVE_QUERY_KEYS = ["token", "key", "secret", "password", "auth"];

function isPrivateHostname(hostname: string) {
  const lowerHost = hostname.toLowerCase();
  if (
    lowerHost === "localhost" ||
    lowerHost.endsWith(".localhost") ||
    lowerHost.endsWith(".local")
  ) {
    return true;
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(lowerHost)) {
    if (
      lowerHost.startsWith("10.") ||
      lowerHost.startsWith("127.") ||
      lowerHost.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(lowerHost) ||
      lowerHost === "0.0.0.0"
    ) {
      return true;
    }
  }

  return false;
}

function validateMonitorUrl(rawUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return "Некорректный URL мониторинга.";
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return "Мониторинг поддерживает только HTTP/HTTPS URL.";
  }

  if (parsed.username || parsed.password) {
    return "Не передавайте логин/пароль в URL. Используйте поле авторизации.";
  }

  if (isPrivateHostname(parsed.hostname)) {
    return "Мониторинг приватных/локальных адресов запрещён политикой безопасности.";
  }

  for (const [key] of parsed.searchParams.entries()) {
    const normalized = key.toLowerCase();
    if (SENSITIVE_QUERY_KEYS.some((token) => normalized.includes(token))) {
      return "Не передавайте секреты в query-параметрах URL. Используйте защищённые заголовки.";
    }
  }

  return null;
}

export interface MonitorConfig {
  id: string;
  user_id: string;
  name: string;
  url: string;
  method: string;
  headers: Record<string, string> | null;
  body: string | null;
  interval_minutes: number;
  expected_status: number;
  sla_target: number;
  alert_on_failure: boolean;
  active: boolean;
  next_run_at: string;
  consecutive_failures: number;
  created_at: string;
  updated_at: string;
}

export interface MonitoringRun {
  id: string;
  monitor_id: string;
  user_id: string;
  status_code: number | null;
  response_time_ms: number | null;
  success: boolean;
  error_message: string | null;
  executed_at: string;
}

type MonitorInput = {
  name: string;
  url: string;
  method?: string;
  headers?: Record<string, string> | null;
  body?: string | null;
  interval_minutes?: number;
  expected_status?: number;
  sla_target?: number;
  alert_on_failure?: boolean;
};

type ExistingMonitorSchedule = {
  interval_minutes: number;
  next_run_at: string;
};

function buildMonitorPayload(userId: string, input: MonitorInput) {
  return {
    user_id: userId,
    name: input.name,
    url: input.url,
    method: input.method || "GET",
    headers: input.headers || null,
    body: input.body || null,
    interval_minutes: input.interval_minutes || 1440,
    expected_status: input.expected_status || 200,
    sla_target: input.sla_target || 99.9,
    alert_on_failure: input.alert_on_failure ?? true,
  };
}

function normalizeMonitorError(error: { code?: string; message: string }) {
  return error.code === "PGRST205" || /monitor_configs/i.test(error.message)
    ? "Таблица monitor_configs не найдена в Supabase. Примените актуальный supabase/schema.sql."
    : error.message;
}

async function getExistingMonitorSchedule(
  monitorId: string,
  userId: string,
  supabase: ReturnType<typeof createClient>,
) {
  const { data, error } = await supabase
    .from("monitor_configs")
    .select("interval_minutes, next_run_at")
    .eq("id", monitorId)
    .eq("user_id", userId)
    .single<ExistingMonitorSchedule>();

  if (error) {
    return { success: false as const, error: normalizeMonitorError(error) };
  }

  return { success: true as const, data };
}

export async function getMonitors() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Пользователь не авторизован" };

  const { data, error } = await supabase
    .from("monitor_configs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data || []) as MonitorConfig[] };
}

export async function createMonitor(input: MonitorInput) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Пользователь не авторизован" };

  const validationError = validateMonitorUrl(input.url);
  if (validationError) {
    return { success: false, error: validationError };
  }

  if (input.interval_minutes && input.interval_minutes < 1) {
    return {
      success: false,
      error: "Интервал мониторинга должен быть не меньше 1 минуты.",
    };
  }

  const payload = buildMonitorPayload(user.id, input);

  const { data, error } = await supabase
    .from("monitor_configs")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return { success: false, error: normalizeMonitorError(error) };
  }

  return { success: true, data: data as MonitorConfig };
}

export async function updateMonitor(monitorId: string, input: MonitorInput) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Пользователь не авторизован" };

  const validationError = validateMonitorUrl(input.url);
  if (validationError) {
    return { success: false, error: validationError };
  }

  if (input.interval_minutes && input.interval_minutes < 1) {
    return {
      success: false,
      error: "Интервал мониторинга должен быть не меньше 1 минуты.",
    };
  }

  const existingMonitorResult = await getExistingMonitorSchedule(
    monitorId,
    user.id,
    supabase,
  );

  if (!existingMonitorResult.success) {
    return { success: false, error: existingMonitorResult.error };
  }

  const intervalMinutes = input.interval_minutes || 1440;
  const payload = {
    ...buildMonitorPayload(user.id, input),
    next_run_at:
      existingMonitorResult.data.interval_minutes !== intervalMinutes
        ? new Date(Date.now() + intervalMinutes * 60 * 1000).toISOString()
        : existingMonitorResult.data.next_run_at,
  };

  const { data, error } = await supabase
    .from("monitor_configs")
    .update(payload)
    .eq("id", monitorId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return { success: false, error: normalizeMonitorError(error) };
  }

  return { success: true, data: data as MonitorConfig };
}

export async function setMonitorActiveState(
  monitorId: string,
  active: boolean,
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Пользователь не авторизован" };

  const existingMonitorResult = await getExistingMonitorSchedule(
    monitorId,
    user.id,
    supabase,
  );

  if (!existingMonitorResult.success) {
    return { success: false, error: existingMonitorResult.error };
  }

  const nextRunAt = active
    ? new Date(
        Date.now() + existingMonitorResult.data.interval_minutes * 60 * 1000,
      ).toISOString()
    : existingMonitorResult.data.next_run_at;

  const { data, error } = await supabase
    .from("monitor_configs")
    .update({
      active,
      next_run_at: nextRunAt,
    })
    .eq("id", monitorId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return { success: false, error: normalizeMonitorError(error) };
  }

  return { success: true, data: data as MonitorConfig };
}

export async function getMonitoringRuns(limit = 300) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Пользователь не авторизован" };

  const { data, error } = await supabase
    .from("monitor_runs")
    .select("*")
    .eq("user_id", user.id)
    .order("executed_at", { ascending: false })
    .limit(limit);

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data || []) as MonitoringRun[] };
}

export async function deleteMonitor(monitorId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Пользователь не авторизован" };

  const { error } = await supabase
    .from("monitor_configs")
    .delete()
    .eq("id", monitorId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
