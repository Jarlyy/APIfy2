# 🚀 Быстрый старт APIfy

## За 5 минут до запуска

### 1. Настройте Supabase (2 минуты)

1. Создайте проект на [supabase.com](https://supabase.com)
2. Скопируйте URL и anon key из Settings → API
3. Вставьте в `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Создайте таблицы (1 минута)

1. Откройте SQL Editor в Supabase
2. Скопируйте содержимое `supabase/schema.sql`
3. Выполните скрипт (Run)

### 3. Запустите приложение (2 минуты)

```bash
bun install
bun dev
```

Откройте http://localhost:3000

## Первый тест API

1. Зарегистрируйтесь
2. На главной странице введите:
   - Название: `Test`
   - URL: `https://jsonplaceholder.typicode.com/posts/1`
   - Метод: `GET`
3. Нажмите "Выполнить запрос"

Готово! 🎉

## Что дальше?

- Посмотрите `docs/api-examples.md` для примеров API
- Изучите `docs/current-status.md` для деталей реализации
- Следуйте `docs/development-plan.md` для следующих фаз

## Помощь

Проблемы? Смотрите `SETUP.md` для подробных инструкций.
