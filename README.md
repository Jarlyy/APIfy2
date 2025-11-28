# APIfy - API Testing Application

Веб-приложение для проверки работоспособности API-сервисов.

## Технологический стек

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend & Auth**: Supabase
- **Package Manager**: pnpm

## Установка и настройка

### 1. Установка зависимостей

```bash
pnpm install
```

### 2. Настройка Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. Скопируйте `.env.local` и заполните переменные окружения:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

3. Выполните SQL скрипт из файла `supabase/schema.sql` в SQL Editor вашего проекта Supabase

### 3. Запуск приложения

```bash
pnpm dev
```

Приложение будет доступно по адресу [http://localhost:3000](http://localhost:3000)

## Структура проекта

```
├── app/
│   ├── dashboard/          # Главная страница с формой тестирования
│   ├── history/            # История тестов
│   ├── login/              # Страница входа
│   ├── signup/             # Страница регистрации
│   └── page.tsx            # Корневая страница (редирект)
├── components/
│   ├── ApiTestForm.tsx     # Форма для тестирования API
│   ├── Header.tsx          # Шапка приложения
│   └── TestHistoryList.tsx # Список истории тестов
├── lib/
│   ├── supabase/           # Клиенты Supabase
│   └── types/              # TypeScript типы
└── supabase/
    └── schema.sql          # SQL схема базы данных
```

## Функциональность (MVP)

### Реализовано (Фазы 1-5):

- ✅ Регистрация и аутентификация пользователей
- ✅ Форма для ручного ввода URL API
- ✅ Выбор HTTP методов (GET, POST, PUT, DELETE, PATCH)
- ✅ Добавление заголовков и тела запроса
- ✅ Выполнение запросов к API
- ✅ Отображение результатов (статус, время отклика, тело ответа)
- ✅ Сохранение результатов в базу данных
- ✅ История проверок с фильтрацией
- ✅ Просмотр деталей каждой проверки

### Планируется (Фазы 6-10):

- ⏳ Тестирование различных методов аутентификации
- ⏳ Интеграция с OpenAPI/Swagger
- ⏳ Мониторинг и аналитика
- ⏳ Улучшение UX (избранное, шаблоны, экспорт)
- ⏳ Интеграция нейросети для автоматического поиска API

## База данных

Схема включает следующие таблицы:

- `users` - профили пользователей
- `api_tests` - результаты тестов API
- `test_history` - история запросов
- `api_documentation` - документация API (для будущего использования)

## Разработка

Следуйте плану разработки из `docs/development-plan.md`

## Лицензия

MIT
