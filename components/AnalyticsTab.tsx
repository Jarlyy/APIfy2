"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  type MonitorConfig,
  type MonitoringRun,
  createMonitor,
  deleteMonitor,
  getMonitoringRuns,
  getMonitors,
} from "@/lib/monitoring";
import { type TestHistoryItem, getTestHistory } from "@/lib/test-history";
import {
  Activity,
  CheckCircle,
  Clock,
  FilterX,
  Loader2,
  PlusCircle,
  Trash2,
  XCircle,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const STATUS_COLORS = {
  success: "#22c55e",
  error: "#ef4444",
  pending: "#f59e0b",
};

export default function AnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<TestHistoryItem[]>([]);
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

  const [selectedService, setSelectedService] = useState("all");
  const [selectedEndpoint, setSelectedEndpoint] = useState("all");
  const [newMonitor, setNewMonitor] = useState({
    name: "",
    url: "",
    interval_minutes: 1440,
    sla_target: 99.9,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [historyResult, monitorsResult, runsResult] = await Promise.all([
        getTestHistory(500, 0),
        getMonitors(),
        getMonitoringRuns(500),
      ]);

      if (historyResult.success && historyResult.data)
        setHistory(historyResult.data);
      if (monitorsResult.success && monitorsResult.data) {
        setMonitors(monitorsResult.data);
        if (monitorsResult.data.length > 0) {
          setSelectedMonitorId(monitorsResult.data[0].id);
        }
      }
      if (runsResult.success && runsResult.data)
        setMonitorRuns(runsResult.data);
      setLoading(false);
    };

    load();
  }, []);

  const selectedMonitor = useMemo(
    () => monitors.find((m) => m.id === selectedMonitorId) ?? null,
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
    const success = selectedMonitorRuns.filter((r) => r.success).length;
    const uptime = total ? Number(((success / total) * 100).toFixed(2)) : 0;
    const avgResponse = total
      ? Math.round(
          selectedMonitorRuns
            .map((r) => r.response_time_ms || 0)
            .reduce((acc, n) => acc + n, 0) / total,
        )
      : 0;

    return {
      activeMonitors: monitors.filter((m) => m.active).length,
      runsForMonitor: total,
      uptime,
      avgResponse,
    };
  }, [selectedMonitorRuns, monitors]);

  const uptimeByDay = useMemo(() => {
    const grouped = new Map<string, { total: number; success: number }>();

    selectedMonitorRuns.forEach((run) => {
      const day = new Date(run.executed_at).toISOString().slice(0, 10);
      if (!grouped.has(day)) grouped.set(day, { total: 0, success: 0 });
      const d = grouped.get(day)!;
      d.total += 1;
      if (run.success) d.success += 1;
    });

    return [...grouped.entries()]
      .map(([day, value]) => ({
        day,
        uptime: value.total
          ? Number(((value.success / value.total) * 100).toFixed(2))
          : 0,
      }))
      .sort((a, b) => a.day.localeCompare(b.day));
  }, [selectedMonitorRuns]);

  const serviceOptions = useMemo(() => {
    const counter = new Map<string, number>();
    history.forEach((item) => {
      if (!item.service_name) return;
      counter.set(item.service_name, (counter.get(item.service_name) || 0) + 1);
    });

    return [...counter.entries()].sort((a, b) => b[1] - a[1]);
  }, [history]);

  const endpointOptions = useMemo(() => {
    if (selectedService === "all") return [];

    const counter = new Map<string, number>();
    history
      .filter((item) => item.service_name === selectedService)
      .forEach((item) => {
        if (!item.url) return;
        counter.set(item.url, (counter.get(item.url) || 0) + 1);
      });

    return [...counter.entries()].sort((a, b) => b[1] - a[1]);
  }, [history, selectedService]);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const serviceMatch =
        selectedService === "all" || item.service_name === selectedService;
      const endpointMatch =
        selectedEndpoint === "all" || item.url === selectedEndpoint;
      return serviceMatch && endpointMatch;
    });
  }, [history, selectedService, selectedEndpoint]);

  const stats = useMemo(() => {
    const total = filteredHistory.length;
    const success = filteredHistory.filter(
      (t) => t.test_status === "success",
    ).length;
    const error = filteredHistory.filter(
      (t) => t.test_status === "error",
    ).length;
    const pending = filteredHistory.filter(
      (t) => t.test_status === "pending",
    ).length;
    const values = filteredHistory
      .map((h) => h.response_time)
      .filter((v): v is number => typeof v === "number");
    const avgResponse = values.length
      ? Math.round(values.reduce((acc, v) => acc + v, 0) / values.length)
      : 0;
    const successRate = total ? Math.round((success / total) * 100) : 0;

    return { total, success, error, pending, avgResponse, successRate };
  }, [filteredHistory]);

  const statusPieData = useMemo(
    () =>
      [
        { name: "Success", value: stats.success, color: STATUS_COLORS.success },
        { name: "Error", value: stats.error, color: STATUS_COLORS.error },
        { name: "Pending", value: stats.pending, color: STATUS_COLORS.pending },
      ].filter((item) => item.value > 0),
    [stats],
  );

  const responseTrend = useMemo(() => {
    return [...filteredHistory]
      .reverse()
      .slice(0, 30)
      .map((item, index) => ({
        idx: index + 1,
        response: item.response_time || 0,
      }));
  }, [filteredHistory]);

  const performanceRows = useMemo(() => {
    const keyMode = selectedService === "all" ? "service" : "endpoint";
    const map = new Map<
      string,
      {
        total: number;
        success: number;
        responseTotal: number;
        responseCount: number;
      }
    >();

    filteredHistory.forEach((item) => {
      const key =
        keyMode === "service"
          ? item.service_name || "Unknown"
          : item.url || "Unknown";
      if (!map.has(key))
        map.set(key, {
          total: 0,
          success: 0,
          responseTotal: 0,
          responseCount: 0,
        });
      const row = map.get(key)!;
      row.total += 1;
      if (item.test_status === "success") row.success += 1;
      if (typeof item.response_time === "number") {
        row.responseTotal += item.response_time;
        row.responseCount += 1;
      }
    });

    return [...map.entries()]
      .map(([name, row]) => ({
        name,
        total: row.total,
        successRate: row.total
          ? Math.round((row.success / row.total) * 100)
          : 0,
        avgResponse: row.responseCount
          ? Math.round(row.responseTotal / row.responseCount)
          : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filteredHistory, selectedService]);

  const resetFilters = () => {
    setSelectedService("all");
    setSelectedEndpoint("all");
  };

  const handleCreateMonitor = async () => {
    if (!newMonitor.name.trim() || !newMonitor.url.trim()) return;

    setCreatingMonitor(true);
    setMonitorError(null);
    setMonitorSuccess(null);

    const result = await createMonitor({
      name: newMonitor.name.trim(),
      url: newMonitor.url.trim(),
      interval_minutes: newMonitor.interval_minutes,
      sla_target: newMonitor.sla_target,
    });

    if (result.success && result.data) {
      setMonitors((prev) => [result.data!, ...prev]);
      setSelectedMonitorId(result.data.id);
      setNewMonitor({
        name: "",
        url: "",
        interval_minutes: 1440,
        sla_target: 99.9,
      });
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

    setMonitors((prev) => prev.filter((m) => m.id !== monitorId));
    setMonitorRuns((prev) =>
      prev.filter((run) => run.monitor_id !== monitorId),
    );

    if (selectedMonitorId === monitorId) {
      const next = monitors.find((m) => m.id !== monitorId);
      setSelectedMonitorId(next?.id || null);
    }

    setMonitorSuccess("Монитор удален.");
    setDeletingMonitorId(null);
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
        <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
        Загрузка аналитики...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Мониторинг по расписанию</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <label
                className="text-xs font-medium text-muted-foreground"
                htmlFor="monitor-name"
              >
                Название
              </label>
              <Input
                id="monitor-name"
                placeholder="Название монитора"
                value={newMonitor.name}
                onChange={(e) =>
                  setNewMonitor((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <label
                className="text-xs font-medium text-muted-foreground"
                htmlFor="monitor-endpoint"
              >
                Эндпоинт
              </label>
              <Input
                id="monitor-endpoint"
                placeholder="https://api.example.com/health"
                value={newMonitor.url}
                onChange={(e) =>
                  setNewMonitor((prev) => ({ ...prev, url: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <label
                className="text-xs font-medium text-muted-foreground"
                htmlFor="monitor-interval"
              >
                Интервал проверок (в минутах)
              </label>
              <Input
                id="monitor-interval"
                type="number"
                min={1440}
                step={60}
                value={newMonitor.interval_minutes}
                onChange={(e) =>
                  setNewMonitor((prev) => ({
                    ...prev,
                    interval_minutes: Number(e.target.value || 1440),
                  }))
                }
                placeholder="Например, 1440 = 1 раз в день"
              />
            </div>
            <Button
              className="self-end"
              onClick={handleCreateMonitor}
              disabled={creatingMonitor || !newMonitor.name || !newMonitor.url}
            >
              <PlusCircle className="mr-2 h-4 w-4" />{" "}
              {creatingMonitor ? "Создание..." : "Добавить монитор"}
            </Button>
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
                  <button
                    key={monitor.id}
                    onClick={() => setSelectedMonitorId(monitor.id)}
                    className={`w-full rounded-md border p-3 text-left transition-colors ${
                      selectedMonitorId === monitor.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-input hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{monitor.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {monitor.url}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={monitor.active ? "default" : "secondary"}
                        >
                          {monitor.active ? "Активен" : "Пауза"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600"
                          disabled={deletingMonitorId === monitor.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMonitor(monitor.id);
                          }}
                          title="Удалить монитор"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

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
                  title="Ср. отклик"
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
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={uptimeByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="uptime"
                      stroke="#22c55e"
                      fill="#22c55e33"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Фильтры аналитики</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <label className="text-sm">
            <span className="mb-2 block text-zinc-600 dark:text-zinc-400">
              Сервис
            </span>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={selectedService}
              onChange={(e) => {
                setSelectedService(e.target.value);
                setSelectedEndpoint("all");
              }}
            >
              <option value="all">Все сервисы</option>
              {serviceOptions.map(([name, count]) => (
                <option key={name} value={name}>
                  {name} ({count})
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-2 block text-zinc-600 dark:text-zinc-400">
              Эндпоинт
            </span>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={selectedEndpoint}
              onChange={(e) => setSelectedEndpoint(e.target.value)}
              disabled={selectedService === "all"}
            >
              <option value="all">Все эндпоинты</option>
              {endpointOptions.map(([url, count]) => (
                <option key={url} value={url}>
                  {url} ({count})
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={resetFilters}
              className="w-full"
              disabled={selectedService === "all" && selectedEndpoint === "all"}
            >
              <FilterX className="mr-2 h-4 w-4" /> Сбросить фильтры
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Всего тестов"
          icon={<Activity className="h-4 w-4" />}
          value={stats.total}
        />
        <MetricCard
          title="Успешные"
          icon={<CheckCircle className="h-4 w-4 text-green-600" />}
          value={stats.success}
        />
        <MetricCard
          title="Ошибки"
          icon={<XCircle className="h-4 w-4 text-red-600" />}
          value={stats.error}
        />
        <MetricCard
          title="Успешность"
          icon={<Badge className="h-4 px-1">%</Badge>}
          value={`${stats.successRate}%`}
        />
        <MetricCard
          title="Средний отклик"
          icon={<Clock className="h-4 w-4 text-blue-600" />}
          value={`${stats.avgResponse} мс`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Тренд времени отклика (последние 30 тестов)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={responseTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="idx" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="response"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Распределение статусов</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {statusPieData.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Нет данных для отображения.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label
                  >
                    {statusPieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedService === "all"
              ? "Сравнение сервисов"
              : "Сравнение эндпоинтов"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {performanceRows.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Пока нет данных для аналитики.
            </p>
          ) : (
            <div className="space-y-6">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceRows}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" hide />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="avgResponse"
                      fill="#8b5cf6"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-zinc-600 dark:text-zinc-400">
                      <th className="py-2 pr-3">
                        {selectedService === "all" ? "Сервис" : "Эндпоинт"}
                      </th>
                      <th className="py-2 pr-3">Тестов</th>
                      <th className="py-2 pr-3">Успешность</th>
                      <th className="py-2 pr-3">Ср. отклик</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceRows.map((row) => (
                      <tr key={row.name} className="border-b last:border-0">
                        <td className="py-2 pr-3 font-medium">{row.name}</td>
                        <td className="py-2 pr-3">{row.total}</td>
                        <td className="py-2 pr-3">{row.successRate}%</td>
                        <td className="py-2 pr-3">{row.avgResponse} мс</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
}: { title: string; value: string | number; icon: ReactNode }) {
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
