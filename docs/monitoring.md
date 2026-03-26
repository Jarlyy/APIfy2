# Scheduled Monitoring (Cron / Job Runner)

## Что добавлено

- API route: `POST /api/monitor/run`
- Таблицы БД:
  - `monitor_configs` — конфиги мониторинга
  - `monitor_runs` — история прогонов
  - `alert_channels` — каналы уведомлений
- Аналитика:
  - SLA/Uptime карточки
  - Uptime timeline (по дням)
  - Быстрое создание мониторинга из UI аналитики

## Как запустить cron

Рекомендуемый вариант: `cron-job.org` с вызовом `/api/monitor/run` каждые 1-5 минут (роут поддерживает `GET` и `POST`).

Пример:
- путь: `/api/monitor/run`
- период: `*/1 * * * *`
- заголовок: `Authorization: Bearer <MONITOR_CRON_SECRET>`

## Переменные окружения

- `MONITOR_CRON_SECRET` — секрет для запуска cron-эндпоинта
- `SUPABASE_SERVICE_ROLE_KEY` — серверный ключ для системных операций мониторинга

## Базовые guardrails (security/compliance)

- Endpoint `/api/monitor/run` требует корректный `MONITOR_CRON_SECRET`.
- На endpoint включено ограничение частоты запросов (rate limiting).
- Локальные/приватные URL в конфигурации мониторинга запрещены.
- Нельзя передавать чувствительные секреты в query-параметрах URL (используйте заголовки).
- При создании монитора пользователь подтверждает право на мониторинг endpoint.

## Публичные legal-документы

- [Terms of Service (Draft)](./legal/terms-of-service.md)
- [Privacy Policy (Draft)](./legal/privacy-policy.md)
- [Acceptable Use Policy (Draft)](./legal/acceptable-use-policy.md)

Для email-алертов через Resend (опционально, хранится в `alert_channels.config`):
- `resendApiKey`
- `from`
- `to`

Для Telegram (в `alert_channels.config`):
- `botToken`
- `chatId`

Для Slack (в `alert_channels.config`):
- `webhookUrl`


## Ограничение Vercel Hobby

- На Hobby cron должен запускаться не чаще 1 раза в сутки.
- Для частых проверок (каждые N минут/часов) нужен Pro-план.
