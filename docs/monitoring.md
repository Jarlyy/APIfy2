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

На Vercel можно настроить Cron Job на `POST /api/monitor/run`.

Пример:
- путь: `/api/monitor/run`
- период: `*/5 * * * *`
- заголовок: `Authorization: Bearer <MONITOR_CRON_SECRET>`

## Переменные окружения

- `MONITOR_CRON_SECRET` — секрет для запуска cron-эндпоинта
- `SUPABASE_SERVICE_ROLE_KEY` — серверный ключ для системных операций мониторинга

Для email-алертов через Resend (опционально, хранится в `alert_channels.config`):
- `resendApiKey`
- `from`
- `to`

Для Telegram (в `alert_channels.config`):
- `botToken`
- `chatId`

Для Slack (в `alert_channels.config`):
- `webhookUrl`
