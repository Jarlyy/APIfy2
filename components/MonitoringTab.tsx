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
} from "@/lib/monitoring";
import type { PendingMonitorData } from "@/lib/pending-monitor-data";
import {
  Activity,
  CheckCircle,
  Clock,
  Loader2,
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

export default function MonitoringTab({ monitorDraft }: MonitoringTabProps) {
  const [loading, setLoading] = useState(true);
  const [monitorRuns, setMonitorRuns] = useState<MonitoringRun[]>([]);
  const [monitors, setMonitors] = useState<MonitorConfig[]>([]);
  const [selectedMonitorId, setSelectedMonitorId] = useState<string | null>(
    null,
  );
  const [creatingMonitor, setCreatingMonitor] = useState(false);
  const [deletingMonitorId, setDeletingMonitorId] = useState<string | null>(
    null,
  );
  const [monitorError, setMonitorError] = useState<string | null>(null);
  const [monitorSuccess, setMonitorSuccess] = useState<string | null>(null);
  const [newMonitor, setNewMonitor] = useState(DEFAULT_MONITOR_FORM);

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
    const formatter = new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    return [...selectedMonitorRuns]
      .sort(
        (a, b) =>
          new Date(a.executed_at).getTime() - new Date(b.executed_at).getTime(),
      )
      .slice(-30)
      .map((run) => ({
        label: formatter.format(new Date(run.executed_at)),
        responseTime: run.response_time_ms,
      }));
  }, [selectedMonitorRuns]);

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

  const handleCreateMonitor = async () => {
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

    const result = await createMonitor({
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
    });

    if (result.success && result.data) {
      setMonitors((prev) => [result.data, ...prev]);
      setSelectedMonitorId(result.data.id);
      setNewMonitor(DEFAULT_MONITOR_FORM);
      setMonitorSuccess("Монитор успешно создан.");
    } else {
      setMonitorError(result.error || "Не удалось создать монитор.");
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

    setMonitorSuccess("Монитор удалён.");
    setDeletingMonitorId(null);
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
          <CardTitle>Мониторинг</CardTitle>
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
              <Button
                onClick={handleCreateMonitor}
                disabled={
                  creatingMonitor ||
                  !newMonitor.name.trim() ||
                  !newMonitor.url.trim() ||
                  !newMonitor.legalConfirmed
                }
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                {creatingMonitor ? "Создание..." : "Добавить монитор"}
              </Button>
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
              <p className="text-sm text-muted-foreground">
                Мониторов пока нет. Создайте первый монитор выше.
              </p>
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
                      <Badge variant={monitor.active ? "default" : "secondary"}>
                        {monitor.active ? "Активен" : "Пауза"}
                      </Badge>
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
                Статус: {selectedMonitor.expected_status}
              </Badge>
              <Badge variant="outline">
                Каждые {selectedMonitor.interval_minutes} мин
              </Badge>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Отклик сервера по последним запускам
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {selectedMonitorResponseTrend.some(
                (point) => typeof point.responseTime === "number",
              ) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedMonitorResponseTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      minTickGap={24}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      tickFormatter={(value) => `${value} ms`}
                      width={70}
                    />
                    <Tooltip
                      formatter={(value) =>
                        typeof value === "number"
                          ? [`${value} ms`, "Отклик"]
                          : ["Нет данных", "Отклик"]
                      }
                      labelFormatter={(label) => `Запуск: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="responseTime"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
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
