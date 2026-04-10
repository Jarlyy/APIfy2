"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type TestHistoryItem, getTestHistory } from "@/lib/test-history";
import {
  Activity,
  CheckCircle,
  Clock,
  FilterX,
  Loader2,
  XCircle,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
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

export default function RequestAnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<TestHistoryItem[]>([]);
  const [selectedService, setSelectedService] = useState("all");
  const [selectedEndpoint, setSelectedEndpoint] = useState("all");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const historyResult = await getTestHistory(500, 0);

      if (historyResult.success && historyResult.data) {
        setHistory(historyResult.data);
      }

      setLoading(false);
    };

    load();
  }, []);

  const serviceOptions = useMemo(() => {
    const counter = new Map<string, number>();

    history.forEach((item) => {
      if (!item.service_name) {
        return;
      }

      counter.set(item.service_name, (counter.get(item.service_name) || 0) + 1);
    });

    return [...counter.entries()].sort((a, b) => b[1] - a[1]);
  }, [history]);

  const endpointOptions = useMemo(() => {
    if (selectedService === "all") {
      return [];
    }

    const counter = new Map<string, number>();

    history
      .filter((item) => item.service_name === selectedService)
      .forEach((item) => {
        if (!item.url) {
          return;
        }

        counter.set(item.url, (counter.get(item.url) || 0) + 1);
      });

    return [...counter.entries()].sort((a, b) => b[1] - a[1]);
  }, [history, selectedService]);

  const filteredHistory = useMemo(
    () =>
      history.filter((item) => {
        const serviceMatch =
          selectedService === "all" || item.service_name === selectedService;
        const endpointMatch =
          selectedEndpoint === "all" || item.url === selectedEndpoint;

        return serviceMatch && endpointMatch;
      }),
    [history, selectedEndpoint, selectedService],
  );

  const stats = useMemo(() => {
    const total = filteredHistory.length;
    const success = filteredHistory.filter(
      (item) => item.test_status === "success",
    ).length;
    const error = filteredHistory.filter(
      (item) => item.test_status === "error",
    ).length;
    const pending = filteredHistory.filter(
      (item) => item.test_status === "pending",
    ).length;
    const values = filteredHistory
      .map((item) => item.response_time)
      .filter((value): value is number => typeof value === "number");
    const avgResponse = values.length
      ? Math.round(
          values.reduce((sum, value) => sum + value, 0) / values.length,
        )
      : 0;
    const successRate = total ? Math.round((success / total) * 100) : 0;

    return { total, success, error, pending, avgResponse, successRate };
  }, [filteredHistory]);

  const statusPieData = useMemo(
    () =>
      [
        {
          name: "Success",
          value: stats.success,
          color: STATUS_COLORS.success,
        },
        { name: "Error", value: stats.error, color: STATUS_COLORS.error },
        {
          name: "Pending",
          value: stats.pending,
          color: STATUS_COLORS.pending,
        },
      ].filter((item) => item.value > 0),
    [stats],
  );

  const responseTrend = useMemo(
    () =>
      [...filteredHistory]
        .reverse()
        .slice(0, 30)
        .map((item, index) => ({
          idx: index + 1,
          response: item.response_time || 0,
        })),
    [filteredHistory],
  );

  const performanceRows = useMemo(() => {
    const keyMode = selectedService === "all" ? "service" : "endpoint";
    const rows = new Map<
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
          ? item.service_name || "Unknown service"
          : item.url || "Unknown endpoint";

      if (!rows.has(key)) {
        rows.set(key, {
          total: 0,
          success: 0,
          responseTotal: 0,
          responseCount: 0,
        });
      }

      const current = rows.get(key);
      if (!current) {
        return;
      }

      current.total += 1;
      if (item.test_status === "success") {
        current.success += 1;
      }
      if (typeof item.response_time === "number") {
        current.responseTotal += item.response_time;
        current.responseCount += 1;
      }
    });

    return [...rows.entries()]
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

  const hasHistory = history.length > 0;
  const hasFilteredHistory = filteredHistory.length > 0;

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
          <CardTitle>Аналитика запросов</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <label className="text-sm">
            <span className="mb-2 block text-zinc-600 dark:text-zinc-400">
              Сервис
            </span>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={selectedService}
              onChange={(event) => {
                setSelectedService(event.target.value);
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
              onChange={(event) => setSelectedEndpoint(event.target.value)}
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
              <FilterX className="mr-2 h-4 w-4" />
              Сбросить фильтры
            </Button>
          </div>
        </CardContent>
      </Card>

      {!hasHistory ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            История запросов пока пуста. Выполните несколько тестов во вкладке
            тестирования, и здесь появятся графики и сравнение сервисов.
          </CardContent>
        </Card>
      ) : !hasFilteredHistory ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              По текущим фильтрам ничего не найдено. Сбросьте фильтры или
              выберите другой сервис.
            </p>
            <Button variant="outline" onClick={resetFilters}>
              Сбросить фильтры
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
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
                <CardTitle>
                  Тренд времени отклика (последние 30 тестов)
                </CardTitle>
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
                    Пока нет данных для этого графика.
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
                            <td className="py-2 pr-3 font-medium">
                              {row.name}
                            </td>
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
        </>
      )}
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
