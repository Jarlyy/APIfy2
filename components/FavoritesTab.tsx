"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  type FavoriteItem,
  getFavoriteStats,
  getFavorites,
  removeFromFavorites,
} from "@/lib/favorites";
import {
  CheckCircle,
  Heart,
  Loader2,
  Play,
  RefreshCw,
  Star,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

interface FavoritesTabProps {
  userId: string;
}

export default function FavoritesTab({ userId }: FavoritesTabProps) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
    visible: boolean;
  }>({ message: "", type: "success", visible: false });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    visible: boolean;
    item: FavoriteItem | null;
  }>({ visible: false, item: null });

  useEffect(() => {
    loadFavorites();
    loadStats();
  }, []);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 5000);
  };

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const result = await getFavorites(100);
      if (result.success && result.data) {
        setFavorites(result.data);
      } else {
        console.error("Ошибка загрузки избранного:", result.error);
      }
    } catch (error) {
      console.error("Ошибка загрузки избранного:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await getFavoriteStats();
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Ошибка загрузки статистики:", error);
    }
  };

  const handleRemoveFavorite = async (id: string) => {
    try {
      const result = await removeFromFavorites(id);
      if (result.success) {
        setFavorites((prev) => prev.filter((item) => item.id !== id));
        loadStats();
        showNotification("Тест удален из избранного", "success");
      } else {
        showNotification(`Ошибка удаления: ${result.error}`, "error");
      }
    } catch (error) {
      console.error("Ошибка удаления из избранного:", error);
      showNotification("Ошибка удаления из избранного", "error");
    }
    setDeleteConfirm({ visible: false, item: null });
  };

  const confirmDelete = (item: FavoriteItem) => {
    setDeleteConfirm({ visible: true, item });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("ru-RU");
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case "GET":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "POST":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "PUT":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "DELETE":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "PATCH":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      default:
        return "bg-zinc-100 text-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-400";
    }
  };

  // Функция для перехода к ручному тестированию с данными избранного теста
  const goToManualTest = (item: FavoriteItem) => {
    if (!item.url || !item.method) {
      showNotification("Недостаточно данных для запуска теста", "error");
      return;
    }

    // Подготавливаем данные для передачи
    const testData = {
      serviceName: item.service_name || item.name || "Избранный тест",
      url: item.url,
      method: item.method,
      headers: item.headers || {},
      body: item.body || "",
      authType: item.auth_type || "none",
      authToken: item.auth_data?.token || item.auth_data?.apiKey || "",
    };

    // Сохраняем данные в localStorage для передачи между компонентами
    localStorage.setItem("pendingTestData", JSON.stringify(testData));

    // Переходим на вкладку тестирования
    const url = new URL(window.location.href);
    url.searchParams.set("tab", "testing");
    window.history.pushState({}, "", url.toString());

    // Перезагружаем страницу чтобы данные подтянулись
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          Загрузка избранного...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Уведомления */}
      {notification.visible && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border animate-slide-in ${
            notification.type === "success"
              ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200"
              : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
            <button
              onClick={() =>
                setNotification((prev) => ({ ...prev, visible: false }))
              }
              className="ml-2 text-current opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Избранные тесты
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Сохраненные шаблоны API тестов для быстрого доступа
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={loadFavorites}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Обновить
          </Button>
        </div>
      </div>

      {/* Статистика */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Всего тестов</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(stats.byMethod).length}
              </div>
              <div className="text-sm text-muted-foreground">HTTP методов</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {stats.byService.length}
              </div>
              <div className="text-sm text-muted-foreground">Сервисов</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">
                {stats.byMethod.GET || 0}
              </div>
              <div className="text-sm text-muted-foreground">GET запросов</div>
            </CardContent>
          </Card>
        </div>
      )}

      {favorites.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-zinc-600 dark:text-zinc-400 mb-2">
              У вас пока нет избранных тестов
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              Добавьте тесты в избранное на вкладке "Тестирование" для быстрого
              доступа
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {favorites.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <Badge
                      variant="outline"
                      className={getMethodColor(item.method)}
                    >
                      {item.method}
                    </Badge>
                    <h3 className="font-medium">
                      {item.name || item.service_name || "Без названия"}
                    </h3>
                    {item.auth_type && item.auth_type !== "none" && (
                      <Badge variant="secondary" className="text-xs">
                        🔒 {item.auth_type}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => goToManualTest(item)}
                      disabled={!item.url}
                      size="sm"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Использовать
                    </Button>
                    <Button
                      onClick={() => confirmDelete(item)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Удалить
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(item.created_at || "")}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4 font-mono">
                  {item.url}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Сервис
                    </p>
                    <p className="text-sm font-bold text-blue-600">
                      {item.service_name || "Не указан"}
                    </p>
                  </div>

                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Аутентификация
                    </p>
                    <p className="text-sm font-bold text-purple-600">
                      {item.auth_type === "none" || !item.auth_type
                        ? "Без аутентификации"
                        : item.auth_type}
                    </p>
                  </div>
                </div>

                {/* Заголовки */}
                {item.headers && Object.keys(item.headers).length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                      Показать заголовки ({Object.keys(item.headers).length})
                    </summary>
                    <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-x-auto">
                      {JSON.stringify(item.headers, null, 2)}
                    </pre>
                  </details>
                )}

                {/* Тело запроса */}
                {item.body && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                      Показать тело запроса
                    </summary>
                    <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-x-auto">
                      {item.body}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Модальное окно подтверждения удаления */}
      {deleteConfirm.visible && deleteConfirm.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-800">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Удалить из избранного?
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Вы уверены, что хотите удалить тест "{deleteConfirm.item.name}"
                из избранного? Это действие нельзя отменить.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setDeleteConfirm({ visible: false, item: null })}
                variant="outline"
                size="sm"
              >
                Отмена
              </Button>
              <Button
                onClick={() => handleRemoveFavorite(deleteConfirm.item?.id!)}
                variant="destructive"
                size="sm"
              >
                Удалить
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
