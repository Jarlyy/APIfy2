# APIfy2 Architecture Overview

## Назначение

`APIfy2` — это Next.js-приложение для ручного тестирования API, генерации тестов с помощью AI, импорта OpenAPI/Swagger-спецификаций и мониторинга endpoint'ов по расписанию.

Этот файл является каноническим источником высокоуровневой архитектуры проекта. Детальные продуктовые и implementation-документы вынесены в отдельные файлы:

- [PRD](./prd.md)
- [Development Plan](./development-plan.md)
- [Monitoring Notes](./monitoring.md)
- [Terms of Service (Draft)](./legal/terms-of-service.md)
- [Privacy Policy (Draft)](./legal/privacy-policy.md)
- [Acceptable Use Policy (Draft)](./legal/acceptable-use-policy.md)
- [CORS Guide](./cors-guide.md)
- [CORS Bypass](./CORS_BYPASS.md)
- [CORS Bypass RU](./CORS_BYPASS_RU.md)

## Архитектурный срез

Проект построен на App Router в Next.js 16 и делится на четыре основных слоя:

1. UI-слой в `app/` и `components/`, где пользователь работает с dashboard, ручным тестированием, импортом OpenAPI и историей запусков.
2. API-слой в `app/api/`, где находятся route handlers для AI-функций, проксирования запросов, тестовых интеграций и мониторинга.
3. Слой доменной логики в `lib/`, где собраны утилиты для AI-провайдеров, CORS proxy, favorites, истории тестов, monitoring и alerts.
4. Слой хранения и аутентификации на Supabase, подключаемый через `lib/supabase/*` и SQL-схему в `supabase/schema.sql`.

## Основные пользовательские маршруты

- `app/page.tsx`: корневой маршрут, сразу перенаправляет пользователя на `/dashboard`.
- `app/dashboard/page.tsx`: основной рабочий экран приложения с `Header` и `MainWorkspace`.
- `app/login/page.tsx` и `app/signup/page.tsx`: пользовательская аутентификация.
- `app/test-ai-analysis/page.tsx`, `app/test-openapi/page.tsx`, `app/test-providers/page.tsx`: служебные страницы для проверки интеграций и сценариев разработки.

## Ключевые UI-модули

- `components/MainWorkspace.tsx`: контейнер верхнего уровня для вкладок `testing`, `favorites`, `import`, `monitoring`, `analytics`, `history`.
- `components/UnifiedApiTester.tsx`: центральный сценарий ручного тестирования и AI-генерации исполняемых тестов.
- `components/OpenApiImport.tsx`: импорт и разбор OpenAPI/Swagger-спецификаций.
- `components/MonitoringTab.tsx`: отдельная dashboard-вкладка для создания мониторинга, списка мониторов и просмотра recent response-time runs.
- `components/RequestAnalyticsTab.tsx`: отдельная dashboard-вкладка для аналитики по сохранённой истории ручных API-запросов.
- `components/HistoryTab.tsx` и `components/FavoritesTab.tsx`: работа с сохранёнными запросами пользователя.
- `components/Header.tsx`: навигация по workspace, горизонтальный scroll вкладок на узких экранах и пользовательский light/dark toggle.
- `components/AiAnalysis.tsx` и `components/AIProviderSelector.tsx`: AI-анализ и выбор AI-провайдера.

## Серверные маршруты

### AI и генерация

- `app/api/ai/analyze/route.ts`: генерация и анализ AI-сценариев.
- `app/api/ai/analyze-response/route.ts`: AI-анализ ответов API.
- `app/api/test-generation/route.ts`: генерация тестов.
- `app/api/gemini-models/route.ts`: получение списка моделей Gemini.

### Интеграции и прокси

- `app/api/proxy/route.ts`: серверный прокси для обхода клиентских CORS-ограничений.
- `app/api/test-providers/route.ts`, `app/api/test-gemini-direct/route.ts`, `app/api/test-mimo-direct/route.ts`: отладочные и интеграционные маршруты для AI-провайдеров.

### Мониторинг

- `app/api/monitor/run/route.ts`: cron/job runner для запуска регулярных проверок мониторинга.

## Data Flow

### Ручное тестирование

1. Пользователь открывает `/dashboard`.
2. `MainWorkspace` активирует вкладку `testing`.
3. `UnifiedApiTester` формирует запрос, при необходимости применяет настройки CORS proxy и аутентификации.
4. Выполнение идёт либо напрямую, либо через `app/api/proxy/route.ts`.
5. Результат сохраняется в историю и может быть добавлен в избранное.

### AI-генерация тестов

1. Пользователь вводит имя сервиса в `UnifiedApiTester`.
2. UI отправляет запрос в `/api/ai/analyze`.
3. Сервер использует доменные модули из `lib/ai-*` и провайдеров для получения и нормализации результата.
4. UI получает список исполняемых тестов и позволяет запускать их по одному или пачкой.

### Monitoring

1. Конфигурации мониторинга сохраняются в Supabase.
2. `app/api/monitor/run/route.ts` запускается по расписанию.
3. Логика проверки использует `lib/monitoring.ts` и `lib/alerts.ts`.
4. Результаты запусков и каналы уведомлений записываются в БД и затем попадают в dashboard-аналитику.

## Слой данных и auth

- `lib/supabase/client.ts`: browser-клиент для client components.
- `lib/supabase/server.ts`: server-клиент для server-side сценариев и route handlers.
- `lib/supabase/admin.ts`: service-role клиент для задач, требующих повышенных прав, включая monitoring/alerts.
- `hooks/useAuth.ts`: клиентский hook для получения текущего пользователя и подписки на изменение auth state.
- `lib/types/database.types.ts`: типы схемы БД.
- `supabase/schema.sql`: каноническая SQL-схема проекта.

## Важные технические ограничения

- Пакетный менеджер проекта: `bun`.
- Dev-сервер управляется пользователем и не должен запускаться/останавливаться агентом.
- Канонический lint-tooling проекта: `Biome` через `biome.json` и `package.json` scripts.
- В `app/layout.tsx` используются `next/font/google`, поэтому в ограниченных сетевых средах возможны сбои при получении шрифтов.

## Основные директории

- `app/`: маршруты App Router и route handlers.
- `components/`: UI-компоненты workspace и shadcn-based primitives.
- `hooks/`: React hooks, связанные с приложением.
- `lib/`: общая доменная и инфраструктурная логика.
- `public/`: статические ассеты.
- `supabase/`: схема и артефакты БД.
- `memory_bank/`: операционная документация агента.

## Актуальные архитектурные пробелы

- Полная визуальная консистентность светлой и тёмной тем между dashboard и рабочими экранами ещё не доведена до конца.
- Мониторинг всё ещё завязан на текущий cron/job-runner и ожидает отдельной миграции на альтернативный cron-сервис.
- Метаданные приложения в `app/layout.tsx` пока остаются дефолтными и не отражают продуктовую идентичность `APIfy2`.
