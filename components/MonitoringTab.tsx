"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  type MonitorConfig,
  type MonitoringRun,
  createMonitor,
  deleteMonitor,
  getMonitoringRuns,
  getMonitors,
  setMonitorActiveState,
  updateMonitor,
} from "@/lib/monitoring";
import type { PendingMonitorData } from "@/lib/pending-monitor-data";
import {
  Activity,
  CheckCircle,
  Clock,
  Loader2,
  Pencil,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type AuthType = "none" | "bearer" | "api-key" | "basic";

interface MonitoringTabProps {
  monitorDraft?: PendingMonitorData | null;
}

type ChartRangeOption = "6h" | "24h" | "7d" | "30d" | "all";
type ResponseTrendPoint = {
  label: string;
  tooltipLabel: string;
  responseTime: number | null;
  runCount: number;
  isAggregated: boolean;
};

const DEFAULT_MONITOR_FORM = {
  name: "",
  url: "",
  method: "GET" as HttpMethod,
  headers: "{}",
  body: "",
  authType: "none" as AuthType,
  bearerToken: "",
  apiKey: "",
  apiKeyHeader: "X-API-Key",
  basicUsername: "",
  basicPassword: "",
  interval_minutes: 1440,
  expected_status: 200,
  sla_target: 99.9,
  alert_on_failure: true,
  legalConfirmed: false,
};

const COMMON_API_KEY_HEADERS = ["x-api-key", "api-key", "apikey"];
const CHART_RANGE_OPTIONS: Array<{
  value: ChartRangeOption;
  label: string;
  durationMs: number | null;
}> = [
  { value: "6h", label: "6ч", durationMs: 6 * 60 * 60 * 1000 },
  { value: "24h", label: "24ч", durationMs: 24 * 60 * 60 * 1000 },
  { value: "7d", label: "7д", durationMs: 7 * 24 * 60 * 60 * 1000 },
  { value: "30d", label: "30д", durationMs: 30 * 24 * 60 * 60 * 1000 },
  { value: "all", label: "Все", durationMs: null },
];
const MAX_VISIBLE_CHART_POINTS = 80;
const MAX_DOTS_BEFORE_HIDE = 35;

function formatChartTimestamp(date: Date, chartRange: ChartRangeOption) {
  const options: Intl.DateTimeFormatOptions =
    chartRange === "6h" || chartRange === "24h"
      ? { hour: "2-digit", minute: "2-digit" }
      : { day: "2-digit", month: "2-digit", hour: "2-digit" };

  return new Intl.DateTimeFormat("ru-RU", options).format(date);
}

function formatTooltipTimestamp(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildTrendPoint(
  runs: MonitoringRun[],
  chartRange: ChartRangeOption,
): ResponseTrendPoint {
  const datedRuns = runs.map((run) => ({
    ...run,
    executedAtMs: new Date(run.executed_at).getTime(),
  }));
  const firstRun = datedRuns[0];
  const lastRun = datedRuns[datedRuns.length - 1];
  const numericResponseTimes = datedRuns
    .map((run) => run.response_time_ms)
    .filter((value): value is number => typeof value === "number");
  const responseTime = numericResponseTimes.length
    ? Math.round(
        numericResponseTimes.reduce((sum, value) => sum + value, 0) /
          numericResponseTimes.length,
      )
    : null;

  if (!firstRun || !lastRun) {
    return {
      label: "Нет данных",
      tooltipLabel: "Нет данных",
      responseTime,
      runCount: 0,
      isAggregated: false,
    };
  }

  const firstDate = new Date(firstRun.executedAtMs);
  const lastDate = new Date(lastRun.executedAtMs);
  const isAggregated = runs.length > 1;

  return {
    label: isAggregated
      ? `${formatChartTimestamp(firstDate, chartRange)}-${formatChartTimestamp(
          lastDate,
          chartRange,
        )}`
      : formatChartTimestamp(firstDate, chartRange),
    tooltipLabel: isAggregated
      ? `${formatTooltipTimestamp(firstDate)} - ${formatTooltipTimestamp(lastDate)}`
      : formatTooltipTimestamp(firstDate),
    responseTime,
    runCount: runs.length,
    isAggregated,
  };
}

function compactTrendPoints(
  runs: MonitoringRun[],
  chartRange: ChartRangeOption,
) {
  if (runs.length <= MAX_VISIBLE_CHART_POINTS) {
    return {
      points: runs.map((run) => buildTrendPoint([run], chartRange)),
      isCompacted: false,
      sourceCount: runs.length,
    };
  }

  const bucketSize = Math.ceil(runs.length / MAX_VISIBLE_CHART_POINTS);
  const buckets: MonitoringRun[][] = [];

  for (let index = 0; index < runs.length; index += bucketSize) {
    buckets.push(runs.slice(index, index + bucketSize));
  }

  return {
    points: buckets.map((bucket) => buildTrendPoint(bucket, chartRange)),
    isCompacted: true,
    sourceCount: runs.length,
  };
}

function formatMonitorHeaders(headers: MonitorConfig["headers"]) {
  if (!headers || Object.keys(headers).length === 0) {
    return "{}";
  }

  return JSON.stringify(headers, null, 2);
}

function buildMonitorFormFromConfig(monitor: MonitorConfig) {
  const rawHeaders = { ...(monitor.headers || {}) };
  let authType: AuthType = "none";
  let bearerToken = "";
  let apiKey = "";
  let apiKeyHeader = "X-API-Key";
  let basicUsername = "";
  let basicPassword = "";

  const authorizationHeader =
    rawHeaders.Authorization || rawHeaders.authorization;
  const { Authorization, authorization, ...headersWithoutAuthorization } =
    rawHeaders;
  let sanitizedHeaders = headersWithoutAuthorization;

  if (typeof authorizationHeader === "string") {
    if (authorizationHeader.startsWith("Bearer ")) {
      authType = "bearer";
      bearerToken = authorizationHeader.slice("Bearer ".length).trim();
    } else if (authorizationHeader.startsWith("Basic ")) {
      authType = "basic";

      try {
        const decoded = atob(authorizationHeader.slice("Basic ".length).trim());
        const separatorIndex = decoded.indexOf(":");

        if (separatorIndex >= 0) {
          basicUsername = decoded.slice(0, separatorIndex);
          basicPassword = decoded.slice(separatorIndex + 1);
        }
      } catch {
        basicUsername = "";
        basicPassword = "";
      }
    }
  }

  if (authType === "none") {
    const apiKeyEntry = Object.entries(sanitizedHeaders).find(([key]) =>
      COMMON_API_KEY_HEADERS.includes(key.toLowerCase()),
    );

    if (apiKeyEntry) {
      authType = "api-key";
      apiKeyHeader = apiKeyEntry[0];
      apiKey = apiKeyEntry[1];
      sanitizedHeaders = Object.fromEntries(
        Object.entries(sanitizedHeaders).filter(
          ([key]) => key !== apiKeyEntry[0],
        ),
      );
    }
  }

  return {
    ...DEFAULT_MONITOR_FORM,
    name: monitor.name,
    url: monitor.url,
    method: (monitor.method as HttpMethod) || "GET",
    headers: formatMonitorHeaders(sanitizedHeaders),
    body: monitor.body || "",
    authType,
    bearerToken,
    apiKey,
    apiKeyHeader,
    basicUsername,
    basicPassword,
    interval_minutes: monitor.interval_minutes,
    expected_status: monitor.expected_status,
    sla_target: Number(monitor.sla_target),
    alert_on_failure: monitor.alert_on_failure,
    legalConfirmed: true,
  };
}

export default function MonitoringTab({ monitorDraft }: MonitoringTabProps) {
  const [loading, setLoading] = useState(true);
  const [monitorRuns, setMonitorRuns] = useState<MonitoringRun[]>([]);
  const [monitors, setMonitors] = useState<MonitorConfig[]>([]);
  const [editingMonitorId, setEditingMonitorId] = useState<string | null>(null);
  const [selectedMonitorId, setSelectedMonitorId] = useState<string | null>(
    null,
  );
  const [creatingMonitor, setCreatingMonitor] = useState(false);
  const [deletingMonitorId, setDeletingMonitorId] = useState<string | null>(
    null,
  );
  const [togglingMonitorId, setTogglingMonitorId] = useState<string | null>(
    null,
  );
  const [monitorError, setMonitorError] = useState<string | null>(null);
  const [monitorSuccess, setMonitorSuccess] = useState<string | null>(null);
  const [newMonitor, setNewMonitor] = useState(DEFAULT_MONITOR_FORM);
  const [chartRange, setChartRange] = useState<ChartRangeOption>("24h");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [monitorsResult, runsResult] = await Promise.all([
        getMonitors(),
        getMonitoringRuns(500),
      ]);

      if (monitorsResult.success && monitorsResult.data) {
        setMonitors(monitorsResult.data);
        setSelectedMonitorId(monitorsResult.data[0]?.id ?? null);
      }

      if (runsResult.success && runsResult.data) {
        setMonitorRuns(runsResult.data);
      }

      setLoading(false);
    };

    load();
  }, []);

  useEffect(() => {
    if (!monitorDraft) {
      return;
    }

    setEditingMonitorId(null);
    setNewMonitor((prev) => ({
      ...prev,
      name: monitorDraft.name || prev.name,
      url: monitorDraft.url || "",
      method:
        ((monitorDraft.method || "GET").toUpperCase() as HttpMethod) || "GET",
      headers: monitorDraft.headers || "{}",
      body: monitorDraft.body || "",
      authType: (monitorDraft.authType as AuthType) || "none",
      bearerToken: monitorDraft.bearerToken || "",
      apiKey: monitorDraft.apiKey || "",
      apiKeyHeader: monitorDraft.apiKeyHeader || "X-API-Key",
      basicUsername: monitorDraft.basicUsername || "",
      basicPassword: monitorDraft.basicPassword || "",
      legalConfirmed: false,
    }));
    setMonitorError(null);
    setMonitorSuccess(
      "Данные из ручного тестирования перенесены в форму монитора.",
    );
  }, [monitorDraft]);

  const selectedMonitor = useMemo(
    () => monitors.find((monitor) => monitor.id === selectedMonitorId) ?? null,
    [monitors, selectedMonitorId],
  );

  const selectedMonitorRuns = useMemo(
    () =>
      selectedMonitorId
        ? monitorRuns.filter((run) => run.monitor_id === selectedMonitorId)
        : [],
    [monitorRuns, selectedMonitorId],
  );

  const monitoringSummary = useMemo(() => {
    const total = selectedMonitorRuns.length;
    const success = selectedMonitorRuns.filter((run) => run.success).length;
    const uptime = total ? Number(((success / total) * 100).toFixed(2)) : 0;
    const avgResponse = total
      ? Math.round(
          selectedMonitorRuns.reduce(
            (sum, run) => sum + (run.response_time_ms || 0),
            0,
          ) / total,
        )
      : 0;

    return {
      activeMonitors: monitors.filter((monitor) => monitor.active).length,
      runsForMonitor: total,
      uptime,
      avgResponse,
    };
  }, [selectedMonitorRuns, monitors]);

  const selectedMonitorResponseTrend = useMemo(() => {
    const selectedRange = CHART_RANGE_OPTIONS.find(
      (option) => option.value === chartRange,
    );
    const threshold = selectedRange?.durationMs
      ? Date.now() - selectedRange.durationMs
      : null;

    const filteredRuns = [...selectedMonitorRuns]
      .filter((run) => {
        if (!threshold) {
          return true;
        }

        return new Date(run.executed_at).getTime() >= threshold;
      })
      .sort(
        (a, b) =>
          new Date(a.executed_at).getTime() - new Date(b.executed_at).getTime(),
      );

    return compactTrendPoints(filteredRuns, chartRange);
  }, [chartRange, selectedMonitorRuns]);

  const hasResponseTrendData = selectedMonitorResponseTrend.points.some(
    (point) => typeof point.responseTime === "number",
  );
  const shouldShowChartDots =
    selectedMonitorResponseTrend.points.length <= MAX_DOTS_BEFORE_HIDE;
  const chartTickInterval = Math.max(
    Math.ceil(selectedMonitorResponseTrend.points.length / 8) - 1,
    0,
  );

  const isEditing = editingMonitorId !== null;

  const resetMonitorForm = () => {
    setEditingMonitorId(null);
    setNewMonitor({ ...DEFAULT_MONITOR_FORM });
  };

  const handleEditMonitor = (monitor: MonitorConfig) => {
    setEditingMonitorId(monitor.id);
    setSelectedMonitorId(monitor.id);
    setMonitorError(null);
    setMonitorSuccess(null);
    setNewMonitor(buildMonitorFormFromConfig(monitor));
  };

  const buildMonitorHeaders = () => {
    const parsedHeaders = newMonitor.headers.trim()
      ? (JSON.parse(newMonitor.headers) as Record<string, unknown>)
      : {};

    const normalizedHeaders = Object.fromEntries(
      Object.entries(parsedHeaders).map(([key, value]) => [key, String(value)]),
    );

    if (newMonitor.authType === "bearer" && newMonitor.bearerToken.trim()) {
      normalizedHeaders.Authorization = `Bearer ${newMonitor.bearerToken.trim()}`;
    }

    if (
      newMonitor.authType === "api-key" &&
      newMonitor.apiKeyHeader.trim() &&
      newMonitor.apiKey.trim()
    ) {
      normalizedHeaders[newMonitor.apiKeyHeader.trim()] =
        newMonitor.apiKey.trim();
    }

    if (newMonitor.authType === "basic" && newMonitor.basicUsername.trim()) {
      const credentials = btoa(
        `${newMonitor.basicUsername}:${newMonitor.basicPassword}`,
      );
      normalizedHeaders.Authorization = `Basic ${credentials}`;
    }

    return normalizedHeaders;
  };

  const handleSubmitMonitor = async () => {
    if (!newMonitor.name.trim() || !newMonitor.url.trim()) {
      return;
    }

    if (!newMonitor.legalConfirmed) {
      setMonitorError(
        "Подтвердите, что у вас есть право на мониторинг указанного endpoint.",
      );
      return;
    }

    setCreatingMonitor(true);
    setMonitorError(null);
    setMonitorSuccess(null);

    let monitorHeaders: Record<string, string>;

    try {
      monitorHeaders = buildMonitorHeaders();
    } catch (error) {
      setMonitorError(
        `Некорректный JSON заголовков: ${
          error instanceof Error ? error.message : "неизвестная ошибка"
        }`,
      );
      setCreatingMonitor(false);
      return;
    }

    const monitorInput = {
      name: newMonitor.name.trim(),
      url: newMonitor.url.trim(),
      method: newMonitor.method,
      headers: monitorHeaders,
      body:
        newMonitor.method === "GET" || !newMonitor.body.trim()
          ? null
          : newMonitor.body,
      interval_minutes: newMonitor.interval_minutes,
      expected_status: newMonitor.expected_status,
      sla_target: newMonitor.sla_target,
      alert_on_failure: newMonitor.alert_on_failure,
    };

    const result = editingMonitorId
      ? await updateMonitor(editingMonitorId, monitorInput)
      : await createMonitor(monitorInput);

    if (result.success && result.data) {
      setMonitors((prev) =>
        editingMonitorId
          ? prev.map((monitor) =>
              monitor.id === result.data.id ? result.data : monitor,
            )
          : [result.data, ...prev],
      );
      setSelectedMonitorId(result.data.id);
      resetMonitorForm();
      setMonitorSuccess(
        editingMonitorId
          ? "Параметры монитора обновлены."
          : "Монитор успешно создан.",
      );
    } else {
      setMonitorError(
        result.error ||
          (editingMonitorId
            ? "Не удалось обновить монитор."
            : "Не удалось создать монитор."),
      );
    }

    setCreatingMonitor(false);
  };

  const handleDeleteMonitor = async (monitorId: string) => {
    setMonitorError(null);
    setMonitorSuccess(null);
    setDeletingMonitorId(monitorId);

    const result = await deleteMonitor(monitorId);

    if (!result.success) {
      setMonitorError(result.error || "Не удалось удалить монитор.");
      setDeletingMonitorId(null);
      return;
    }

    const nextMonitors = monitors.filter((monitor) => monitor.id !== monitorId);
    setMonitors(nextMonitors);
    setMonitorRuns((prev) =>
      prev.filter((run) => run.monitor_id !== monitorId),
    );

    if (selectedMonitorId === monitorId) {
      setSelectedMonitorId(nextMonitors[0]?.id ?? null);
    }

    if (editingMonitorId === monitorId) {
      resetMonitorForm();
    }

    setMonitorSuccess("Монитор удалён.");
    setDeletingMonitorId(null);
  };

  const handleToggleMonitorActive = async (monitor: MonitorConfig) => {
    if (togglingMonitorId === monitor.id) {
      return;
    }

    setMonitorError(null);
    setTogglingMonitorId(monitor.id);

    const nextActive = !monitor.active;

    setMonitors((prev) =>
      prev.map((item) =>
        item.id === monitor.id ? { ...item, active: nextActive } : item,
      ),
    );

    const result = await setMonitorActiveState(monitor.id, nextActive);

    if (!result.success || !result.data) {
      setMonitors((prev) =>
        prev.map((item) =>
          item.id === monitor.id ? { ...item, active: monitor.active } : item,
        ),
      );
      setMonitorError(
        result.error || "Не удалось изменить состояние монитора.",
      );
      setTogglingMonitorId(null);
      return;
    }

    setMonitors((prev) =>
      prev.map((item) => (item.id === result.data.id ? result.data : item)),
    );

    if (selectedMonitorId === result.data.id) {
      setSelectedMonitorId(result.data.id);
    }

    setTogglingMonitorId(null);
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
        <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
        Загрузка мониторинга...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? "Редактирование монитора" : "Мониторинг"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Название" htmlFor="monitor-name">
                <Input
                  id="monitor-name"
                  placeholder="Создать монитор API"
                  value={newMonitor.name}
                  onChange={(event) =>
                    setNewMonitor((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="HTTP-метод" htmlFor="monitor-method">
                <select
                  id="monitor-method"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={newMonitor.method}
                  onChange={(event) =>
                    setNewMonitor((prev) => ({
                      ...prev,
                      method: event.target.value as HttpMethod,
                      body:
                        event.target.value === "GET" && prev.method !== "GET"
                          ? ""
                          : prev.body,
                    }))
                  }
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </Field>

              <Field label="Ожидаемый статус" htmlFor="monitor-expected-status">
                <Input
                  id="monitor-expected-status"
                  type="number"
                  min={100}
                  max={599}
                  value={newMonitor.expected_status}
                  onChange={(event) =>
                    setNewMonitor((prev) => ({
                      ...prev,
                      expected_status: Number(event.target.value || 200),
                    }))
                  }
                />
              </Field>
            </div>

            <Field label="URL эндпоинта" htmlFor="monitor-url">
              <Input
                id="monitor-url"
                placeholder="https://api.example.com/health"
                value={newMonitor.url}
                onChange={(event) =>
                  setNewMonitor((prev) => ({
                    ...prev,
                    url: event.target.value,
                  }))
                }
              />
            </Field>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="JSON заголовков" htmlFor="monitor-headers">
                <Textarea
                  id="monitor-headers"
                  rows={6}
                  placeholder='{"Accept":"application/json"}'
                  value={newMonitor.headers}
                  onChange={(event) =>
                    setNewMonitor((prev) => ({
                      ...prev,
                      headers: event.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Тело запроса" htmlFor="monitor-body">
                <Textarea
                  id="monitor-body"
                  rows={6}
                  placeholder='{"ping":"pong"}'
                  value={newMonitor.body}
                  disabled={newMonitor.method === "GET"}
                  onChange={(event) =>
                    setNewMonitor((prev) => ({
                      ...prev,
                      body: event.target.value,
                    }))
                  }
                />
                {newMonitor.method === "GET" && (
                  <p className="text-xs text-muted-foreground">
                    Для GET-запросов тело не используется.
                  </p>
                )}
              </Field>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Авторизация" htmlFor="monitor-auth-type">
                <select
                  id="monitor-auth-type"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={newMonitor.authType}
                  onChange={(event) =>
                    setNewMonitor((prev) => ({
                      ...prev,
                      authType: event.target.value as AuthType,
                    }))
                  }
                >
                  <option value="none">Без авторизации</option>
                  <option value="bearer">Bearer token</option>
                  <option value="api-key">API key</option>
                  <option value="basic">Basic auth</option>
                </select>
              </Field>

              {newMonitor.authType === "bearer" && (
                <Field
                  label="Bearer token"
                  htmlFor="monitor-bearer-token"
                  className="md:col-span-2"
                >
                  <Input
                    id="monitor-bearer-token"
                    placeholder="Введите токен"
                    value={newMonitor.bearerToken}
                    onChange={(event) =>
                      setNewMonitor((prev) => ({
                        ...prev,
                        bearerToken: event.target.value,
                      }))
                    }
                  />
                </Field>
              )}

              {newMonitor.authType === "api-key" && (
                <>
                  <Field
                    label="Заголовок API key"
                    htmlFor="monitor-api-key-header"
                  >
                    <Input
                      id="monitor-api-key-header"
                      placeholder="X-API-Key"
                      value={newMonitor.apiKeyHeader}
                      onChange={(event) =>
                        setNewMonitor((prev) => ({
                          ...prev,
                          apiKeyHeader: event.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label="API key" htmlFor="monitor-api-key">
                    <Input
                      id="monitor-api-key"
                      placeholder="Введите API key"
                      value={newMonitor.apiKey}
                      onChange={(event) =>
                        setNewMonitor((prev) => ({
                          ...prev,
                          apiKey: event.target.value,
                        }))
                      }
                    />
                  </Field>
                </>
              )}

              {newMonitor.authType === "basic" && (
                <>
                  <Field label="Логин" htmlFor="monitor-basic-username">
                    <Input
                      id="monitor-basic-username"
                      placeholder="Логин"
                      value={newMonitor.basicUsername}
                      onChange={(event) =>
                        setNewMonitor((prev) => ({
                          ...prev,
                          basicUsername: event.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label="Пароль" htmlFor="monitor-basic-password">
                    <Input
                      id="monitor-basic-password"
                      type="password"
                      placeholder="Пароль"
                      value={newMonitor.basicPassword}
                      onChange={(event) =>
                        setNewMonitor((prev) => ({
                          ...prev,
                          basicPassword: event.target.value,
                        }))
                      }
                    />
                  </Field>
                </>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Интервал, минут" htmlFor="monitor-interval">
                <Input
                  id="monitor-interval"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="5"
                  value={newMonitor.interval_minutes}
                  onChange={(event) =>
                    setNewMonitor((prev) => ({
                      ...prev,
                      interval_minutes: Number(event.target.value || 5),
                    }))
                  }
                />
              </Field>

              <Field label="Цель SLA, %" htmlFor="monitor-sla-target">
                <Input
                  id="monitor-sla-target"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={newMonitor.sla_target}
                  onChange={(event) =>
                    setNewMonitor((prev) => ({
                      ...prev,
                      sla_target: Number(event.target.value || 99.9),
                    }))
                  }
                />
              </Field>

              <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm md:mt-6">
                <input
                  type="checkbox"
                  checked={newMonitor.alert_on_failure}
                  onChange={(event) =>
                    setNewMonitor((prev) => ({
                      ...prev,
                      alert_on_failure: event.target.checked,
                    }))
                  }
                />
                Уведомлять о сбое
              </label>
            </div>

            <label className="flex items-start gap-2 rounded-md border px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={newMonitor.legalConfirmed}
                onChange={(event) =>
                  setNewMonitor((prev) => ({
                    ...prev,
                    legalConfirmed: event.target.checked,
                  }))
                }
                className="mt-1"
              />
              <span>
                Подтверждаю, что имею право на мониторинг этого endpoint и не
                буду использовать систему для несанкционированного доступа.
              </span>
            </label>

            <div className="flex justify-end">
              <div className="flex flex-wrap justify-end gap-2">
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetMonitorForm}
                    disabled={creatingMonitor}
                  >
                    Отменить редактирование
                  </Button>
                )}
                <Button
                  onClick={handleSubmitMonitor}
                  disabled={
                    creatingMonitor ||
                    !newMonitor.name.trim() ||
                    !newMonitor.url.trim() ||
                    !newMonitor.legalConfirmed
                  }
                >
                  {isEditing ? (
                    <>
                      <Pencil className="mr-2 h-4 w-4" />
                      {creatingMonitor
                        ? "Сохранение..."
                        : "Сохранить изменения"}
                    </>
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      {creatingMonitor ? "Создание..." : "Добавить монитор"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {monitorError && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
              {monitorError}
            </div>
          )}

          {monitorSuccess && (
            <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300">
              {monitorSuccess}
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Список мониторов</h4>
            {monitors.length === 0 ? (
              <div className="rounded-md border border-dashed px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Мониторов пока нет. Создайте первый монитор выше или
                  перенесите готовый запрос из вкладки тестирования.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {monitors.map((monitor) => (
                  <div
                    key={monitor.id}
                    className={`flex items-start gap-2 rounded-md border p-3 transition-colors ${
                      selectedMonitorId === monitor.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-input hover:bg-muted/60"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedMonitorId(monitor.id)}
                      className="flex-1 text-left"
                    >
                      <p className="text-sm font-medium">{monitor.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {monitor.url}
                      </p>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleMonitorActive(monitor)}
                        title={
                          monitor.active
                            ? "Поставить монитор на паузу"
                            : "Возобновить монитор"
                        }
                        aria-pressed={monitor.active}
                        className="flex items-center gap-2 rounded-full px-1 py-1 transition-colors hover:bg-muted/70"
                      >
                        <span
                          className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-[background-color,border-color,box-shadow] duration-200 ease-out ${
                            monitor.active
                              ? "border-emerald-500 bg-emerald-500/90 shadow-[0_0_0_1px_rgba(16,185,129,0.12)] dark:border-emerald-400 dark:bg-emerald-500"
                              : "border-zinc-300 bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-700"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-[transform,box-shadow] duration-200 ease-out ${
                              monitor.active ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </span>
                        <span
                          className={`inline-block min-w-[4.75rem] text-left text-xs font-medium transition-colors ${
                            monitor.active
                              ? "text-emerald-700 dark:text-emerald-300"
                              : "text-zinc-500 dark:text-zinc-400"
                          }`}
                        >
                          {monitor.active ? "Активен" : "Пауза"}
                        </span>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEditMonitor(monitor)}
                        title="Редактировать монитор"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-600"
                        disabled={deletingMonitorId === monitor.id}
                        onClick={() => handleDeleteMonitor(monitor.id)}
                        title="Удалить монитор"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedMonitor && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Активных мониторов"
              icon={<Activity className="h-4 w-4" />}
              value={monitoringSummary.activeMonitors}
            />
            <MetricCard
              title="Проверок"
              icon={<CheckCircle className="h-4 w-4 text-green-600" />}
              value={monitoringSummary.runsForMonitor}
            />
            <MetricCard
              title="Uptime"
              icon={<Badge className="h-4 px-1">%</Badge>}
              value={`${monitoringSummary.uptime}%`}
            />
            <MetricCard
              title="Средний отклик"
              icon={<Clock className="h-4 w-4 text-blue-600" />}
              value={`${monitoringSummary.avgResponse} мс`}
            />
          </div>

          <div className="rounded-md border p-3 text-sm">
            <p>
              <span className="font-medium">Выбранный монитор:</span>{" "}
              {selectedMonitor.name}
            </p>
            <p className="text-muted-foreground">{selectedMonitor.url}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">{selectedMonitor.method}</Badge>
              <Badge variant="outline">
                {selectedMonitor.active ? "Активен" : "На паузе"}
              </Badge>
              <Badge variant="outline">
                Статус: {selectedMonitor.expected_status}
              </Badge>
              <Badge variant="outline">
                Каждые {selectedMonitor.interval_minutes} мин
              </Badge>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle className="text-base">
                  Отклик сервера по последним запускам
                </CardTitle>

                <div className="flex flex-wrap gap-2">
                  {CHART_RANGE_OPTIONS.map((option) => {
                    const isActive = chartRange === option.value;

                    return (
                      <Button
                        key={option.value}
                        type="button"
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => setChartRange(option.value)}
                        className="h-8 px-3"
                      >
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-64">
              {hasResponseTrendData ? (
                <div className="flex h-full flex-col gap-2">
                  {selectedMonitorResponseTrend.isCompacted && (
                    <p className="text-xs text-muted-foreground">
                      Показано {selectedMonitorResponseTrend.points.length}{" "}
                      усредненных отрезков из{" "}
                      {selectedMonitorResponseTrend.sourceCount} запусков, чтобы
                      график не сливался.
                    </p>
                  )}
                  <div className="min-h-0 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={selectedMonitorResponseTrend.points}
                        margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="responseTimeStroke"
                            x1="0"
                            x2="1"
                            y1="0"
                            y2="0"
                          >
                            <stop offset="0%" stopColor="#0ea5e9" />
                            <stop offset="100%" stopColor="#2563eb" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          stroke="currentColor"
                          strokeDasharray="4 8"
                          strokeOpacity={0.14}
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          interval={chartTickInterval}
                          minTickGap={36}
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tickFormatter={(value) => `${value} ms`}
                          width={70}
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            borderRadius: 12,
                            border: "1px solid hsl(var(--border))",
                            boxShadow: "0 18px 40px rgba(15, 23, 42, 0.2)",
                            color: "hsl(var(--popover-foreground))",
                          }}
                          itemStyle={{
                            color: "hsl(var(--popover-foreground))",
                          }}
                          labelStyle={{
                            color: "hsl(var(--popover-foreground))",
                            fontWeight: 600,
                            marginBottom: 4,
                          }}
                          formatter={(value, _name, item) => {
                            const payload = item.payload as
                              | ResponseTrendPoint
                              | undefined;

                            if (typeof value !== "number") {
                              return ["Нет данных", "Отклик"];
                            }

                            return [
                              payload?.isAggregated
                                ? `${value} ms в среднем`
                                : `${value} ms`,
                              payload?.isAggregated
                                ? `Отклик (${payload.runCount} запусков)`
                                : "Отклик",
                            ];
                          }}
                          labelFormatter={(_label, payload) => {
                            const point = payload[0]?.payload as
                              | ResponseTrendPoint
                              | undefined;

                            return point?.isAggregated
                              ? `Период: ${point.tooltipLabel}`
                              : `Запуск: ${point?.tooltipLabel ?? "нет данных"}`;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="responseTime"
                          stroke="url(#responseTimeStroke)"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          dot={
                            shouldShowChartDots
                              ? {
                                  r: 3,
                                  fill: "#ffffff",
                                  stroke: "#2563eb",
                                  strokeWidth: 2,
                                }
                              : false
                          }
                          activeDot={{ r: 6, strokeWidth: 2 }}
                          connectNulls={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Пока нет замеров времени отклика для выбранного монитора.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Field({
  children,
  className,
  htmlFor,
  label,
}: {
  children: ReactNode;
  className?: string;
  htmlFor: string;
  label: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`.trim()}>
      <label
        className="text-xs font-medium text-muted-foreground"
        htmlFor={htmlFor}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
